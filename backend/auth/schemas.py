from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field

Role = Literal["trainee", "trainer", "admin"]


class RegisterRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    full_name: str = Field(min_length=1, max_length=255)
    role: Role = "trainee"
    country_id: int | None = None
    language: str = "en"
    timezone: str = "UTC"


class LoginRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    email: EmailStr
    password: str = Field(min_length=1)


class GoogleAuthRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    id_token: str = Field(min_length=1)


class ForgotPasswordRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    email: EmailStr
    otp: str = Field(pattern=r"^\d{6}$")
    new_password: str = Field(min_length=8, max_length=128)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in_minutes: int


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    email: str
    full_name: str
    role: str
    country_id: int | None = None
    language: str = "en"
    timezone: str = "UTC"
    has_password: bool = False
    has_google: bool = False
    created_at: datetime | None = None

    @classmethod
    def from_user(cls, user) -> "UserResponse":
        return cls(
            id=user.id,
            email=user.email,
            full_name=user.full_name,
            role=user.role,
            country_id=user.country_id,
            language=user.language,
            timezone=user.timezone,
            has_password=user.hashed_password is not None,
            has_google=user.google_sub is not None,
            created_at=user.created_at,
        )


class MessageResponse(BaseModel):
    message: str
