from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.models import User
from auth.email import send_otp_email
from auth.models import PasswordResetOTP
from auth.security import generate_otp, hash_otp, hash_password, verify_dummy, verify_otp, verify_password


class DuplicateEmailError(Exception):
    pass


class InvalidCredentialsError(Exception):
    pass


class GoogleNotConfiguredError(Exception):
    pass


class InvalidOTPError(Exception):
    pass


def _norm(email: str) -> str:
    return email.strip().lower()


def get_user_by_email(db: Session, email: str) -> User | None:
    return db.query(User).filter(User.email == _norm(email)).first()


def register_user(
    db: Session,
    *,
    email: str,
    password: str,
    full_name: str,
    role: str = "trainee",
    country_id: int | None = None,
    language: str = "en",
    tz: str = "UTC",
) -> User:
    email = _norm(email)
    if get_user_by_email(db, email):
        raise DuplicateEmailError("Email already registered")
    user = User(
        # Local auth users have no Keycloak identity; column is nullable for them.
        keycloak_id=None,
        email=email,
        full_name=full_name,
        role=role,
        country_id=country_id,
        language=language,
        timezone=tz,
        hashed_password=hash_password(password),
        google_sub=None,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    if user.role == "trainee":
        from app.crud.user_crud import upsert_profile
        from app.schemas.user import TraineeProfileCreate

        upsert_profile(db, user.id, TraineeProfileCreate())
    return user


def authenticate_user(db: Session, *, email: str, password: str) -> User:
    user = get_user_by_email(db, email)
    if user is None:
        verify_dummy(password)  # keep timing similar for unknown emails
        raise InvalidCredentialsError("Invalid email or password")
    if user.hashed_password is None:
        # Google-only account: never reveal which provider the account uses beyond this.
        raise InvalidCredentialsError("This account uses Google sign-in. Continue with Google.")
    if not verify_password(password, user.hashed_password):
        raise InvalidCredentialsError("Invalid email or password")
    return user


def verify_google_id_token(id_token: str) -> dict:
    """Verify a Google OAuth2 ID token. Isolated so tests can monkeypatch it."""
    if not settings.google_client_id:
        raise GoogleNotConfiguredError("GOOGLE_CLIENT_ID is not configured")
    from google.auth.transport import requests as google_requests
    from google.oauth2 import id_token as google_id_token

    claims = google_id_token.verify_oauth2_token(
        id_token, google_requests.Request(), settings.google_client_id
    )
    if claims.get("iss") not in ("accounts.google.com", "https://accounts.google.com"):
        raise InvalidCredentialsError("Invalid Google token issuer")
    if not claims.get("sub") or not claims.get("email"):
        raise InvalidCredentialsError("Google token missing subject/email")
    return claims


def upsert_google_user(db: Session, *, id_token: str) -> User:
    claims = verify_google_id_token(id_token)
    google_sub = str(claims["sub"])
    email = _norm(str(claims["email"]))
    full_name = str(claims.get("name") or email)

    user = db.query(User).filter(User.google_sub == google_sub).first()
    if user is None:
        user = get_user_by_email(db, email)
    if user is None:
        user = User(
            keycloak_id=None,
            email=email,
            full_name=full_name,
            role="trainee",
            hashed_password=None,
            google_sub=google_sub,
        )
        db.add(user)
    else:
        # Link Google identity to an existing (e.g. password) account with the same email.
        user.google_sub = google_sub
        if not user.full_name:
            user.full_name = full_name
    db.commit()
    db.refresh(user)
    return user


def request_password_reset(db: Session, *, email: str) -> None:
    """Always silent: callers return the same generic 200 whether or not the user exists."""
    user = get_user_by_email(db, email)
    if user is None:
        return
    # Invalidate all prior unused OTPs for this user.
    db.query(PasswordResetOTP).filter(
        PasswordResetOTP.user_id == user.id, PasswordResetOTP.used.is_(False)
    ).update({"used": True}, synchronize_session=False)

    otp = generate_otp()
    record = PasswordResetOTP(
        user_id=user.id,
        otp_hash=hash_otp(user.email, otp),
        expires_at=datetime.now(timezone.utc) + timedelta(minutes=settings.otp_expire_minutes),
        attempts=0,
        used=False,
    )
    db.add(record)
    db.commit()
    try:
        send_otp_email(user.email, otp)
    except Exception:
        # Delivery failure must not leak account existence via a different response.
        pass


def reset_password(db: Session, *, email: str, otp: str, new_password: str) -> None:
    user = get_user_by_email(db, email)
    if user is None:
        raise InvalidOTPError("Invalid or expired OTP")
    record = (
        db.query(PasswordResetOTP)
        .filter(PasswordResetOTP.user_id == user.id, PasswordResetOTP.used.is_(False))
        .order_by(PasswordResetOTP.created_at.desc(), PasswordResetOTP.id.desc())
        .first()
    )
    if record is None:
        raise InvalidOTPError("Invalid or expired OTP")

    expires_at = record.expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at <= datetime.now(timezone.utc):
        record.used = True
        db.commit()
        raise InvalidOTPError("Invalid or expired OTP")

    if record.attempts >= settings.otp_max_attempts:
        record.used = True
        db.commit()
        raise InvalidOTPError("Invalid or expired OTP")

    if not verify_otp(user.email, otp, record.otp_hash):
        record.attempts += 1
        if record.attempts >= settings.otp_max_attempts:
            record.used = True
        db.commit()
        raise InvalidOTPError("Invalid or expired OTP")

    user.hashed_password = hash_password(new_password)
    record.used = True
    db.commit()
