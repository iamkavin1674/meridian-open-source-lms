from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import get_db_user
from app.crud import course_crud, feedback_crud, user_crud
from app.db.database import get_db
from app.db.models import User
from app.schemas.feedback import TrainerEvaluationCreate, TrainerEvaluationRead

router = APIRouter(tags=["evaluations"])


def _404(detail: str) -> HTTPException:
    return HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=detail)


def _enqueue_ai_plan(evaluation_id: int) -> None:
    """Phase 3 hook: enqueue Celery AI plan generation; no-op if worker unavailable."""
    try:
        from app.worker.celery_app import generate_ai_action_plan

        generate_ai_action_plan.delay(evaluation_id)  # type: ignore[attr-defined]
    except Exception:
        # Broker/worker offline in Phase 1-2: evaluation is already persisted.
        pass


@router.post(
    "/evaluations/trainer-to-trainee",
    response_model=TrainerEvaluationRead,
    status_code=status.HTTP_201_CREATED,
)
def create_evaluation(
    payload: TrainerEvaluationCreate,
    db: Session = Depends(get_db),
    current: User = Depends(get_db_user),
):
    if current.role != "trainer":
        raise HTTPException(status_code=403, detail="Only trainers submit evaluations (Flow A)")
    trainee = user_crud.get_user(db, payload.trainee_id)
    if not trainee or trainee.role != "trainee":
        raise HTTPException(status_code=400, detail="trainee_id must reference a trainee user")
    if not course_crud.get_module(db, payload.module_id):
        raise _404("Module not found")
    evaluation = feedback_crud.create_evaluation(db, trainer_id=current.id, data=payload)
    _enqueue_ai_plan(evaluation.id)
    return evaluation


@router.get("/evaluations/trainer-to-trainee", response_model=list[TrainerEvaluationRead])
def list_evaluations(
    trainee_id: int | None = None,
    trainer_id: int | None = None,
    module_id: int | None = None,
    db: Session = Depends(get_db),
    current: User = Depends(get_db_user),
):
    if current.role == "trainee":
        # Trainees only see evaluations about themselves.
        return feedback_crud.list_evaluations(
            db, trainee_id=current.id, trainer_id=trainer_id, module_id=module_id
        )
    if current.role == "trainer":
        return feedback_crud.list_evaluations(
            db, trainer_id=current.id, trainee_id=trainee_id, module_id=module_id
        )
    return feedback_crud.list_evaluations(
        db, trainer_id=trainer_id, trainee_id=trainee_id, module_id=module_id
    )


@router.get("/evaluations/trainer-to-trainee/{evaluation_id}", response_model=TrainerEvaluationRead)
def get_evaluation(
    evaluation_id: int, db: Session = Depends(get_db), current: User = Depends(get_db_user)
):
    evaluation = feedback_crud.get_evaluation(db, evaluation_id)
    if not evaluation:
        raise _404("Evaluation not found")
    if current.role == "trainee" and evaluation.trainee_id != current.id:
        raise HTTPException(status_code=403, detail="Forbidden")
    if current.role == "trainer" and evaluation.trainer_id != current.id:
        raise HTTPException(status_code=403, detail="Forbidden")
    return evaluation
