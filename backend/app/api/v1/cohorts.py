from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.security import get_db_user, require_roles, TokenUser
from app.crud import course_crud, user_crud
from app.db.database import get_db
from app.db.models import User
from app.schemas.course import (
    CohortCreate,
    CohortRead,
    CohortUpdate,
    EnrollmentCreate,
    EnrollmentRead,
    EnrollmentUpdate,
)

router = APIRouter(tags=["cohorts"])


def _404(detail: str) -> HTTPException:
    return HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=detail)


@router.post("/cohorts", response_model=CohortRead, status_code=status.HTTP_201_CREATED)
def create_cohort(
    payload: CohortCreate,
    db: Session = Depends(get_db),
    _: TokenUser = Depends(require_roles("admin", "trainer")),
):
    if not user_crud.get_country(db, payload.country_id):
        raise _404("Country not found")
    trainer = user_crud.get_user(db, payload.trainer_id)
    if not trainer or trainer.role != "trainer":
        raise HTTPException(status_code=400, detail="trainer_id must reference a trainer user")
    return course_crud.create_cohort(db, payload)


@router.get("/cohorts", response_model=list[CohortRead])
def list_cohorts(
    country_id: int | None = None,
    trainer_id: int | None = None,
    db: Session = Depends(get_db),
    _: User = Depends(get_db_user),
):
    return course_crud.list_cohorts(db, country_id=country_id, trainer_id=trainer_id)


@router.get("/cohorts/{cohort_id}", response_model=CohortRead)
def get_cohort(cohort_id: int, db: Session = Depends(get_db), _: User = Depends(get_db_user)):
    cohort = course_crud.get_cohort(db, cohort_id)
    if not cohort:
        raise _404("Cohort not found")
    return cohort


@router.patch("/cohorts/{cohort_id}", response_model=CohortRead)
def update_cohort(
    cohort_id: int,
    payload: CohortUpdate,
    db: Session = Depends(get_db),
    _: TokenUser = Depends(require_roles("admin", "trainer")),
):
    cohort = course_crud.get_cohort(db, cohort_id)
    if not cohort:
        raise _404("Cohort not found")
    return course_crud.update_cohort(db, cohort, payload)


@router.delete("/cohorts/{cohort_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_cohort(
    cohort_id: int,
    db: Session = Depends(get_db),
    _: TokenUser = Depends(require_roles("admin")),
):
    cohort = course_crud.get_cohort(db, cohort_id)
    if not cohort:
        raise _404("Cohort not found")
    course_crud.delete_cohort(db, cohort)
    return None


@router.post(
    "/cohorts/{cohort_id}/enrollments",
    response_model=EnrollmentRead,
    status_code=status.HTTP_201_CREATED,
)
def create_enrollment(
    cohort_id: int,
    payload: EnrollmentCreate,
    db: Session = Depends(get_db),
    _: TokenUser = Depends(require_roles("admin", "trainer")),
):
    if not course_crud.get_cohort(db, cohort_id):
        raise _404("Cohort not found")
    trainee = user_crud.get_user(db, payload.trainee_id)
    if not trainee or trainee.role != "trainee":
        raise HTTPException(status_code=400, detail="trainee_id must reference a trainee user")
    try:
        return course_crud.create_enrollment(db, cohort_id, payload)
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=409, detail="Trainee already enrolled in cohort") from exc


@router.get("/cohorts/{cohort_id}/enrollments", response_model=list[EnrollmentRead])
def list_enrollments(cohort_id: int, db: Session = Depends(get_db), _: User = Depends(get_db_user)):
    if not course_crud.get_cohort(db, cohort_id):
        raise _404("Cohort not found")
    return course_crud.list_enrollments(db, cohort_id)


@router.patch("/enrollments/{enrollment_id}", response_model=EnrollmentRead)
def update_enrollment(
    enrollment_id: int,
    payload: EnrollmentUpdate,
    db: Session = Depends(get_db),
    _: TokenUser = Depends(require_roles("admin", "trainer")),
):
    enrollment = course_crud.get_enrollment(db, enrollment_id)
    if not enrollment:
        raise _404("Enrollment not found")
    return course_crud.update_enrollment(db, enrollment, payload)


@router.delete("/enrollments/{enrollment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_enrollment(
    enrollment_id: int,
    db: Session = Depends(get_db),
    _: TokenUser = Depends(require_roles("admin", "trainer")),
):
    enrollment = course_crud.get_enrollment(db, enrollment_id)
    if not enrollment:
        raise _404("Enrollment not found")
    course_crud.delete_enrollment(db, enrollment)
    return None
