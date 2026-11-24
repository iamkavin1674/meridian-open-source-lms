from sqlalchemy.orm import Session

from app.db.models import Country, TraineeProfile, User, VectorMemory
from app.schemas.user import CountryCreate, TraineeProfileCreate, UserCreate, UserUpdate


def create_country(db: Session, data: CountryCreate) -> Country:
    obj = Country(**data.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


def list_countries(db: Session) -> list[Country]:
    return db.query(Country).order_by(Country.id).all()


def get_country(db: Session, country_id: int) -> Country | None:
    return db.query(Country).filter(Country.id == country_id).first()


def get_country_by_code(db: Session, code: str) -> Country | None:
    return db.query(Country).filter(Country.code == code).first()


def get_user(db: Session, user_id: int) -> User | None:
    return db.query(User).filter(User.id == user_id).first()


def get_user_by_keycloak_id(db: Session, keycloak_id: str) -> User | None:
    return db.query(User).filter(User.keycloak_id == keycloak_id).first()


def get_user_by_email(db: Session, email: str) -> User | None:
    return db.query(User).filter(User.email == email).first()


def create_user(db: Session, data: UserCreate) -> User:
    obj = User(**data.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


def list_users(
    db: Session, role: str | None = None, country_id: int | None = None
) -> list[User]:
    q = db.query(User)
    if role:
        q = q.filter(User.role == role)
    if country_id is not None:
        q = q.filter(User.country_id == country_id)
    return q.order_by(User.id).all()


def update_user(db: Session, user: User, data: UserUpdate) -> User:
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(user, key, value)
    db.commit()
    db.refresh(user)
    return user


def delete_user_gdpr(db: Session, user: User) -> None:
    """GDPR deletion: remove vector memories for the user, then the user."""
    db.query(VectorMemory).filter(VectorMemory.user_id == user.id).delete(
        synchronize_session=False
    )
    db.delete(user)
    db.commit()


def get_profile_by_user(db: Session, user_id: int) -> TraineeProfile | None:
    return db.query(TraineeProfile).filter(TraineeProfile.user_id == user_id).first()


def upsert_profile(db: Session, user_id: int, data: TraineeProfileCreate) -> TraineeProfile:
    profile = get_profile_by_user(db, user_id)
    if profile is None:
        profile = TraineeProfile(user_id=user_id, **data.model_dump())
        db.add(profile)
    else:
        for key, value in data.model_dump(exclude_unset=True).items():
            setattr(profile, key, value)
    db.commit()
    db.refresh(profile)
    return profile
