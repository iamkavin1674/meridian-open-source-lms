import os

os.environ.setdefault("DATABASE_URL", "sqlite://")
os.environ.setdefault("KEYCLOAK_VERIFY_SIGNATURE", "false")

import jwt as pyjwt
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.db.database import Base, get_db
import app.db.models  # noqa: F401
from app.main import app

engine = create_engine(
    "sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool
)
TestingSession = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base.metadata.create_all(bind=engine)


def override_get_db():
    db = TestingSession()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


def make_token(sub: str, email: str, name: str, role: str) -> str:
    payload = {
        "sub": sub,
        "email": email,
        "name": name,
        "realm_access": {"roles": [role]},
    }
    return pyjwt.encode(payload, key="", algorithm="none")


def auth(sub: str, email: str, name: str, role: str) -> dict:
    return {"Authorization": f"Bearer {make_token(sub, email, name, role)}"}


@pytest.fixture()
def client():
    # Fresh tables per test.
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    with TestClient(app) as c:
        yield c


@pytest.fixture()
def seeded(client):
    """Country + admin/trainer/trainee provisioned users + cohort/course/module."""
    admin_h = auth("kc-admin", "admin@example.com", "Admin", "admin")
    trainer_h = auth("kc-trainer", "trainer@example.com", "Trainer", "trainer")
    trainee_h = auth("kc-trainee", "trainee@example.com", "Trainee", "trainee")
    trainee2_h = auth("kc-trainee2", "trainee2@example.com", "Trainee2", "trainee")

    country = client.post(
        "/api/v1/countries",
        json={"name": "Kenya", "code": "KE", "default_language": "en", "default_timezone": "Africa/Nairobi"},
        headers=admin_h,
    ).json()
    # Sync users (role from token).
    trainer = client.post("/api/v1/users/me/sync", json={"country_id": country["id"]}, headers=trainer_h).json()
    trainee = client.post("/api/v1/users/me/sync", json={"country_id": country["id"]}, headers=trainee_h).json()
    trainee2 = client.post("/api/v1/users/me/sync", json={"country_id": country["id"]}, headers=trainee2_h).json()
    admin = client.post("/api/v1/users/me/sync", json={"country_id": country["id"]}, headers=admin_h).json()

    cohort = client.post(
        "/api/v1/cohorts",
        json={"name": "Cohort 1", "country_id": country["id"], "trainer_id": trainer["id"]},
        headers=admin_h,
    ).json()
    client.post(
        f"/api/v1/cohorts/{cohort['id']}/enrollments",
        json={"trainee_id": trainee["id"]},
        headers=admin_h,
    )
    course = client.post(
        f"/api/v1/cohorts/{cohort['id']}/courses", json={"title": "Python"}, headers=trainer_h
    ).json()
    module = client.post(
        f"/api/v1/courses/{course['id']}/modules", json={"title": "Intro", "order_index": 1}, headers=trainer_h
    ).json()
    return {
        "admin_h": admin_h,
        "trainer_h": trainer_h,
        "trainee_h": trainee_h,
        "trainee2_h": trainee2_h,
        "country": country,
        "trainer": trainer,
        "trainee": trainee,
        "trainee2": trainee2,
        "admin": admin,
        "cohort": cohort,
        "course": course,
        "module": module,
    }
