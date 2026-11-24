from sqlalchemy import func
from sqlalchemy.orm import Session

from app.db.models import (
    Cohort,
    Country,
    Course,
    TrainerEvaluation,
    TraineeSurvey,
    User,
    VectorMemory,
)
from app.schemas.feedback import TrainerEvaluationCreate, TraineeSurveyCreate, VectorMemoryCreate


def create_evaluation(db: Session, trainer_id: int, data: TrainerEvaluationCreate):
    obj = TrainerEvaluation(trainer_id=trainer_id, **data.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


def get_evaluation(db: Session, evaluation_id: int) -> TrainerEvaluation | None:
    return db.query(TrainerEvaluation).filter(TrainerEvaluation.id == evaluation_id).first()


def list_evaluations(
    db: Session,
    trainer_id: int | None = None,
    trainee_id: int | None = None,
    module_id: int | None = None,
):
    q = db.query(TrainerEvaluation)
    if trainer_id is not None:
        q = q.filter(TrainerEvaluation.trainer_id == trainer_id)
    if trainee_id is not None:
        q = q.filter(TrainerEvaluation.trainee_id == trainee_id)
    if module_id is not None:
        q = q.filter(TrainerEvaluation.module_id == module_id)
    return q.order_by(TrainerEvaluation.created_at.desc()).all()


def set_ai_action_plan(db: Session, evaluation: TrainerEvaluation, plan: str):
    evaluation.ai_action_plan = plan
    db.commit()
    db.refresh(evaluation)
    return evaluation


def create_survey(db: Session, data: TraineeSurveyCreate) -> TraineeSurvey:
    # Identity is stripped at the schema boundary; only aggregate keys persist.
    obj = TraineeSurvey(**data.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


def list_surveys(
    db: Session,
    trainer_id: int | None = None,
    cohort_id: int | None = None,
    module_id: int | None = None,
):
    q = db.query(TraineeSurvey)
    if trainer_id is not None:
        q = q.filter(TraineeSurvey.trainer_id == trainer_id)
    if cohort_id is not None:
        q = q.filter(TraineeSurvey.cohort_id == cohort_id)
    if module_id is not None:
        q = q.filter(TraineeSurvey.module_id == module_id)
    return q.order_by(TraineeSurvey.created_at.desc()).all()


def survey_aggregate(
    db: Session,
    trainer_id: int | None = None,
    cohort_id: int | None = None,
    module_id: int | None = None,
) -> dict:
    q = db.query(
        func.count(TraineeSurvey.id),
        func.avg(TraineeSurvey.pacing_score),
        func.avg(TraineeSurvey.clarity_score),
        func.avg(TraineeSurvey.difficulty_score),
    )
    if trainer_id is not None:
        q = q.filter(TraineeSurvey.trainer_id == trainer_id)
    if cohort_id is not None:
        q = q.filter(TraineeSurvey.cohort_id == cohort_id)
    if module_id is not None:
        q = q.filter(TraineeSurvey.module_id == module_id)
    count, pacing, clarity, difficulty = q.one()
    return {
        "trainer_id": trainer_id,
        "cohort_id": cohort_id,
        "module_id": module_id,
        "count": int(count or 0),
        "avg_pacing": float(pacing) if pacing is not None else None,
        "avg_clarity": float(clarity) if clarity is not None else None,
        "avg_difficulty": float(difficulty) if difficulty is not None else None,
    }


def create_vector_memory(db: Session, data: VectorMemoryCreate) -> VectorMemory:
    payload = data.model_dump()
    obj = VectorMemory(**payload)
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


def list_vector_memories(
    db: Session,
    user_id: int | None = None,
    role: str | None = None,
    cohort_id: int | None = None,
    country_id: int | None = None,
) -> list[VectorMemory]:
    """Tenant-isolated query: at least one metadata filter is required by callers."""
    q = db.query(VectorMemory)
    if user_id is not None:
        q = q.filter(VectorMemory.user_id == user_id)
    if role is not None:
        q = q.filter(VectorMemory.role == role)
    if cohort_id is not None:
        q = q.filter(VectorMemory.cohort_id == cohort_id)
    if country_id is not None:
        q = q.filter(VectorMemory.country_id == country_id)
    return q.order_by(VectorMemory.created_at.desc()).all()


def delete_vector_memory(db: Session, memory: VectorMemory) -> None:
    db.delete(memory)
    db.commit()


def get_vector_memory(db: Session, memory_id: int) -> VectorMemory | None:
    return db.query(VectorMemory).filter(VectorMemory.id == memory_id).first()


def country_analytics(db: Session) -> list[dict]:
    results: list[dict] = []
    countries = db.query(Country).order_by(Country.id).all()
    for country in countries:
        users = db.query(User).filter(User.country_id == country.id)
        cohorts = db.query(Cohort).filter(Cohort.country_id == country.id)
        cohort_ids = [c.id for c in cohorts.all()]
        eval_q = (
            db.query(func.count(TrainerEvaluation.id), func.avg(TrainerEvaluation.performance_score))
            .join(User, TrainerEvaluation.trainee_id == User.id)
            .filter(User.country_id == country.id)
        )
        eval_count, eval_avg = eval_q.one()
        survey_q = db.query(
            func.count(TraineeSurvey.id),
            func.avg(TraineeSurvey.pacing_score),
            func.avg(TraineeSurvey.clarity_score),
            func.avg(TraineeSurvey.difficulty_score),
        )
        if cohort_ids:
            survey_q = survey_q.filter(TraineeSurvey.cohort_id.in_(cohort_ids))
        else:
            survey_q = survey_q.filter(TraineeSurvey.id == -1)
        s_count, s_pacing, s_clarity, s_diff = survey_q.one()
        results.append(
            {
                "country_id": country.id,
                "country_code": country.code,
                "country_name": country.name,
                "users": users.count(),
                "trainees": users.filter(User.role == "trainee").count(),
                "trainers": users.filter(User.role == "trainer").count(),
                "cohorts": cohorts.count(),
                "evaluations": int(eval_count or 0),
                "avg_performance_score": float(eval_avg) if eval_avg is not None else None,
                "surveys": int(s_count or 0),
                "avg_pacing": float(s_pacing) if s_pacing is not None else None,
                "avg_clarity": float(s_clarity) if s_clarity is not None else None,
                "avg_difficulty": float(s_diff) if s_diff is not None else None,
            }
        )
    return results


def overview_analytics(db: Session) -> dict:
    eval_count, eval_avg = db.query(
        func.count(TrainerEvaluation.id), func.avg(TrainerEvaluation.performance_score)
    ).one()
    s_count, s_pacing, s_clarity, s_diff = db.query(
        func.count(TraineeSurvey.id),
        func.avg(TraineeSurvey.pacing_score),
        func.avg(TraineeSurvey.clarity_score),
        func.avg(TraineeSurvey.difficulty_score),
    ).one()
    users = db.query(User)
    return {
        "countries": db.query(Country).count(),
        "users": users.count(),
        "trainees": users.filter(User.role == "trainee").count(),
        "trainers": users.filter(User.role == "trainer").count(),
        "admins": users.filter(User.role == "admin").count(),
        "cohorts": db.query(Cohort).count(),
        "courses": db.query(Course).count(),
        "evaluations": int(eval_count or 0),
        "surveys": int(s_count or 0),
        "avg_performance_score": float(eval_avg) if eval_avg is not None else None,
        "avg_pacing": float(s_pacing) if s_pacing is not None else None,
        "avg_clarity": float(s_clarity) if s_clarity is not None else None,
        "avg_difficulty": float(s_diff) if s_diff is not None else None,
    }
