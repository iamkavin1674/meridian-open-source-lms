import hashlib
import hmac
import secrets
from datetime import datetime, timedelta, timezone

import jwt
from pwdlib import PasswordHash

from app.core.config import settings

_password_hash = PasswordHash.recommended()
# Precomputed dummy so login timing does not reveal whether an email exists.
_DUMMY_HASH = _password_hash.hash("dummy-password-for-timing")


def hash_password(password: str) -> str:
    return _password_hash.hash(password)


def verify_password(password: str, hashed: str | None) -> bool:
    if not hashed:
        return False
    try:
        return _password_hash.verify(password, hashed)
    except Exception:
        return False


def verify_dummy(password: str) -> None:
    try:
        _password_hash.verify(password, _DUMMY_HASH)
    except Exception:
        pass


def create_access_token(user_id: int, email: str, role: str, expires_minutes: int | None = None) -> str:
    if not settings.jwt_secret_key:
        raise RuntimeError("JWT_SECRET_KEY is not configured")
    now = datetime.now(timezone.utc)
    minutes = expires_minutes if expires_minutes is not None else settings.access_token_expire_minutes
    payload = {
        "sub": str(user_id),
        "email": email,
        "role": role,
        "iat": now,
        "exp": now + timedelta(minutes=minutes),
    }
    return jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def decode_access_token(token: str) -> dict:
    if not settings.jwt_secret_key:
        raise RuntimeError("JWT_SECRET_KEY is not configured")
    return jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])


def generate_otp() -> str:
    """Cryptographically random 6-digit code, zero-padded."""
    return f"{secrets.randbelow(1_000_000):06d}"


def hash_otp(email: str, otp: str) -> str:
    """Only the hash is stored; the email acts as a per-user salt."""
    return hashlib.sha256(f"{email.strip().lower()}:{otp}".encode("utf-8")).hexdigest()


def verify_otp(email: str, otp: str, otp_hash: str) -> bool:
    return hmac.compare_digest(hash_otp(email, otp), otp_hash)
