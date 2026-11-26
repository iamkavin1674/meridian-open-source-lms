# AI-Powered Multi-Country LMS

An open-source, multi-region (5-country) SaaS Learning Management System built for **Trainees**, **Trainers**, and **Admins**, powered by a two-way AI feedback loop.

## Core Features

### Two-Way AI Feedback Loop
- **Flow A — Trainer → Trainee:** Trainers submit structured performance evaluations. In Phase 3, an async background worker generates a personalized 3-step action plan using each trainee's `pgvector` learning profile.
- **Flow B — Trainee → Trainer:** Trainees submit strictly anonymous weekly surveys covering pacing, clarity, and difficulty. Aggregated insights drive trainer trend analytics and the 5-country Admin dashboard.

### Authentication & Access Control
- **Email & Password:** Argon2 password hashing (`pwdlib[argon2]`) with JWT-based session auth.
- **Google Sign-In:** OAuth2 ID token verification linked to user accounts.
- **OTP Password Reset:** 6-digit email OTP verification flow with expiry and anti-enumeration protection.
- **Role Support:** Designed around `Trainee`, `Trainer`, and `Admin` access tiers.

---

## Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Backend** | Python, FastAPI, SQLAlchemy, Alembic |
| **Database** | PostgreSQL with `pgvector` |
| **Authentication** | JWT, `pwdlib[argon2]`, Google OAuth2, Email OTP |
| **Frontend** | Next.js (`http://localhost:3000`) |

---

## Repository Layout

```text
.
├── backend/
│   ├── app/              # Core FastAPI app, DB config, and LMS domain modules
│   ├── auth/             # Self-contained auth module (Email/Password, Google OAuth, OTP reset)
│   ├── alembic/          # Database migrations
│   ├── README.md         # Full backend architecture, commands, and troubleshooting
│   └── AGENTS.md         # Global backend development rules and spec
└── frontend/             # Next.js client application (connects to API on port 8000)
```

---

## Quick Start (Backend)

### Prerequisites
- Python 3.11+
- PostgreSQL with the `pgvector` extension enabled

### 1. Setup & Run (PowerShell)

```powershell
Set-Location backend
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
Copy-Item .env.example .env
```

Update `backend/.env` with your local configuration:
- `DATABASE_URL` (PostgreSQL connection string)
- `JWT_SECRET_KEY`
- `GOOGLE_CLIENT_ID` (for Google Sign-In)

### 2. Run Migrations & Start the Server

```powershell
.\.venv\Scripts\python.exe -m alembic upgrade head
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload
```

### 3. Verify the API
- **Swagger UI (Interactive Docs):** `http://localhost:8000/docs`
- **Health Check:** `http://localhost:8000/health`

---

## Roadmap

- [x] Core FastAPI + SQLAlchemy + PostgreSQL/`pgvector` backend foundation
- [x] Authentication module (`backend/auth/` — Email/Password, Google Sign-In, OTP reset)
- [ ] Frontend authentication UI & integration (`frontend/`)
- [ ] Core LMS workflows (Trainee/Trainer evaluations & anonymous weekly surveys)
- [ ] Phase 3: Async AI worker for `pgvector`-backed personalized 3-step action plans
- [ ] 5-country Admin analytics dashboard

---

## Documentation

- **Backend Setup & Reference:** [backend/README.md](backend/README.md)
- **Backend & Product Spec:** [backend/AGENTS.md](backend/AGENTS.md)
- **Auth Module Spec & Security Rules:** [backend/auth/AGENTS.md](backend/auth/AGENTS.md)