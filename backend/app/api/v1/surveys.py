from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import TokenUser, get_token_user, require_roles
from app.crud import course_crud, feedback_crud, user_crud
from app.db.database import get_db
from app.schemas.feedback import SurveyAggregate, TraineeSurveyCreate, TraineeSurveyRead

router = APIRouter(tags=["surveys"])


@router.post(
    "/surveys/trainee-to-trainer",
    response_model=TraineeSurveyRead,
    status_code=status.HTTP_201_CREATED,
)
def create_survey(
    payload: TraineeSurveyCreate,
    db: Session = Depends(get_db),
    _: TokenUser = Depends(require_roles("trainee")),
):
    """Flow B: identity validated via token role only; nothing identifying is stored.

    The payload schema forbids extra fields, and this handler never passes any
    caller identifier to the CRUD layer.
    """
    trainer = user_crud.get_user(db, payload.trainer_id)
    if not trainer or trainer.role != "trainer":
        raise HTTPException(status_code=400, detail="trainer_id must reference a trainer user")
    if not course_crud.get_cohort(db, payload.cohort_id):
        raise HTTPException(status_code=404, detail="Cohort not found")
    if not course_crud.get_module(db, payload.module_id):
        raise HTTPException(status_code=404, detail="Module not found")
    return feedback_crud.create_survey(db, payload)


@router.get("/surveys/trainee-to-trainer", response_model=list[TraineeSurveyRead])
def list_surveys(
    trainer_id: int | None = None,
    cohort_id: int | None = None,
    module_id: int | None = None,
    db: Session = Depends(get_db),
    _: TokenUser = Depends(require_roles("trainer", "admin")),
):
    return feedback_crud.list_surveys(
        db, trainer_id=trainer_id, cohort_id=cohort_id, module_id=module_id
    )


@router.get("/surveys/trainee-to-trainer/aggregate", response_model=SurveyAggregate)
def survey_aggregate(
    trainer_id: int | None = None,
    cohort_id: int | None = None,
    module_id: int | None = None,
    db: Session = Depends(get_db),
    _: TokenUser = Depends(require_roles("trainer", "admin")),
):
    return feedback_crud.survey_aggregate(
        db, trainer_id=trainer_id, cohort_id=cohort_id, module_id=module_id
    )


@router.get("/surveys/me/trends", response_model=SurveyAggregate)
def my_survey_trends(
    db: Session = Depends(get_db),
    token: TokenUser = Depends(get_token_user),
):
    """Trainer trend view keyed by the caller's DB trainer id (surveys stay anonymous)."""
    from app.crud.user_crud import get_user_by_keycloak_id

    user = get_user_by_keycloak_id(db, token.keycloak_id)
    if not user or user.role != "trainer":
        raise HTTPException(status_code=403, detail="Only trainers view their trends")
    return feedback_crud.survey_aggregate(db, trainer_id=user.id)
