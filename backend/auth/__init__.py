"""Local auth module: registration, login, Google sign-in, OTP password reset."""

from auth.dependencies import get_current_user, require_roles
from auth.router import router

__all__ = ["router", "get_current_user", "require_roles"]
