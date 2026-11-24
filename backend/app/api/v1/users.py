from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import TokenUser, get_db_user, get_token_user, require_roles
from app.crud import user_crud
from app.db.database import get_db
from app.db.models import User
from app.schemas.user import (
    CountryCreate,
    CountryRead,
    TraineeProfileCreate,
    TraineeProfileRead,
    UserCreate,
    UserRead,
    UserSync,
    UserUpdate,
)

router = APIRouter(tags=["users"])


def _404(detail: str) -> HTTPException:
    return HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=detail)


@router.post("/countries", response_model=CountryRead, status_code=status.HTTP_201_CREATED)
def create_country(
    payload: CountryCreate,
    db: Session = Depends(get_db),
    _: TokenUser = Depends(require_roles("admin")),
):
    if user_crud.get_country_by_code(db, payload.code):
        raise HTTPException(status_code=409, detail="Country code already exists")
    return user_crud.create_country(db, payload)


@router.get("/countries", response_model=list[CountryRead])
def list_countries(db: Session = Depends(get_db), _: TokenUser = Depends(get_token_user)):
    return user_crud.list_countries(db)


@router.get("/countries/{country_id}", response_model=CountryRead)
def get_country(country_id: int, db: Session = Depends(get_db), _: TokenUser = Depends(get_token_user)):
    country = user_crud.get_country(db, country_id)
    if not country:
        raise _404("Country not found")
    return country


@router.post("/users/me/sync", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def sync_me(
    payload: UserSync,
    db: Session = Depends(get_db),
    token: TokenUser = Depends(get_token_user),
):
    existing = user_crud.get_user_by_keycloak_id(db, token.keycloak_id)
    role = payload.role or token.primary_role or "trainee"
    if existing:
        updates = UserUpdate(
            full_name=token.full_name or existing.full_name,
            country_id=payload.country_id if payload.country_id is not None else existing.country_id,
            language=payload.language,
            timezone=payload.timezone,
            role=role,  # type: ignore[arg-type]
        )
        return user_crud.update_user(db, existing, updates)
    if not token.email:
        raise HTTPException(status_code=400, detail="Token has no email; cannot provision user")
    user = user_crud.create_user(
        db,
        UserCreate(
            keycloak_id=token.keycloak_id,
            email=token.email,
            full_name=token.full_name or token.email,
            role=role,  # type: ignore[arg-type]
            country_id=payload.country_id,
            language=payload.language,
            timezone=payload.timezone,
        ),
    )
    if user.role == "trainee":
        user_crud.upsert_profile(db, user.id, TraineeProfileCreate())
    return user


@router.get("/users/me", response_model=UserRead)
def get_me(current: User = Depends(get_db_user)):
    return current


@router.patch("/users/me", response_model=UserRead)
def update_me(payload: UserUpdate, db: Session = Depends(get_db), current: User = Depends(get_db_user)):
    # Users may not escalate their own role.
    clean = UserUpdate.model_validate(
        {k: v for k, v in payload.model_dump(exclude_unset=True).items() if k != "role"}
    )
    return user_crud.update_user(db, current, clean)


@router.delete("/users/me", status_code=status.HTTP_204_NO_CONTENT)
def delete_me(db: Session = Depends(get_db), current: User = Depends(get_db_user)):
    user_crud.delete_user_gdpr(db, current)
    return None


@router.get("/users/me/profile", response_model=TraineeProfileRead)
def get_my_profile(db: Session = Depends(get_db), current: User = Depends(get_db_user)):
    profile = user_crud.get_profile_by_user(db, current.id)
    if not profile:
        raise _404("Trainee profile not found")
    return profile


@router.put("/users/me/profile", response_model=TraineeProfileRead)
def upsert_my_profile(
    payload: TraineeProfileCreate,
    db: Session = Depends(get_db),
    current: User = Depends(get_db_user),
):
    if current.role != "trainee":
        raise HTTPException(status_code=403, detail="Only trainees have a trainee profile")
    return user_crud.upsert_profile(db, current.id, payload)


@router.get("/users", response_model=list[UserRead])
def list_users(
    role: str | None = None,
    country_id: int | None = None,
    db: Session = Depends(get_db),
    _: TokenUser = Depends(require_roles("admin")),
):
    return user_crud.list_users(db, role=role, country_id=country_id)


@router.get("/users/{user_id}", response_model=UserRead)
def get_user(user_id: int, db: Session = Depends(get_db), current: User = Depends(get_db_user)):
    if current.role != "admin" and current.id != user_id:
        raise HTTPException(status_code=403, detail="Forbidden")
    user = user_crud.get_user(db, user_id)
    if not user:
        raise _404("User not found")
    return user


@router.patch("/users/{user_id}", response_model=UserRead)
def update_user(
    user_id: int,
    payload: UserUpdate,
    db: Session = Depends(get_db),
    _: TokenUser = Depends(require_roles("admin")),
):
    user = user_crud.get_user(db, user_id)
    if not user:
        raise _404("User not found")
    return user_crud.update_user(db, user, payload)


@router.delete("/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    _: TokenUser = Depends(require_roles("admin")),
):
    user = user_crud.get_user(db, user_id)
    if not user:
        raise _404("User not found")
    user_crud.delete_user_gdpr(db, user)
    return None
