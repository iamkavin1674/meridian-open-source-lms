from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field

Role = Literal["trainee", "trainer", "admin"]


class CountryCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    code: str = Field(min_length=2, max_length=10)
    default_language: str = "en"
    default_timezone: str = "UTC"


class CountryRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    code: str
    default_language: str
    default_timezone: str


class UserSync(BaseModel):
    """Provision/update the DB user from the verified Keycloak token."""

    country_id: int | None = None
    language: str = "en"
    timezone: str = "UTC"
    role: Role | None = None


class UserCreate(BaseModel):
    keycloak_id: str
    email: EmailStr
    full_name: str
    role: Role
    country_id: int | None = None
    language: str = "en"
    timezone: str = "UTC"


class UserUpdate(BaseModel):
    full_name: str | None = None
    country_id: int | None = None
    language: str | None = None
    timezone: str | None = None
    role: Role | None = None


class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    keycloak_id: str
    email: str
    full_name: str
    role: str
    country_id: int | None
    language: str
    timezone: str
    created_at: datetime


class TraineeProfileCreate(BaseModel):
    learning_style: str | None = None
    instruction_preferences: str | None = None
    onboarding_completed: bool = False


class TraineeProfileUpdate(BaseModel):
    learning_style: str | None = None
    instruction_preferences: str | None = None
    onboarding_completed: bool | None = None


class TraineeProfileRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    user_id: int
    learning_style: str | None
    instruction_preferences: str | None
    onboarding_completed: bool
