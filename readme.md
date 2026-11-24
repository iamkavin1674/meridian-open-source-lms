# AI-Powered Multi-Country LMS — Backend

A 100% open-source, multi-region Learning Management System (LMS) backend built with **FastAPI**, **PostgreSQL (`pgvector`)**, and **SQLAlchemy**. Designed to scale across 5 countries, the platform supports **Trainees**, **Trainers**, and **Admins** with localized scheduling, role-based access control, and a privacy-first **Two-Way AI Feedback Architecture**.

---

## Core Architecture & Features

### Two-Way AI Feedback Loop
* **Flow A — Trainer-to-Trainee Coaching:** Trainers submit structured performance evaluations for individual trainees. PostgreSQL persists the raw feedback, and asynchronous workers (Phase 3) retrieve the trainee's learning profile from `pgvector` to generate a personalized 3-step action plan.
* **Flow B — Anonymous Trainee-to-Trainer Feedback:** Trainees submit **strictly anonymous** weekly surveys evaluating pacing, clarity, and difficulty. No user identifiers are ever stored with survey records. Aggregated trends help trainers generate adaptive lesson plans and populate the 5-country Admin Analytics Dashboard.

### Privacy, Security & Multi-Region Design
* **Strict Survey Anonymity:** Personal identity fields are stripped at the API schema boundary before persistence; `trainee_surveys` contains zero user-identifying foreign keys.
* **Vector & Tenant Isolation:** Every embedding in `vector_memories` is tagged with `user_id`, `role`, `cohort_id`, and `country_id` to enforce strict query isolation across roles and regions.
* **Global Localization:** All timestamps are stored as timezone-aware UTC (`DateTime(timezone=True)`) and localized on the client side based on user and regional preferences.
* **Zero-Binary Database Policy:** Course materials, assignment attachments, and student submissions are stored in **Supabase Object Storage**, with only reference URLs saved in PostgreSQL.

---

## Tech Stack

* **Framework:** Python, FastAPI, Uvicorn
* **Database & Vector Search:** PostgreSQL with `pgvector` extension (`Vector(768)`)
* **ORM & Migrations:** SQLAlchemy, Alembic, `psycopg2-binary`
* **Validation & Settings:** Pydantic v2, `pydantic-settings`
* **Authentication & RBAC:** Keycloak (JWT verification for `trainee`, `trainer`, `admin`)
* **Object Storage:** Supabase Object Storage
* **Async AI Pipeline (Phase 3):** Celery, LlamaIndex, vLLM (Llama 3.1/3.3 or Mistral)

---

## Project Structure

```text
backend/
├── alembic/                    # Database migration scripts
├── app/
│   ├── __init__.py
│   ├── main.py                 # FastAPI app initialization, CORS, and router registration
│   ├── core/
│   │   ├── config.py           # Environment configuration via pydantic-settings
│   │   └── security.py         # Keycloak JWT verification & RBAC dependencies
│   ├── db/
│   │   ├── database.py         # SQLAlchemy engine, SessionLocal, Base, get_db()
│   │   └── models.py           # SQLAlchemy ORM models (14 tables + pgvector)
│   ├── schemas/                # Pydantic v2 request/response models
│   ├── crud/                   # Reusable database CRUD operations
│   ├── api/
│   │   └── v1/                 # Versioned REST endpoints (/api/v1/...)
│   └── worker/
│       └── celery_app.py       # Asynchronous AI & embedding worker stubs
├── .env.example                # Environment variable template
├── .gitignore
├── AGENTS.md                   # Coding standards & AI agent guardrails
├── alembic.ini
└── requirements.txt
```

---

## Getting Started

### 1. Prerequisites
* **Python 3.11+**
* **PostgreSQL 16/17** with the `pgvector` extension installed
* **Keycloak** instance (for JWT authentication)
* **Supabase** project (for object storage URLs)

### 2. Database Setup
Create a PostgreSQL database named `lms_db` and enable the `pgvector` extension:

```sql
CREATE DATABASE lms_db;
\c lms_db
CREATE EXTENSION IF NOT EXISTS vector;
```

### 3. Environment Configuration
Clone the repository, navigate into the `backend/` folder, and create your local `.env` file from the template:

```bash
cd backend
cp .env.example .env
```

Update `.env` with your local PostgreSQL credentials and Keycloak settings:

```env
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/lms_db
```

### 4. Install Dependencies & Run Migrations
Create a virtual environment, install the required packages, and apply the Alembic database migrations:

```bash
python -m venv venv
# Windows:
venv\Scripts\activate
# macOS/Linux:
# source venv/bin/activate

pip install -r requirements.txt
alembic upgrade head
```

### 5. Start the Development Server
Launch the FastAPI server with hot-reload enabled:

```bash
uvicorn app.main:app --reload
```

Once running, access the interactive API documentation at:
* **Swagger UI:** `http://localhost:8000/docs`
* **ReDoc:** `http://localhost:8000/redoc`

---

## API Overview (`/api/v1`)

| Domain | Base Endpoint | Description |
| :--- | :--- | :--- |
| **Users & Profiles** | `/api/v1/users` | User registration sync, profile management, and learning preferences |
| **Cohorts** | `/api/v1/cohorts` | Multi-country cohort management and trainee enrollments |
| **Courses & Modules** | `/api/v1/courses` | Course curricula, scheduled sessions, meeting links, and materials |
| **Assignments** | `/api/v1/assignments` | Assignment creation, submissions, grading, and attendance tracking |
| **Evaluations (Flow A)** | `/api/v1/evaluations` | Trainer-to-trainee performance evaluations and AI action plans |
| **Surveys (Flow B)** | `/api/v1/surveys` | Strictly anonymous trainee-to-trainer weekly feedback |
| **Admin Analytics** | `/api/v1/admin` | Aggregated 5-country performance and engagement metrics |

---

## Development Workflow

Whenever you modify SQLAlchemy models in `app/db/models.py`, generate and apply a new migration:

```bash
alembic revision --autogenerate -m "describe_schema_change"
alembic upgrade head
```

Run the test suite with:

```bash
pytest
```