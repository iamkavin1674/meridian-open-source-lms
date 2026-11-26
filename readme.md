# AI-Powered Multi-Country LMS

A 100% open-source, multi-country (5-region) SaaS Learning Management System supporting **Trainees**, **Trainers**, and **Admins**, built around a two-way AI feedback loop:

- **Flow A (Trainer → Trainee):** trainers submit performance evaluations; in Phase 3 an async worker generates a personalised 3-step action plan from the trainee's `pgvector` learning profile.
- **Flow B (Trainee → Trainer):** trainees submit strictly anonymous weekly surveys (pacing, clarity, difficulty); aggregates power trainer trends and the 5-country admin dashboard.

## Repository layout

| Folder | Contents |
|---|---|
| `backend/` | FastAPI + SQLAlchemy + PostgreSQL/`pgvector` API (start here: [backend/README.md](backend/README.md)) |
| `backend/auth/` | Local auth module — email/password, Google sign-in, OTP password reset ([backend/auth/AGENTS.md](backend/auth/AGENTS.md)) |
| `frontend/` | Next.js frontend (consumer of the API on `http://localhost:3000`) |

## Quick start (backend)

```powershell
Set-Location backend
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
Copy-Item .env.example .env        # set DATABASE_URL password + JWT_SECRET_KEY
.\.venv\Scripts\python.exe -m alembic upgrade head
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload
```

Then open http://localhost:8000/docs for the Swagger UI, or check http://localhost:8000/health.

Full architecture, configuration, command reference, and troubleshooting: [backend/README.md](backend/README.md).
Product/backend spec: [backend/AGENTS.md](backend/AGENTS.md).
