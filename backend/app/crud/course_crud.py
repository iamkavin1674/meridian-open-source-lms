from sqlalchemy.orm import Session

from app.db.models import Cohort, Course, CourseMaterial, Enrollment, Module
from app.schemas.course import (
    CohortCreate,
    CohortUpdate,
    CourseCreate,
    CourseMaterialCreate,
    CourseUpdate,
    EnrollmentCreate,
    EnrollmentUpdate,
    ModuleCreate,
    ModuleUpdate,
)


def create_cohort(db: Session, data: CohortCreate) -> Cohort:
    obj = Cohort(**data.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


def get_cohort(db: Session, cohort_id: int) -> Cohort | None:
    return db.query(Cohort).filter(Cohort.id == cohort_id).first()


def list_cohorts(db: Session, country_id: int | None = None, trainer_id: int | None = None):
    q = db.query(Cohort)
    if country_id is not None:
        q = q.filter(Cohort.country_id == country_id)
    if trainer_id is not None:
        q = q.filter(Cohort.trainer_id == trainer_id)
    return q.order_by(Cohort.id).all()


def update_cohort(db: Session, cohort: Cohort, data: CohortUpdate) -> Cohort:
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(cohort, k, v)
    db.commit()
    db.refresh(cohort)
    return cohort


def delete_cohort(db: Session, cohort: Cohort) -> None:
    db.delete(cohort)
    db.commit()


def create_enrollment(db: Session, cohort_id: int, data: EnrollmentCreate) -> Enrollment:
    obj = Enrollment(cohort_id=cohort_id, **data.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


def list_enrollments(db: Session, cohort_id: int) -> list[Enrollment]:
    return db.query(Enrollment).filter(Enrollment.cohort_id == cohort_id).all()


def get_enrollment(db: Session, enrollment_id: int) -> Enrollment | None:
    return db.query(Enrollment).filter(Enrollment.id == enrollment_id).first()


def update_enrollment(db: Session, enrollment: Enrollment, data: EnrollmentUpdate) -> Enrollment:
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(enrollment, k, v)
    db.commit()
    db.refresh(enrollment)
    return enrollment


def delete_enrollment(db: Session, enrollment: Enrollment) -> None:
    db.delete(enrollment)
    db.commit()


def create_course(db: Session, cohort_id: int, created_by: int, data: CourseCreate) -> Course:
    obj = Course(cohort_id=cohort_id, created_by=created_by, **data.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


def get_course(db: Session, course_id: int) -> Course | None:
    return db.query(Course).filter(Course.id == course_id).first()


def list_courses_by_cohort(db: Session, cohort_id: int) -> list[Course]:
    return db.query(Course).filter(Course.cohort_id == cohort_id).order_by(Course.id).all()


def update_course(db: Session, course: Course, data: CourseUpdate) -> Course:
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(course, k, v)
    db.commit()
    db.refresh(course)
    return course


def delete_course(db: Session, course: Course) -> None:
    db.delete(course)
    db.commit()


def create_module(db: Session, course_id: int, data: ModuleCreate) -> Module:
    obj = Module(course_id=course_id, **data.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


def get_module(db: Session, module_id: int) -> Module | None:
    return db.query(Module).filter(Module.id == module_id).first()


def list_modules(db: Session, course_id: int) -> list[Module]:
    return (
        db.query(Module)
        .filter(Module.course_id == course_id)
        .order_by(Module.order_index, Module.id)
        .all()
    )


def update_module(db: Session, module: Module, data: ModuleUpdate) -> Module:
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(module, k, v)
    db.commit()
    db.refresh(module)
    return module


def delete_module(db: Session, module: Module) -> None:
    db.delete(module)
    db.commit()


def create_material(db: Session, module_id: int, uploaded_by: int, data: CourseMaterialCreate):
    obj = CourseMaterial(module_id=module_id, uploaded_by=uploaded_by, **data.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


def list_materials(db: Session, module_id: int) -> list[CourseMaterial]:
    return db.query(CourseMaterial).filter(CourseMaterial.module_id == module_id).all()


def get_material(db: Session, material_id: int) -> CourseMaterial | None:
    return db.query(CourseMaterial).filter(CourseMaterial.id == material_id).first()


def delete_material(db: Session, material: CourseMaterial) -> None:
    db.delete(material)
    db.commit()
