from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import TokenUser, get_db_user, require_roles
from app.crud import assignment_crud, course_crud
from app.db.database import get_db
from app.db.models import User
from app.schemas.assignment import (
    AssignmentCreate,
    AssignmentRead,
    AssignmentUpdate,
    AttendanceBulkCreate,
    AttendanceCreate,
    AttendanceRead,
    SubmissionCreate,
    SubmissionGrade,
    SubmissionRead,
)

router = APIRouter(tags=["assignments"])


def _404(detail: str) -> HTTPException:
    return HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=detail)


@router.post(
    "/modules/{module_id}/assignments",
    response_model=AssignmentRead,
    status_code=status.HTTP_201_CREATED,
)
def create_assignment(
    module_id: int,
    payload: AssignmentCreate,
    db: Session = Depends(get_db),
    _: TokenUser = Depends(require_roles("trainer", "admin")),
):
    if not course_crud.get_module(db, module_id):
        raise _404("Module not found")
    return assignment_crud.create_assignment(db, module_id, payload)


@router.get("/modules/{module_id}/assignments", response_model=list[AssignmentRead])
def list_assignments(module_id: int, db: Session = Depends(get_db), _: User = Depends(get_db_user)):
    if not course_crud.get_module(db, module_id):
        raise _404("Module not found")
    return assignment_crud.list_assignments(db, module_id)


@router.get("/assignments/{assignment_id}", response_model=AssignmentRead)
def get_assignment(assignment_id: int, db: Session = Depends(get_db), _: User = Depends(get_db_user)):
    assignment = assignment_crud.get_assignment(db, assignment_id)
    if not assignment:
        raise _404("Assignment not found")
    return assignment


@router.patch("/assignments/{assignment_id}", response_model=AssignmentRead)
def update_assignment(
    assignment_id: int,
    payload: AssignmentUpdate,
    db: Session = Depends(get_db),
    _: TokenUser = Depends(require_roles("trainer", "admin")),
):
    assignment = assignment_crud.get_assignment(db, assignment_id)
    if not assignment:
        raise _404("Assignment not found")
    return assignment_crud.update_assignment(db, assignment, payload)


@router.delete("/assignments/{assignment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_assignment(
    assignment_id: int,
    db: Session = Depends(get_db),
    _: TokenUser = Depends(require_roles("trainer", "admin")),
):
    assignment = assignment_crud.get_assignment(db, assignment_id)
    if not assignment:
        raise _404("Assignment not found")
    assignment_crud.delete_assignment(db, assignment)
    return None


@router.post(
    "/assignments/{assignment_id}/submissions",
    response_model=SubmissionRead,
    status_code=status.HTTP_201_CREATED,
)
def create_submission(
    assignment_id: int,
    payload: SubmissionCreate,
    db: Session = Depends(get_db),
    current: User = Depends(get_db_user),
):
    if current.role != "trainee":
        raise HTTPException(status_code=403, detail="Only trainees submit assignments")
    if not assignment_crud.get_assignment(db, assignment_id):
        raise _404("Assignment not found")
    return assignment_crud.create_submission(db, assignment_id, current.id, payload)


@router.get("/assignments/{assignment_id}/submissions", response_model=list[SubmissionRead])
def list_submissions(
    assignment_id: int, db: Session = Depends(get_db), current: User = Depends(get_db_user)
):
    if not assignment_crud.get_assignment(db, assignment_id):
        raise _404("Assignment not found")
    if current.role == "trainee":
        return assignment_crud.list_submissions(db, assignment_id, trainee_id=current.id)
    return assignment_crud.list_submissions(db, assignment_id)


@router.patch("/submissions/{submission_id}/grade", response_model=SubmissionRead)
def grade_submission(
    submission_id: int,
    payload: SubmissionGrade,
    db: Session = Depends(get_db),
    _: TokenUser = Depends(require_roles("trainer", "admin")),
):
    submission = assignment_crud.get_submission(db, submission_id)
    if not submission:
        raise _404("Submission not found")
    assignment = assignment_crud.get_assignment(db, submission.assignment_id)
    if assignment and payload.score > assignment.max_score:
        raise HTTPException(status_code=422, detail="Score exceeds max_score")
    return assignment_crud.grade_submission(db, submission, payload.score)


@router.post(
    "/modules/{module_id}/attendance",
    response_model=list[AttendanceRead],
    status_code=status.HTTP_201_CREATED,
)
def record_attendance(
    module_id: int,
    payload: AttendanceBulkCreate,
    db: Session = Depends(get_db),
    _: TokenUser = Depends(require_roles("trainer", "admin")),
):
    if not course_crud.get_module(db, module_id):
        raise _404("Module not found")
    return [
        assignment_crud.upsert_attendance(db, module_id, r.trainee_id, r.status)
        for r in payload.records
    ]


@router.post(
    "/modules/{module_id}/attendance/single",
    response_model=AttendanceRead,
    status_code=status.HTTP_201_CREATED,
)
def record_attendance_single(
    module_id: int,
    payload: AttendanceCreate,
    db: Session = Depends(get_db),
    _: TokenUser = Depends(require_roles("trainer", "admin")),
):
    if not course_crud.get_module(db, module_id):
        raise _404("Module not found")
    return assignment_crud.upsert_attendance(db, module_id, payload.trainee_id, payload.status)


@router.get("/modules/{module_id}/attendance", response_model=list[AttendanceRead])
def list_attendance(module_id: int, db: Session = Depends(get_db), _: User = Depends(get_db_user)):
    if not course_crud.get_module(db, module_id):
        raise _404("Module not found")
    return assignment_crud.list_attendance(db, module_id)
