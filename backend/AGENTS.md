# AGENTS.md — AI-Powered Multi-Country LMS Backend

## 1. Project Context & Mission
This repository contains the backend for a 100% open-source, multi-country (5 regions) Software-as-a-Service (LMS) platform supporting three user roles: **Trainees**, **Trainers**, and **Admins**.

The platform is built around a **Two-Way AI Feedback Architecture**:
- **Flow A (Trainer-to-Trainee Coaching):** Trainers submit performance evaluations. PostgreSQL persists the raw feedback, and (in Phase 3) a background worker retrieves the trainee's learning profile from `pgvector` to generate a personalized 3-step action plan.
- **Flow B (Trainee-to-Trainer Feedback):** Trainees submit **strictly anonymous** weekly surveys on pacing, clarity, and difficulty. Aggregated trends help trainers generate adaptive lesson plans and populate the 5-country Admin Dashboard.

**Current Build Scope:** Focus on **Phase 1 (Foundation, Database, Auth)** and **Phase 2 (Core LMS & Manual Two-Way Feedback APIs)**. Leave clean placeholders/stubs for Phase 3 asynchronous AI workers (Celery, LlamaIndex, vLLM).

---

## 2. Verified Open-Source Tech Stack
Strict Open-Source Mandate: **Never introduce proprietary APIs, paid SDKs, or closed-source dependencies.**

- **Language & Framework:** Python, FastAPI, Uvicorn
- **ORM & Migrations:** SQLAlchemy, Alembic, `psycopg2-binary`
- **Validation & Config:** Pydantic v2, `pydantic-settings`
- **Database & Vector Store:** Single unified PostgreSQL database (`lms_db`) with the `pgvector` extension (`pgvector` Python package)
- **Auth & RBAC:** Keycloak (Role-Based Access Control for `trainee`, `trainer`, `admin`)
- **File Storage:** Supabase Object Storage (store only file URLs in PostgreSQL)
- **Async / AI Pipeline (Phase 3 Stub):** Celery, LlamaIndex, vLLM (Llama 3.1/3.3 or Mistral)
- **Frontend Consumer:** Next.js (React + TypeScript + Tailwind + i18next)

---

## 3. Target Backend Directory Structure
Follow this modular layout strictly. Do not mix database queries directly inside route handlers.

```text
backend/
├── AGENTS.md                   # This instruction file
├── alembic/                    # Alembic migration scripts
├── app/
│   ├── __init__.py
│   ├── main.py                 # FastAPI app initialization, router registration, CORS
│   ├── core/
│   │   ├── config.py           # Loads DATABASE_URL & Keycloak settings from .env
│   │   └── security.py         # Keycloak JWT verification & role dependencies
│   ├── db/
│   │   ├── database.py         # SQLAlchemy engine, SessionLocal, Base, get_db()
│   │   └── models.py           # All SQLAlchemy ORM tables (including pgvector)
│   ├── schemas/                # Pydantic request/response models
│   │   ├── user.py
│   │   ├── course.py
│   │   ├── assignment.py
│   │   └── feedback.py
│   ├── crud/                   # Reusable SQLAlchemy queries (Create, Read, Update, Delete)
│   │   ├── user_crud.py
│   │   ├── course_crud.py
│   │   ├── assignment_crud.py
│   │   └── feedback_crud.py
│   ├── api/
│   │   └── v1/                 # Versioned REST endpoints (/api/v1/...)
│   │       ├── users.py
│   │       ├── cohorts.py
│   │       ├── courses.py
│   │       ├── assignments.py
│   │       ├── evaluations.py  # Flow A: Trainer-to-Trainee
│   │       ├── surveys.py      # Flow B: Anonymous Trainee-to-Trainer
│   │       └── admin.py        # 5-country aggregated analytics
│   └── worker/
│       └── celery_app.py       # Phase 3 placeholder for async AI/embedding jobs
├── .env                        # Private local credentials (NEVER read, print, or commit)
├── .env.example                # Safe template for required environment variables
├── .gitignore
├── alembic.ini
└── requirements.txt
```

---

## 4. Database Architecture (Single Unified PostgreSQL + `pgvector`)
Use a **single PostgreSQL database (`lms_db`)** with `CREATE EXTENSION IF NOT EXISTS vector;` already enabled. Do not create secondary databases.

### Required SQLAlchemy Tables (`app/db/models.py`)

#### A. Users, Roles & Regional Localization
1. **`countries`**: `id`, `name`, `code`, `default_language`, `default_timezone`
2. **`users`**: `id`, `keycloak_id` (unique, indexed), `email` (unique), `full_name`, `role` (`trainee` | `trainer` | `admin`), `country_id` (FK -> `countries.id`), `language`, `timezone`, `created_at`
3. **`trainee_profiles`**: `id`, `user_id` (FK -> `users.id`, unique), `learning_style`, `instruction_preferences`, `onboarding_completed` (bool)

#### B. Cohorts, Courses & Materials
4. **`cohorts`**: `id`, `name`, `country_id` (FK), `trainer_id` (FK -> `users.id`), `start_date`, `end_date`
5. **`enrollments`**: `id`, `trainee_id` (FK -> `users.id`), `cohort_id` (FK -> `cohorts.id`), `status` (`active` | `completed`), `overall_progress_pct`
6. **`courses`**: `id`, `cohort_id` (FK -> `cohorts.id`), `title`, `description`, `created_by` (FK -> `users.id`)
7. **`modules`**: `id`, `course_id` (FK -> `courses.id`), `title`, `order_index`, `scheduled_at` (UTC timestamp), `meeting_link` (external Zoom/Meet/Jitsi URL), `ai_adapted_lesson_plan` (Text, nullable)
8. **`course_materials`**: `id`, `module_id` (FK -> `modules.id`), `title`, `file_type` (`pdf` | `video` | `link`), `file_url` (Supabase Object Storage URL), `uploaded_by` (FK -> `users.id`), `created_at`

#### C. Assignments & Attendance
9. **`assignments`**: `id`, `module_id` (FK -> `modules.id`), `title`, `instructions`, `attachment_url` (Supabase URL), `due_date`, `max_score`
10. **`assignment_submissions`**: `id`, `assignment_id` (FK -> `assignments.id`), `trainee_id` (FK -> `users.id`), `submission_url` (Supabase URL), `submission_text`, `score`, `submitted_at`, `status` (`pending` | `graded`)
11. **`attendance`**: `id`, `module_id` (FK -> `modules.id`), `trainee_id` (FK -> `users.id`), `status` (`present` | `absent` | `late`), `recorded_at`

#### D. Two-Way Feedback Loop
12. **`trainer_evaluations` (Flow A)**: `id`, `trainer_id` (FK -> `users.id`), `trainee_id` (FK -> `users.id`), `module_id` (FK -> `modules.id`), `raw_feedback`, `performance_score`, `ai_action_plan` (JSON/Text, nullable), `created_at`
13. **`trainee_surveys` (Flow B)**: `id`, `trainer_id` (FK -> `users.id`), `cohort_id` (FK -> `cohorts.id`), `module_id` (FK -> `modules.id`), `pacing_score`, `clarity_score`, `difficulty_score`, `comments`, `created_at`

#### E. AI Vector Memory (`pgvector`)
14. **`vector_memories`**: `id`, `embedding` (`Vector(768)` via `pgvector.sqlalchemy.Vector`), `content_text`, `memory_type` (`learning_style` | `trainer_trend`), `user_id` (nullable for anonymized cohort trends), `role`, `cohort_id`, `country_id`, `created_at`

---

## 5. Non-Negotiable Privacy, Security & Data Rules
1. **Strict Survey Anonymity (Flow B):**
   - `trainee_surveys` MUST NEVER have a `trainee_id`, `user_id`, email, or any column that links a survey back to an individual student.
   - Strip all personal identity details at the FastAPI endpoint/schema boundary before inserting into PostgreSQL.
2. **Strict Vector & Tenant Isolation:**
   - Every row in `vector_memories` MUST store metadata tags (`user_id`, `role`, `cohort_id`, `country_id`).
   - Every query against `vector_memories` MUST enforce explicit SQLAlchemy `.filter(...)` clauses on these metadata fields so Trainees can never access peer data, trainer dossiers, or admin records.
3. **Credential Safety:**
   - NEVER hardcode database passwords, API keys, or secrets in code, tests, or docs.
   - Always load `DATABASE_URL` via `app/core/config.py` using `pydantic-settings`. Refer only to `.env.example` for variable names.
4. **No Binary Files in PostgreSQL:**
   - Never store raw PDFs, videos, or uploaded assignment files as `BLOB`/`BYTEA` in PostgreSQL. Store only Supabase Object Storage URLs (`file_url`, `attachment_url`, `submission_url`).
5. **Localization & Timestamps:**
   - Always store datetimes in PostgreSQL as timezone-aware UTC (`DateTime(timezone=True)`). Let the frontend (`i18next`) or response serializer localize display times based on the user's `timezone`.
6. **GDPR / Right to Deletion:**
   - Provide `DELETE` endpoints/CRUD operations that cleanly remove user records and associated `vector_memories` entries when required.

---

## 6. API & Coding Conventions
- **URL Structure:** Prefix all routes with `/api/v1` (e.g., `/api/v1/users/me`, `/api/v1/cohorts/{cohort_id}/courses`, `/api/v1/evaluations/trainer-to-trainee`, `/api/v1/surveys/trainee-to-trainer`, `/api/v1/admin/analytics/countries`).
- **HTTP Verb Mapping:**
  - `POST` -> Create records (`db.add()` + `db.commit()` + `db.refresh()`)
  - `GET` -> Read/fetch records (`db.query().filter().all()` or `.first()`)
  - `PATCH` -> Partial updates (use `model_dump(exclude_unset=True)`)
  - `DELETE` -> Delete records (`db.delete()` + `db.commit()`)
- **Database Sessions:** Always inject SQLAlchemy sessions via `db: Session = Depends(get_db)` and ensure `get_db()` uses `try / finally: db.close()`.
- **Clean Separation:**
  - Put SQLAlchemy ORM classes strictly in `app/db/models.py`.
  - Put Pydantic input/output schemas strictly in `app/schemas/`.
  - Put all database queries strictly in `app/crud/`.
  - Keep `app/api/v1/` route handlers thin—handle HTTP status codes, auth dependencies, and delegate DB work to `app/crud/`.
- **CORS:** Configure `CORSMiddleware` in `app/main.py` allowing local Next.js origins (`http://localhost:3000`).

---

## 7. Standard Development Commands
Run these from the `backend/` directory:

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Generate a new Alembic migration after editing app/db/models.py
alembic revision --autogenerate -m "describe_change"

# 3. Apply migrations to PostgreSQL (lms_db)
alembic upgrade head

# 4. Run the local FastAPI development server
uvicorn app.main:app --reload

# 5. Run automated tests
pytest
```

Interactive API documentation is served automatically at `http://localhost:8000/docs`.

---

## 8. Out-of-Scope Boundaries (DO NOT BUILD)
To avoid MVP scope creep, **do not implement** any of the following:
- Open-ended real-time AI chatbots (AI plans are triggered asynchronously upon feedback submission only).
- Built-in WebRTC or native video conferencing (use the `meeting_link` field on `modules` for Zoom/Google Meet/Jitsi).
- Custom LLM training or fine-tuning scripts.
- Native mobile APIs or proprietary third-party SaaS integrations.