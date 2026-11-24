from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1 import admin, assignments, cohorts, courses, evaluations, surveys, users
from app.core.config import settings

app = FastAPI(title=settings.app_name, version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users.router, prefix="/api/v1")
app.include_router(cohorts.router, prefix="/api/v1")
app.include_router(courses.router, prefix="/api/v1")
app.include_router(assignments.router, prefix="/api/v1")
app.include_router(evaluations.router, prefix="/api/v1")
app.include_router(surveys.router, prefix="/api/v1")
app.include_router(admin.router, prefix="/api/v1")


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/")
def root():
    return {"service": settings.app_name, "docs": "/docs", "health": "/health"}
