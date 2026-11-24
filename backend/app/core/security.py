import time
from dataclasses import dataclass, field

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.database import get_db

bearer_scheme = HTTPBearer(auto_error=False)

ALLOWED_ROLES = {"trainee", "trainer", "admin"}
_jwks_cache: dict = {}
_jwks_fetched_at: float = 0.0
_JWKS_TTL = 600


@dataclass
class TokenUser:
    keycloak_id: str
    email: str = ""
    full_name: str = ""
    roles: set[str] = field(default_factory=set)

    @property
    def primary_role(self) -> str | None:
        for role in ("admin", "trainer", "trainee"):
            if role in self.roles:
                return role
        return None


def _fetch_jwks() -> dict:
    global _jwks_cache, _jwks_fetched_at
    now = time.time()
    if _jwks_cache and now - _jwks_fetched_at < _JWKS_TTL:
        return _jwks_cache
    import httpx

    resp = httpx.get(settings.keycloak_jwks_url, timeout=5.0)
    resp.raise_for_status()
    _jwks_cache = resp.json()
    _jwks_fetched_at = now
    return _jwks_cache


def _extract_roles(payload: dict) -> set[str]:
    roles: set[str] = set()
    realm = payload.get("realm_access") or {}
    roles.update(realm.get("roles") or [])
    resource = payload.get("resource_access") or {}
    client = resource.get(settings.keycloak_client_id) or {}
    roles.update(client.get("roles") or [])
    # Keycloak may also emit a single `role` claim in tests/custom mappers.
    if payload.get("role"):
        roles.add(str(payload["role"]))
    return roles & ALLOWED_ROLES


def decode_token(token: str) -> TokenUser:
    try:
        if settings.keycloak_verify_signature:
            jwks = _fetch_jwks()
            client = jwt.PyJWKClient(settings.keycloak_jwks_url)
            signing_key = client.get_signing_key_from_jwt(token)
            payload = jwt.decode(
                token,
                signing_key.key,
                algorithms=["RS256"],
                issuer=settings.keycloak_issuer,
                audience=settings.keycloak_audience,
                options={"verify_aud": settings.keycloak_audience is not None},
            )
            _ = jwks
        else:
            payload = jwt.decode(token, options={"verify_signature": False})
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token"
        ) from exc
    keycloak_id = payload.get("sub")
    if not keycloak_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token missing sub")
    return TokenUser(
        keycloak_id=str(keycloak_id),
        email=str(payload.get("email") or ""),
        full_name=str(payload.get("name") or payload.get("preferred_username") or ""),
        roles=_extract_roles(payload),
    )


async def get_token_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> TokenUser:
    if credentials is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing bearer token")
    return decode_token(credentials.credentials)


def require_roles(*roles: str):
    async def _dep(token_user: TokenUser = Depends(get_token_user)) -> TokenUser:
        if roles and token_user.roles and not (set(roles) & token_user.roles):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient role")
        if roles and not token_user.roles:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No LMS role in token")
        return token_user

    return _dep


def get_db_user(db: Session = Depends(get_db), token_user: TokenUser = Depends(get_token_user)):
    from app.crud.user_crud import get_user_by_keycloak_id

    user = get_user_by_keycloak_id(db, token_user.keycloak_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not provisioned; call POST /api/v1/users/me/sync first",
        )
    return user


def require_db_roles(*roles: str):
    """Role check against the provisioned DB user (DB role is authoritative)."""

    def _dep(user=Depends(get_db_user)):
        if roles and user.role not in roles:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient role")
        return user

    return _dep
