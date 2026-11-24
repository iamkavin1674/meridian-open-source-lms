from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

MemoryType = Literal["learning_style", "trainer_trend"]


class TrainerEvaluationCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    trainee_id: int
    module_id: int
    raw_feedback: str = Field(min_length=1)
    performance_score: float | None = Field(default=None, ge=0, le=100)


class TrainerEvaluationRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    trainer_id: int
    trainee_id: int
    module_id: int
    raw_feedback: str
    performance_score: float | None
    ai_action_plan: str | None
    created_at: datetime


class TraineeSurveyCreate(BaseModel):
    """Flow B input — identity fields are forbidden and never persisted."""

    model_config = ConfigDict(extra="forbid")
    trainer_id: int
    cohort_id: int
    module_id: int
    pacing_score: int = Field(ge=1, le=5)
    clarity_score: int = Field(ge=1, le=5)
    difficulty_score: int = Field(ge=1, le=5)
    comments: str | None = None


class TraineeSurveyRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    trainer_id: int
    cohort_id: int
    module_id: int
    pacing_score: int
    clarity_score: int
    difficulty_score: int
    comments: str | None
    created_at: datetime


class SurveyAggregate(BaseModel):
    trainer_id: int | None = None
    cohort_id: int | None = None
    module_id: int | None = None
    count: int
    avg_pacing: float | None = None
    avg_clarity: float | None = None
    avg_difficulty: float | None = None


class VectorMemoryCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    content_text: str = Field(min_length=1)
    memory_type: MemoryType
    embedding: list[float] | None = Field(default=None, min_length=768, max_length=768)
    user_id: int | None = None
    role: str | None = None
    cohort_id: int | None = None
    country_id: int | None = None


class VectorMemoryRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    content_text: str
    memory_type: str
    user_id: int | None
    role: str | None
    cohort_id: int | None
    country_id: int | None
    created_at: datetime
    # embedding intentionally omitted from responses (large, internal)


class CountryAnalytics(BaseModel):
    country_id: int
    country_code: str
    country_name: str
    users: int
    trainees: int
    trainers: int
    cohorts: int
    evaluations: int
    avg_performance_score: float | None = None
    surveys: int
    avg_pacing: float | None = None
    avg_clarity: float | None = None
    avg_difficulty: float | None = None


class OverviewAnalytics(BaseModel):
    countries: int
    users: int
    trainees: int
    trainers: int
    admins: int
    cohorts: int
    courses: int
    evaluations: int
    surveys: int
    avg_performance_score: float | None = None
    avg_pacing: float | None = None
    avg_clarity: float | None = None
    avg_difficulty: float | None = None
