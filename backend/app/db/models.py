from datetime import date, datetime, timezone

from pgvector.sqlalchemy import Vector
from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Date,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Country(Base):
    __tablename__ = "countries"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    code: Mapped[str] = mapped_column(String(10), unique=True, index=True, nullable=False)
    default_language: Mapped[str] = mapped_column(String(10), default="en", nullable=False)
    default_timezone: Mapped[str] = mapped_column(String(64), default="UTC", nullable=False)

    users: Mapped[list["User"]] = relationship(back_populates="country")
    cohorts: Mapped[list["Cohort"]] = relationship(back_populates="country")


class User(Base):
    __tablename__ = "users"
    __table_args__ = (
        CheckConstraint("role IN ('trainee','trainer','admin')", name="ck_users_role"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    keycloak_id: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    email: Mapped[str] = mapped_column(String(320), unique=True, index=True, nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(20), index=True, nullable=False)
    country_id: Mapped[int | None] = mapped_column(ForeignKey("countries.id"), nullable=True)
    language: Mapped[str] = mapped_column(String(10), default="en", nullable=False)
    timezone: Mapped[str] = mapped_column(String(64), default="UTC", nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)

    country: Mapped[Country | None] = relationship(back_populates="users")
    trainee_profile: Mapped["TraineeProfile | None"] = relationship(
        back_populates="user", uselist=False, cascade="all, delete-orphan"
    )


class TraineeProfile(Base):
    __tablename__ = "trainee_profiles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), unique=True, nullable=False)
    learning_style: Mapped[str | None] = mapped_column(String(120), nullable=True)
    instruction_preferences: Mapped[str | None] = mapped_column(Text, nullable=True)
    onboarding_completed: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    user: Mapped[User] = relationship(back_populates="trainee_profile")


class Cohort(Base):
    __tablename__ = "cohorts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    country_id: Mapped[int] = mapped_column(ForeignKey("countries.id"), nullable=False)
    trainer_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    start_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    end_date: Mapped[date | None] = mapped_column(Date, nullable=True)

    country: Mapped[Country] = relationship(back_populates="cohorts")
    trainer: Mapped[User] = relationship(foreign_keys=[trainer_id])
    courses: Mapped[list["Course"]] = relationship(back_populates="cohort", cascade="all, delete-orphan")
    enrollments: Mapped[list["Enrollment"]] = relationship(
        back_populates="cohort", cascade="all, delete-orphan"
    )


class Enrollment(Base):
    __tablename__ = "enrollments"
    __table_args__ = (
        UniqueConstraint("trainee_id", "cohort_id", name="uq_enrollment_trainee_cohort"),
        CheckConstraint("status IN ('active','completed')", name="ck_enrollments_status"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    trainee_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    cohort_id: Mapped[int] = mapped_column(ForeignKey("cohorts.id"), nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="active", nullable=False)
    overall_progress_pct: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)

    trainee: Mapped[User] = relationship(foreign_keys=[trainee_id])
    cohort: Mapped[Cohort] = relationship(back_populates="enrollments")


class Course(Base):
    __tablename__ = "courses"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    cohort_id: Mapped[int] = mapped_column(ForeignKey("cohorts.id"), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_by: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)

    cohort: Mapped[Cohort] = relationship(back_populates="courses")
    creator: Mapped[User] = relationship(foreign_keys=[created_by])
    modules: Mapped[list["Module"]] = relationship(back_populates="course", cascade="all, delete-orphan")


class Module(Base):
    __tablename__ = "modules"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    course_id: Mapped[int] = mapped_column(ForeignKey("courses.id"), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    order_index: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    scheduled_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    meeting_link: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    ai_adapted_lesson_plan: Mapped[str | None] = mapped_column(Text, nullable=True)

    course: Mapped[Course] = relationship(back_populates="modules")
    materials: Mapped[list["CourseMaterial"]] = relationship(
        back_populates="module", cascade="all, delete-orphan"
    )
    assignments: Mapped[list["Assignment"]] = relationship(
        back_populates="module", cascade="all, delete-orphan"
    )


class CourseMaterial(Base):
    __tablename__ = "course_materials"
    __table_args__ = (
        CheckConstraint("file_type IN ('pdf','video','link')", name="ck_materials_file_type"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    module_id: Mapped[int] = mapped_column(ForeignKey("modules.id"), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    file_type: Mapped[str] = mapped_column(String(20), nullable=False)
    file_url: Mapped[str] = mapped_column(String(2048), nullable=False)
    uploaded_by: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)

    module: Mapped[Module] = relationship(back_populates="materials")
    uploader: Mapped[User] = relationship(foreign_keys=[uploaded_by])


class Assignment(Base):
    __tablename__ = "assignments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    module_id: Mapped[int] = mapped_column(ForeignKey("modules.id"), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    instructions: Mapped[str | None] = mapped_column(Text, nullable=True)
    attachment_url: Mapped[str | None] = mapped_column(String(2048), nullable=True)
    due_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    max_score: Mapped[float] = mapped_column(Float, default=100.0, nullable=False)

    module: Mapped[Module] = relationship(back_populates="assignments")
    submissions: Mapped[list["AssignmentSubmission"]] = relationship(
        back_populates="assignment", cascade="all, delete-orphan"
    )


class AssignmentSubmission(Base):
    __tablename__ = "assignment_submissions"
    __table_args__ = (
        CheckConstraint("status IN ('pending','graded')", name="ck_submissions_status"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    assignment_id: Mapped[int] = mapped_column(ForeignKey("assignments.id"), nullable=False)
    trainee_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    submission_url: Mapped[str | None] = mapped_column(String(2048), nullable=True)
    submission_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    score: Mapped[float | None] = mapped_column(Float, nullable=True)
    submitted_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="pending", nullable=False)

    assignment: Mapped[Assignment] = relationship(back_populates="submissions")
    trainee: Mapped[User] = relationship(foreign_keys=[trainee_id])


class Attendance(Base):
    __tablename__ = "attendance"
    __table_args__ = (
        CheckConstraint("status IN ('present','absent','late')", name="ck_attendance_status"),
        UniqueConstraint("module_id", "trainee_id", name="uq_attendance_module_trainee"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    module_id: Mapped[int] = mapped_column(ForeignKey("modules.id"), nullable=False)
    trainee_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False)
    recorded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)

    module: Mapped[Module] = relationship()
    trainee: Mapped[User] = relationship(foreign_keys=[trainee_id])


class TrainerEvaluation(Base):
    __tablename__ = "trainer_evaluations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    trainer_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    trainee_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    module_id: Mapped[int] = mapped_column(ForeignKey("modules.id"), nullable=False)
    raw_feedback: Mapped[str] = mapped_column(Text, nullable=False)
    performance_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    ai_action_plan: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)

    trainer: Mapped[User] = relationship(foreign_keys=[trainer_id])
    trainee: Mapped[User] = relationship(foreign_keys=[trainee_id])
    module: Mapped[Module] = relationship()


class TraineeSurvey(Base):
    """Flow B — strictly anonymous: no trainee/user identifier by design."""

    __tablename__ = "trainee_surveys"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    trainer_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    cohort_id: Mapped[int] = mapped_column(ForeignKey("cohorts.id"), nullable=False)
    module_id: Mapped[int] = mapped_column(ForeignKey("modules.id"), nullable=False)
    pacing_score: Mapped[int] = mapped_column(Integer, nullable=False)
    clarity_score: Mapped[int] = mapped_column(Integer, nullable=False)
    difficulty_score: Mapped[int] = mapped_column(Integer, nullable=False)
    comments: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)

    trainer: Mapped[User] = relationship(foreign_keys=[trainer_id])
    cohort: Mapped[Cohort] = relationship()
    module: Mapped[Module] = relationship()


class VectorMemory(Base):
    __tablename__ = "vector_memories"
    __table_args__ = (
        CheckConstraint(
            "memory_type IN ('learning_style','trainer_trend')", name="ck_vector_memory_type"
        ),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    embedding = mapped_column(Vector(768), nullable=True)
    content_text: Mapped[str] = mapped_column(Text, nullable=False)
    memory_type: Mapped[str] = mapped_column(String(30), index=True, nullable=False)
    user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True, index=True)
    role: Mapped[str | None] = mapped_column(String(20), nullable=True, index=True)
    cohort_id: Mapped[int | None] = mapped_column(ForeignKey("cohorts.id"), nullable=True, index=True)
    country_id: Mapped[int | None] = mapped_column(ForeignKey("countries.id"), nullable=True, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow, nullable=False)

    user: Mapped[User | None] = relationship(foreign_keys=[user_id])
