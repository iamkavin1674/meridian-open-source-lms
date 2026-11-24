from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator

AttendanceStatus = Literal["present", "absent", "late"]


class AssignmentCreate(BaseModel):
    title: str
    instructions: str | None = None
    attachment_url: str | None = None
    due_date: datetime | None = None
    max_score: float = Field(default=100.0, gt=0)


class AssignmentUpdate(BaseModel):
    title: str | None = None
    instructions: str | None = None
    attachment_url: str | None = None
    due_date: datetime | None = None
    max_score: float | None = Field(default=None, gt=0)


class AssignmentRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    module_id: int
    title: str
    instructions: str | None
    attachment_url: str | None
    due_date: datetime | None
    max_score: float


class SubmissionCreate(BaseModel):
    submission_url: str | None = None
    submission_text: str | None = None

    @model_validator(mode="after")
    def _require_content(self):
        if not self.submission_url and not self.submission_text:
            raise ValueError("submission_url or submission_text is required")
        return self


class SubmissionGrade(BaseModel):
    score: float = Field(ge=0)


class SubmissionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    assignment_id: int
    trainee_id: int
    submission_url: str | None
    submission_text: str | None
    score: float | None
    submitted_at: datetime
    status: str


class AttendanceCreate(BaseModel):
    trainee_id: int
    status: AttendanceStatus


class AttendanceBulkCreate(BaseModel):
    records: list[AttendanceCreate]


class AttendanceRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    module_id: int
    trainee_id: int
    status: str
    recorded_at: datetime
