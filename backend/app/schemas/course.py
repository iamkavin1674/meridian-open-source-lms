from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict

EnrollmentStatus = Literal["active", "completed"]
FileType = Literal["pdf", "video", "link"]


class CohortCreate(BaseModel):
    name: str
    country_id: int
    trainer_id: int
    start_date: date | None = None
    end_date: date | None = None


class CohortUpdate(BaseModel):
    name: str | None = None
    country_id: int | None = None
    trainer_id: int | None = None
    start_date: date | None = None
    end_date: date | None = None


class CohortRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    country_id: int
    trainer_id: int
    start_date: date | None
    end_date: date | None


class EnrollmentCreate(BaseModel):
    trainee_id: int
    status: EnrollmentStatus = "active"
    overall_progress_pct: float = 0.0


class EnrollmentUpdate(BaseModel):
    status: EnrollmentStatus | None = None
    overall_progress_pct: float | None = None


class EnrollmentRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    trainee_id: int
    cohort_id: int
    status: str
    overall_progress_pct: float


class CourseCreate(BaseModel):
    title: str
    description: str | None = None


class CourseUpdate(BaseModel):
    title: str | None = None
    description: str | None = None


class CourseRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    cohort_id: int
    title: str
    description: str | None
    created_by: int


class ModuleCreate(BaseModel):
    title: str
    order_index: int = 0
    scheduled_at: datetime | None = None
    meeting_link: str | None = None
    ai_adapted_lesson_plan: str | None = None


class ModuleUpdate(BaseModel):
    title: str | None = None
    order_index: int | None = None
    scheduled_at: datetime | None = None
    meeting_link: str | None = None
    ai_adapted_lesson_plan: str | None = None


class ModuleRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    course_id: int
    title: str
    order_index: int
    scheduled_at: datetime | None
    meeting_link: str | None
    ai_adapted_lesson_plan: str | None


class CourseMaterialCreate(BaseModel):
    title: str
    file_type: FileType
    file_url: str


class CourseMaterialRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    module_id: int
    title: str
    file_type: str
    file_url: str
    uploaded_by: int
    created_at: datetime
