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
| **Frontend** | React (JavaScript) + Vite + Tailwind CSS v4 (`http://localhost:3000`) |

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
└── frontend/             # React + Vite client (Meridian LMS login page, port 3000)
```

---

## Running the Project (Backend + Frontend)

You run **two servers** — FastAPI on port 8000 and the Vite frontend on port 3000 — each in its
own PowerShell terminal (leave both terminals open), then open the site in your browser.

### Prerequisites (first time only)

- Python 3.11+, Node.js 20+, PostgreSQL with the `pgvector` extension (service `postgresql-x64-18` on Windows)

```powershell
# Backend setup (from the project root)
Set-Location backend
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
Copy-Item .env.example .env
.\.venv\Scripts\python.exe -m alembic upgrade head

# Frontend setup
Set-Location ..\frontend
npm.cmd install
```

Update `backend/.env` with your local configuration:
- `DATABASE_URL` (PostgreSQL connection string, including the password)
- `JWT_SECRET_KEY`
- `GOOGLE_CLIENT_ID` (for Google Sign-In)

Update `frontend/.env`:
- `VITE_API_BASE_URL=http://127.0.0.1:8000`
- `VITE_GOOGLE_CLIENT_ID` (same Google OAuth Web Client ID)

Make sure PostgreSQL is running first (`Get-Service postgresql-x64-18`; if stopped, run
`Start-Service postgresql-x64-18` from an Administrator PowerShell).

### Terminal 1 — Start the backend (leave open; password-reset OTPs print here)

```powershell
Set-Location D:\LMS-APP\backend
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload
```

Wait for `Uvicorn running on http://127.0.0.1:8000`, then verify:
`http://127.0.0.1:8000/health` returns `{"status":"ok"}` and Swagger UI is at
`http://localhost:8000/docs`.

### Terminal 2 — Start the frontend (leave open)

```powershell
Set-Location D:\LMS-APP\frontend
npm.cmd run dev
```

Wait for `Local: http://localhost:3000/`. (Use `npm.cmd` on Windows PowerShell — `npm.ps1`
is blocked by the default execution policy.)

### Terminal 3 — Open the website

```powershell
Start-Process "http://localhost:3000"
```

### What to check in the page

1. **Layout & theme:** the left slideshow auto-advances every 5 seconds (hover pauses it, the
   bottom ticks switch slides). The sun/moon button (top-right) toggles dark mode — refresh
   the page to confirm the choice persists.
2. **Create Account tab:** register with a new email + password (8+ characters). You land back
   on Sign In with a green "Account created" banner.
3. **Sign In tab:** log in with that account. The card switches to a "You are signed in" panel
   showing your name, email, and role. Click **Sign out**.
4. **Forgot password?:** enter the same email, advance to step 2, copy the 6-digit code from
   **Terminal 1's** output (`[dev email] Password-reset OTP for …`), set a new password, and
   confirm you return to Sign In with a success banner and the new password logs you in.
5. **Error handling:** try a wrong password, mismatched confirm password, and a duplicate
   registration — each shows a readable inline banner, and buttons disable with a spinner
   while a request is in flight.
6. **Google Sign-In:** appears under "or continue with" when `VITE_GOOGLE_CLIENT_ID` is set in
   `frontend/.env`; otherwise a subtle setup notice is shown instead.

### If a port is already in use

A previous backend/frontend is still running. Stop it with `Ctrl+C` in its terminal (or close
that terminal) and re-run the command above.

---

## Roadmap

- [x] Core FastAPI + SQLAlchemy + PostgreSQL/`pgvector` backend foundation
- [x] Authentication module (`backend/auth/` — Email/Password, Google Sign-In, OTP reset)
- [x] Frontend authentication UI & integration (`frontend/` — Meridian LMS login page)
- [ ] Core LMS workflows (Trainee/Trainer evaluations & anonymous weekly surveys)
- [ ] Phase 3: Async AI worker for `pgvector`-backed personalized 3-step action plans
- [ ] 5-country Admin analytics dashboard

---

## Documentation

- **Backend Setup & Reference:** [backend/README.md](backend/README.md)
- **Backend & Product Spec:** [backend/AGENTS.md](backend/AGENTS.md)
- **Auth Module Spec & Security Rules:** [backend/auth/AGENTS.md](backend/auth/AGENTS.md)