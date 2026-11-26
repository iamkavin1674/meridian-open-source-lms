from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.database import get_db
from app.db.models import User
from auth import service
from auth.dependencies import get_current_user
from auth.schemas import (
    ForgotPasswordRequest,
    GoogleAuthRequest,
    LoginRequest,
    MessageResponse,
    RegisterRequest,
    ResetPasswordRequest,
    TokenResponse,
    UserResponse,
)
from auth.security import create_access_token

router = APIRouter(tags=["auth"])

GENERIC_RESET_MESSAGE = "If an account with that email exists, a reset code has been sent."


def _token(user: User) -> TokenResponse:
    try:
        token = create_access_token(user.id, user.email, user.role)
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
    return TokenResponse(
        access_token=token, token_type="bearer", expires_in_minutes=settings.access_token_expire_minutes
    )


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    try:
        user = service.register_user(
            db,
            email=payload.email,
            password=payload.password,
            full_name=payload.full_name,
            role=payload.role,
            country_id=payload.country_id,
            language=payload.language,
            tz=payload.timezone,
        )
    except service.DuplicateEmailError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(exc)) from exc
    return UserResponse.from_user(user)


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    try:
        user = service.authenticate_user(db, email=payload.email, password=payload.password)
    except service.InvalidCredentialsError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc)) from exc
    return _token(user)


@router.post("/google", response_model=TokenResponse)
def google_auth(payload: GoogleAuthRequest, db: Session = Depends(get_db)):
    try:
        user = service.upsert_google_user(db, id_token=payload.id_token)
    except service.GoogleNotConfiguredError as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)) from exc
    except service.InvalidCredentialsError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc)) from exc
    except Exception as exc:  # google-auth raises ValueError on bad tokens/signatures
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid Google token"
        ) from exc
    return _token(user)


@router.post("/forgot-password", response_model=MessageResponse)
def forgot_password(payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    # No email enumeration: identical response whether or not the account exists.
    service.request_password_reset(db, email=payload.email)
    return MessageResponse(message=GENERIC_RESET_MESSAGE)


@router.post("/reset-password", response_model=MessageResponse)
def reset_password(payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    try:
        service.reset_password(
            db, email=payload.email, otp=payload.otp, new_password=payload.new_password
        )
    except service.InvalidOTPError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    return MessageResponse(message="Password has been reset.")


@router.get("/me", response_model=UserResponse)
def me(current: User = Depends(get_current_user)):
    return UserResponse.from_user(current)
