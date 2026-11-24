from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import TokenUser, get_db_user, require_roles
from app.crud import feedback_crud, user_crud
from app.db.database import get_db
from app.db.models import User
from app.schemas.feedback import (
    CountryAnalytics,
    OverviewAnalytics,
    VectorMemoryCreate,
    VectorMemoryRead,
)

router = APIRouter(tags=["admin"])


@router.get("/admin/analytics/countries", response_model=list[CountryAnalytics])
def analytics_by_country(
    db: Session = Depends(get_db), _: TokenUser = Depends(require_roles("admin"))
):
    return feedback_crud.country_analytics(db)


@router.get("/admin/analytics/overview", response_model=OverviewAnalytics)
def analytics_overview(db: Session = Depends(get_db), _: TokenUser = Depends(require_roles("admin"))):
    return feedback_crud.overview_analytics(db)


@router.post(
    "/admin/vector-memories", response_model=VectorMemoryRead, status_code=status.HTTP_201_CREATED
)
def create_vector_memory(
    payload: VectorMemoryCreate,
    db: Session = Depends(get_db),
    current: User = Depends(get_db_user),
):
    # Tenant isolation: non-admins may only write memories tagged to themselves.
    if current.role != "admin":
        if payload.user_id is not None and payload.user_id != current.id:
            raise HTTPException(status_code=403, detail="Cannot write another user's memory")
        payload = payload.model_copy(update={"user_id": current.id, "role": current.role})
    return feedback_crud.create_vector_memory(db, payload)


@router.get("/admin/vector-memories", response_model=list[VectorMemoryRead])
def list_vector_memories(
    user_id: int | None = None,
    role: str | None = None,
    cohort_id: int | None = None,
    country_id: int | None = None,
    db: Session = Depends(get_db),
    current: User = Depends(get_db_user),
):
    if user_id is None and role is None and cohort_id is None and country_id is None:
        raise HTTPException(
            status_code=422,
            detail="At least one metadata filter (user_id, role, cohort_id, country_id) is required",
        )
    if current.role != "admin":
        # Trainees/trainers can only read their own memories.
        if user_id is not None and user_id != current.id:
            raise HTTPException(status_code=403, detail="Forbidden")
        user_id = current.id
    return feedback_crud.list_vector_memories(
        db, user_id=user_id, role=role, cohort_id=cohort_id, country_id=country_id
    )


@router.delete("/admin/vector-memories/{memory_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_vector_memory(
    memory_id: int,
    db: Session = Depends(get_db),
    current: User = Depends(get_db_user),
):
    memory = feedback_crud.get_vector_memory(db, memory_id)
    if not memory:
        raise HTTPException(status_code=404, detail="Vector memory not found")
    if current.role != "admin" and memory.user_id != current.id:
        raise HTTPException(status_code=403, detail="Forbidden")
    feedback_crud.delete_vector_memory(db, memory)
    return None


@router.delete("/admin/users/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def gdpr_delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    _: TokenUser = Depends(require_roles("admin")),
):
    user = user_crud.get_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user_crud.delete_user_gdpr(db, user)
    return None
