from sqlalchemy.orm import Session

from app.db.models import Assignment, AssignmentSubmission, Attendance
from app.schemas.assignment import AssignmentCreate, AssignmentUpdate, SubmissionCreate


def create_assignment(db: Session, module_id: int, data: AssignmentCreate) -> Assignment:
    obj = Assignment(module_id=module_id, **data.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


def get_assignment(db: Session, assignment_id: int) -> Assignment | None:
    return db.query(Assignment).filter(Assignment.id == assignment_id).first()


def list_assignments(db: Session, module_id: int) -> list[Assignment]:
    return db.query(Assignment).filter(Assignment.module_id == module_id).all()


def update_assignment(db: Session, assignment: Assignment, data: AssignmentUpdate) -> Assignment:
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(assignment, k, v)
    db.commit()
    db.refresh(assignment)
    return assignment


def delete_assignment(db: Session, assignment: Assignment) -> None:
    db.delete(assignment)
    db.commit()


def create_submission(db: Session, assignment_id: int, trainee_id: int, data: SubmissionCreate):
    obj = AssignmentSubmission(
        assignment_id=assignment_id, trainee_id=trainee_id, **data.model_dump()
    )
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


def get_submission(db: Session, submission_id: int) -> AssignmentSubmission | None:
    return db.query(AssignmentSubmission).filter(AssignmentSubmission.id == submission_id).first()


def list_submissions(db: Session, assignment_id: int, trainee_id: int | None = None):
    q = db.query(AssignmentSubmission).filter(
        AssignmentSubmission.assignment_id == assignment_id
    )
    if trainee_id is not None:
        q = q.filter(AssignmentSubmission.trainee_id == trainee_id)
    return q.order_by(AssignmentSubmission.id).all()


def grade_submission(db: Session, submission: AssignmentSubmission, score: float):
    submission.score = score
    submission.status = "graded"
    db.commit()
    db.refresh(submission)
    return submission


def upsert_attendance(db: Session, module_id: int, trainee_id: int, status: str) -> Attendance:
    obj = (
        db.query(Attendance)
        .filter(Attendance.module_id == module_id, Attendance.trainee_id == trainee_id)
        .first()
    )
    if obj is None:
        obj = Attendance(module_id=module_id, trainee_id=trainee_id, status=status)
        db.add(obj)
    else:
        obj.status = status
    db.commit()
    db.refresh(obj)
    return obj


def list_attendance(db: Session, module_id: int) -> list[Attendance]:
    return db.query(Attendance).filter(Attendance.module_id == module_id).all()
