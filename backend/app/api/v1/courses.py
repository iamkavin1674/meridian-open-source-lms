from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import TokenUser, get_db_user, require_roles
from app.crud import course_crud
from app.db.database import get_db
from app.db.models import User
from app.schemas.course import (
    CourseCreate,
    CourseMaterialCreate,
    CourseMaterialRead,
    CourseRead,
    CourseUpdate,
    ModuleCreate,
    ModuleRead,
    ModuleUpdate,
)

router = APIRouter(tags=["courses"])


def _404(detail: str) -> HTTPException:
    return HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=detail)


@router.post(
    "/cohorts/{cohort_id}/courses", response_model=CourseRead, status_code=status.HTTP_201_CREATED
)
def create_course(
    cohort_id: int,
    payload: CourseCreate,
    db: Session = Depends(get_db),
    current: User = Depends(get_db_user),
):
    if current.role not in ("trainer", "admin"):
        raise HTTPException(status_code=403, detail="Only trainers/admins create courses")
    if not course_crud.get_cohort(db, cohort_id):
        raise _404("Cohort not found")
    return course_crud.create_course(db, cohort_id, current.id, payload)


@router.get("/cohorts/{cohort_id}/courses", response_model=list[CourseRead])
def list_courses(cohort_id: int, db: Session = Depends(get_db), _: User = Depends(get_db_user)):
    if not course_crud.get_cohort(db, cohort_id):
        raise _404("Cohort not found")
    return course_crud.list_courses_by_cohort(db, cohort_id)


@router.get("/courses/{course_id}", response_model=CourseRead)
def get_course(course_id: int, db: Session = Depends(get_db), _: User = Depends(get_db_user)):
    course = course_crud.get_course(db, course_id)
    if not course:
        raise _404("Course not found")
    return course


@router.patch("/courses/{course_id}", response_model=CourseRead)
def update_course(
    course_id: int,
    payload: CourseUpdate,
    db: Session = Depends(get_db),
    _: TokenUser = Depends(require_roles("trainer", "admin")),
):
    course = course_crud.get_course(db, course_id)
    if not course:
        raise _404("Course not found")
    return course_crud.update_course(db, course, payload)


@router.delete("/courses/{course_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_course(
    course_id: int,
    db: Session = Depends(get_db),
    _: TokenUser = Depends(require_roles("trainer", "admin")),
):
    course = course_crud.get_course(db, course_id)
    if not course:
        raise _404("Course not found")
    course_crud.delete_course(db, course)
    return None


@router.post(
    "/courses/{course_id}/modules", response_model=ModuleRead, status_code=status.HTTP_201_CREATED
)
def create_module(
    course_id: int,
    payload: ModuleCreate,
    db: Session = Depends(get_db),
    _: TokenUser = Depends(require_roles("trainer", "admin")),
):
    if not course_crud.get_course(db, course_id):
        raise _404("Course not found")
    return course_crud.create_module(db, course_id, payload)


@router.get("/courses/{course_id}/modules", response_model=list[ModuleRead])
def list_modules(course_id: int, db: Session = Depends(get_db), _: User = Depends(get_db_user)):
    if not course_crud.get_course(db, course_id):
        raise _404("Course not found")
    return course_crud.list_modules(db, course_id)


@router.get("/modules/{module_id}", response_model=ModuleRead)
def get_module(module_id: int, db: Session = Depends(get_db), _: User = Depends(get_db_user)):
    module = course_crud.get_module(db, module_id)
    if not module:
        raise _404("Module not found")
    return module


@router.patch("/modules/{module_id}", response_model=ModuleRead)
def update_module(
    module_id: int,
    payload: ModuleUpdate,
    db: Session = Depends(get_db),
    _: TokenUser = Depends(require_roles("trainer", "admin")),
):
    module = course_crud.get_module(db, module_id)
    if not module:
        raise _404("Module not found")
    return course_crud.update_module(db, module, payload)


@router.delete("/modules/{module_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_module(
    module_id: int,
    db: Session = Depends(get_db),
    _: TokenUser = Depends(require_roles("trainer", "admin")),
):
    module = course_crud.get_module(db, module_id)
    if not module:
        raise _404("Module not found")
    course_crud.delete_module(db, module)
    return None


@router.post(
    "/modules/{module_id}/materials",
    response_model=CourseMaterialRead,
    status_code=status.HTTP_201_CREATED,
)
def create_material(
    module_id: int,
    payload: CourseMaterialCreate,
    db: Session = Depends(get_db),
    current: User = Depends(get_db_user),
):
    if current.role not in ("trainer", "admin"):
        raise HTTPException(status_code=403, detail="Only trainers/admins upload materials")
    if not course_crud.get_module(db, module_id):
        raise _404("Module not found")
    return course_crud.create_material(db, module_id, current.id, payload)


@router.get("/modules/{module_id}/materials", response_model=list[CourseMaterialRead])
def list_materials(module_id: int, db: Session = Depends(get_db), _: User = Depends(get_db_user)):
    if not course_crud.get_module(db, module_id):
        raise _404("Module not found")
    return course_crud.list_materials(db, module_id)


@router.delete("/materials/{material_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_material(
    material_id: int,
    db: Session = Depends(get_db),
    _: TokenUser = Depends(require_roles("trainer", "admin")),
):
    material = course_crud.get_material(db, material_id)
    if not material:
        raise _404("Material not found")
    course_crud.delete_material(db, material)
    return None
