# AI-Powered Multi-Country LMS — Backend

FastAPI backend for a 100% open-source, multi-country (5-region) SaaS LMS with three roles — **Trainee**, **Trainer**, **Admin** — built around a two-way AI feedback loop. For the full product spec, see [AGENTS.md](AGENTS.md).

| Flow | Direction | What happens now (Phase 1–2) | Phase 3 (stubbed) |
|---|---|---|---|
| **Flow A** | Trainer → Trainee | Trainer submits a performance evaluation; it is persisted in PostgreSQL | Celery worker retrieves the trainee's `pgvector` profile and generates a personalised 3-step action plan (`ai_action_plan`) |
| **Flow B** | Trainee → Trainer | Trainee submits a **strictly anonymous** weekly survey (pacing / clarity / difficulty); aggregates feed trainer trends and the 5-country admin dashboard | Trend embeddings stored in `vector_memories` |

**Current scope:** Phase 1 (foundation, database, auth) + Phase 2 (core LMS and manual two-way feedback APIs), plus the local auth module in [auth/](auth/) (email/password, Google sign-in, OTP password reset — see [auth/AGENTS.md](auth/AGENTS.md)). Phase 3 async AI (Celery + LlamaIndex + vLLM) is a clean placeholder in [app/worker/celery_app.py](app/worker/celery_app.py) — tasks log and return `{"status": "stub"}`.

## Tech stack (open-source only)

- **Language/framework:** Python, FastAPI, Uvicorn
- **ORM/migrations:** SQLAlchemy 2, Alembic, `psycopg2-binary`
- **Validation/config:** Pydantic v2, `pydantic-settings`
- **Database:** single PostgreSQL database `lms_db` + `pgvector` extension (vector memory lives in the same DB — no second database)
- **Auth/RBAC:** two systems — Keycloak JWT (RS256 via JWKS) for `/api/v1`, and the local [auth/](auth/) module (Argon2 via `pwdlib[argon2]`, HS256 JWTs, Google ID tokens via `google-auth`) for `/auth`; roles `trainee` / `trainer` / `admin`
- **File storage:** Supabase Object Storage — PostgreSQL stores **URLs only**, never file bytes
- **Async/AI (Phase 3 stub):** Celery + Redis broker, LlamaIndex, vLLM
- **Frontend consumer:** Next.js (not in this folder) on `http://localhost:3000`

## How the code is organised

Route handlers never query the database directly. Every request passes through four layers:

```text
HTTP request
  -> app/api/v1/*.py     thin handlers: HTTP status, auth dependency, delegate
  -> app/crud/*.py       all SQLAlchemy queries live here
  -> app/db/models.py    ORM tables            app/schemas/*.py  Pydantic in/out shapes
  -> app/db/database.py  engine + get_db() session (try/finally: db.close())
```

```text
backend/
├── AGENTS.md                  product spec / agent instructions
├── auth/                      local auth module (own AGENTS.md): router · schemas · models
│                              service · security · dependencies · email
├── alembic/                   migrations (env.py creates the `vector` extension on upgrade)
│   └── versions/              7fae77cd7652 = initial 14 tables · cef4be023a33 = auth fields + OTP table (current head)
├── app/
│   ├── main.py                FastAPI app, CORS (localhost:3000), /api/v1 router registration
│   ├── core/
│   │   ├── config.py          Settings: loads DATABASE_URL + Keycloak/Celery vars from .env
│   │   └── security.py        Keycloak JWT verification, TokenUser, require_roles / get_db_user
│   ├── db/
│   │   ├── database.py        engine, SessionLocal, Base, get_db()
│   │   └── models.py          all 14 ORM tables (incl. Vector(768) embedding)
│   ├── schemas/               user.py · course.py · assignment.py · feedback.py
│   ├── crud/                  user_crud · course_crud · assignment_crud · feedback_crud
│   ├── api/v1/                users · cohorts · courses · assignments
│   │                          evaluations (Flow A) · surveys (Flow B) · admin
│   └── worker/celery_app.py   Phase 3 placeholder tasks
├── tests/                     pytest suite, 13 tests (SQLite + test JWTs; test_api.py + test_auth.py)
├── .env.example               template — copy to .env, never commit .env
├── alembic.ini
└── requirements.txt
```

## Configuration — where the database password goes

There is **no separate password field**. The password is one segment of the single
`DATABASE_URL` connection string, which is read from `.env` by [app/core/config.py](app/core/config.py)
(`pydantic-settings`, `env_file=".env"`) and handed whole to SQLAlchemy in
[app/db/database.py](app/db/database.py) (`create_engine(settings.database_url)`).

```text
DATABASE_URL=postgresql+psycopg2://lms:YOUR_PASSWORD@localhost:5432/lms_db
             └─ driver ─┘          │    └─ password ─┘ └─ host:port ─┘ └ db ┘
                                   └─ DB username
```

Why: SQLAlchemy, Alembic ([alembic/env.py](alembic/env.py) uses the same `settings.database_url`),
and hosted Postgres providers all consume one URL, so secrets are never hardcoded in code
([AGENTS.md](AGENTS.md) §5.3). Environment variables override `.env`, which is how production
secrets should be injected.

| Variable | Used for | Example |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection (incl. password) | `postgresql+psycopg2://lms:secret@localhost:5432/lms_db` |
| `KEYCLOAK_SERVER_URL` / `KEYCLOAK_REALM` / `KEYCLOAK_CLIENT_ID` | JWT issuer + JWKS verification | `http://localhost:8080` / `lms` / `lms-backend` |
| `KEYCLOAK_VERIFY_SIGNATURE` | `true` in real use; tests set `false` | `true` |
| `CELERY_BROKER_URL` / `CELERY_RESULT_BACKEND` | Phase 3 worker (Redis) | `redis://localhost:6379/0` |
| `SUPABASE_URL` | Object-storage base (URLs stored in DB) | `https://<project>.supabase.co` |
| `CORS_ORIGINS` | Allowed frontend origins | `["http://localhost:3000"]` |
| `JWT_SECRET_KEY` | Signs local `/auth` JWTs (required for login) | long random hex — generate, never commit |
| `GOOGLE_CLIENT_ID` | Verifies Google ID tokens on `POST /auth/google` | `<id>.apps.googleusercontent.com` |
| `OTP_EXPIRE_MINUTES` / `OTP_MAX_ATTEMPTS` | Password-reset OTP lifetime / failed-try cap | `10` / `5` |
| `SMTP_HOST` (+ `SMTP_PORT/USERNAME/PASSWORD/FROM`) | OTP email delivery; empty host = print OTP to console (dev only) | `smtp.example.com` |

Notes: URL-encode special password characters (`@` → `%40`, `:` → `%3A`, `/` → `%2F`).
The default in `config.py` (`lms:lms@…`) is a local-dev fallback only — `.env` overrides it.
To change the password later, update **both** places: the segment in `.env`, and the role itself
(`ALTER USER lms WITH PASSWORD 'new-secret';` — see Database commands below).

### Auth model — two coexisting systems

**1. Keycloak for `/api/v1` (LMS routes).** Every `/api/v1` route requires `Authorization: Bearer <Keycloak JWT>`.
[app/core/security.py](app/core/security.py) verifies the RS256 signature against Keycloak's JWKS
(`{server}/realms/{realm}/protocol/openid-connect/certs`), extracts roles from `realm_access.roles` /
`resource_access[<client>].roles`, then maps `sub` → `users.keycloak_id`. A token alone is not enough for most
endpoints: the user must first be **provisioned** in PostgreSQL via `POST /api/v1/users/me/sync` (creates the
`users` row — and a `trainee_profiles` row for trainees — from the token). After that the **DB role is authoritative**.

**2. Local auth for `/auth` ([auth/](auth/), rules in [auth/AGENTS.md](auth/AGENTS.md)).** Self-registration and
sign-in without Keycloak, mounted at `/auth` in [app/main.py](app/main.py):

- `POST /auth/register` — Argon2-hashes the password (`pwdlib[argon2]`); plaintext is never stored, logged, or returned. Duplicate email → `409`. New trainees also get a `trainee_profiles` row.
- `POST /auth/login` — verifies the Argon2 hash, returns an HS256 JWT signed with `JWT_SECRET_KEY` (60 min default). Unknown email uses a dummy-hash verify so timing does not reveal accounts.
- `POST /auth/google` — verifies the Google ID token against `GOOGLE_CLIENT_ID` (`google-auth`), upserts by unique `google_sub` (linking to an existing account with the same email). Google-only accounts have `hashed_password = NULL` and get a graceful "continue with Google" `401` on password login.
- `POST /auth/forgot-password` — creates a 6-digit OTP (`secrets`), stores **only its SHA-256 hash** with a 10-minute expiry, invalidates prior unused OTPs, and delivers via SMTP — or prints to the server console when `SMTP_HOST` is empty (dev). **Always** returns the same generic `200` message, existing email or not (no enumeration).
- `POST /auth/reset-password` — generic `400` on any failure; wrong codes increment `attempts`, the OTP is invalidated at 5 attempts, on expiry, and after one successful use (which also lets a Google-only account set a password).
- `GET /auth/me` — example protected route using [auth/dependencies.py](auth/dependencies.py) `get_current_user` / `require_roles`.

Both systems share the same `users` table: local users have `keycloak_id = NULL`; Keycloak users have
`hashed_password = NULL` until they set one. Local `/auth` JWTs currently authenticate `/auth` routes only —
`/api/v1` still expects Keycloak tokens.

## Database schema (15 tables, one PostgreSQL DB)

| Group | Tables |
|---|---|
| Users & regions | `countries`, `users` (`keycloak_id` unique/nullable, `google_sub` unique/nullable, `hashed_password` nullable), `trainee_profiles`, `password_reset_otps` (hash only, expiry, attempts, used) |
| Cohorts & courses | `cohorts`, `enrollments`, `courses`, `modules` (`meeting_link`, `ai_adapted_lesson_plan`), `course_materials` (Supabase URL only) |
| Work & attendance | `assignments`, `assignment_submissions`, `attendance` |
| Two-way feedback | `trainer_evaluations` (Flow A, `ai_action_plan` nullable), `trainee_surveys` (Flow B) |
| AI vector memory | `vector_memories` — `embedding Vector(768)` + metadata tags `user_id`, `role`, `cohort_id`, `country_id` |

Non-negotiable rules enforced in code (see [AGENTS.md](AGENTS.md) §5):

- **Survey anonymity:** `trainee_surveys` has *no* `trainee_id`/`user_id`/email column, and the request schema
  ([app/schemas/feedback.py](app/schemas/feedback.py)) rejects identity fields with `extra="forbid"` (HTTP 422).
- **Vector tenant isolation:** every `vector_memories` query must pass at least one metadata filter
  (`user_id`, `role`, `cohort_id`, `country_id`); non-admins can only read/write their own rows. Unfiltered listing returns 422.
- **No binaries in Postgres:** only Supabase URLs (`file_url`, `attachment_url`, `submission_url`).
- **Timestamps:** stored timezone-aware UTC; the frontend localises by the user's `timezone`.
- **GDPR:** `DELETE /api/v1/users/me`, `DELETE /api/v1/users/{id}` and `DELETE /api/v1/admin/users/{id}` remove the user **and** their `vector_memories`.

## API overview

Local auth lives under `/auth` (no `/api/v1` prefix); everything else is under `/api/v1`.

| Area | Key endpoints |
|---|---|
| Auth (`/auth`) | `POST /auth/register`, `POST /auth/login`, `POST /auth/google`, `POST /auth/forgot-password`, `POST /auth/reset-password`, `GET /auth/me` |
| Users | `POST /users/me/sync`, `GET/PATCH/DELETE /users/me`, `PUT /users/me/profile`, `GET /countries`, `POST /countries` (admin) |
| Cohorts | `POST/GET /cohorts`, `PATCH/DELETE /cohorts/{id}`, `POST/GET /cohorts/{id}/enrollments` |
| Courses | `POST/GET /cohorts/{id}/courses`, `POST/GET /courses/{id}/modules`, `POST/GET /modules/{id}/materials` |
| Assignments | `POST/GET /modules/{id}/assignments`, `POST/GET /assignments/{id}/submissions`, `PATCH /submissions/{id}/grade` (score ≤ `max_score`), `POST/GET /modules/{id}/attendance` |
| Flow A | `POST /evaluations/trainer-to-trainee` (trainer only; trainees read only their own), `GET /evaluations/trainer-to-trainee[/{id}]` |
| Flow B | `POST /surveys/trainee-to-trainer` (trainee only, anonymous), `GET /surveys/trainee-to-trainer/aggregate`, `GET /surveys/me/trends` |
| Admin | `GET /admin/analytics/countries` (5-country dashboard), `GET /admin/analytics/overview`, `POST/GET/DELETE /admin/vector-memories` |

Interactive docs: `http://localhost:8000/docs` · health: `http://localhost:8000/health` → `{"status":"ok"}`.
Without a Keycloak token the docs will show `401` on `/api/v1` calls — that is expected.

## Setup (Windows / PowerShell)

```powershell
# 1. Enter the backend and create the virtual environment (first time only)
Set-Location D:\LMS-APP\backend
python -m venv .venv

# 2. Install dependencies (use the venv interpreter directly — no activation needed)
.\.venv\Scripts\python.exe -m pip install -r requirements.txt

# 3. Create your local config: set the DB password AND a JWT secret
Copy-Item .env.example .env
notepad .env        # replace change-me in DATABASE_URL=postgresql+psycopg2://lms:<password>@localhost:5432/lms_db
                    # and set JWT_SECRET_KEY to a long random value (login fails without it)

# 4. Make sure PostgreSQL is running (service name on this machine)
Get-Service postgresql-x64-18
Start-Service postgresql-x64-18    # Administrator PowerShell, only if not Running

# 5. Apply migrations (creates the pgvector extension + all tables)
.\.venv\Scripts\python.exe -m alembic upgrade head

# 6. Start FastAPI (leave this window open; Ctrl+C stops it)
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload
```

Then open `http://localhost:8000/docs` in your browser.

> On macOS/Linux the same steps apply with `.venv/bin/python` instead of `.venv\Scripts\python.exe`,
> `cp .env.example .env`, and your platform's PostgreSQL service command (`brew services start postgresql`,
> `sudo systemctl start postgresql`, or `docker compose up -d` if you run Postgres in Docker —
> use a `pgvector/pgvector` image so the `vector` extension exists).

## Command reference

Run everything from `backend\` unless stated. Using `.\.venv\Scripts\python.exe -m <tool>` avoids
virtualenv-activation problems entirely; `.\.venv\Scripts\Activate.ps1` once per shell also works.

### Python environment

```powershell
python -m venv .venv                                   # create venv (first time)
.\.venv\Scripts\Activate.ps1                           # OR activate it for this shell
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m pip list                 # see installed packages
```

### PostgreSQL service & psql (database commands)

```powershell
Get-Service postgresql-x64-18                          # is the DB server running?
Start-Service postgresql-x64-18                        # start it (Administrator shell)
Stop-Service postgresql-x64-18                         # stop it (Administrator shell)
Restart-Service postgresql-x64-18                      # restart after config changes
```

One-time database/role creation, as the `postgres` superuser
(`"C:\Program Files\PostgreSQL\18\bin\psql.exe"` if `psql` is not on PATH):

```sql
CREATE USER lms WITH PASSWORD 'your-password' LOGIN;
CREATE DATABASE lms_db OWNER lms;
-- later, to rotate the password (keep .env in sync!):
ALTER USER lms WITH PASSWORD 'new-password';
```

Useful `psql` checks (prompts for the `lms` password):

```powershell
psql -h localhost -U lms -d lms_db -c "SELECT 1;"                       # login works?
psql -h localhost -U lms -d lms_db -c "\dt"                             # list tables
psql -h localhost -U lms -d lms_db -c "SELECT extname FROM pg_extension WHERE extname='vector';"
psql -h localhost -U lms -d lms_db -c "SELECT * FROM alembic_version;"  # applied migration
```

### Verify the app can connect (uses the password from `.env`)

```powershell
.\.venv\Scripts\python.exe -c "from sqlalchemy import text; from app.db.database import engine; print(engine.connect().execute(text('SELECT 1')).scalar())"
# Expected output: 1
```

### Alembic migrations

```powershell
.\.venv\Scripts\python.exe -m alembic revision --autogenerate -m "describe_change"  # after editing app/db/models.py
.\.venv\Scripts\python.exe -m alembic upgrade head      # apply all pending migrations
.\.venv\Scripts\python.exe -m alembic current           # show applied revision
.\.venv\Scripts\python.exe -m alembic history           # list revisions
.\.venv\Scripts\python.exe -m alembic downgrade -1      # roll back one migration
```

Committed migrations: `7fae77cd7652_initial_schema.py` (14 tables) and
`cef4be023a33_add_auth_fields_and_password_reset_otps.py` (`users.hashed_password`, `users.google_sub`,
nullable `keycloak_id`, `password_reset_otps`) — `alembic current` should show `cef4be023a33 (head)`.
[alembic/env.py](alembic/env.py) imports both `app.db.models` and `auth.models` so autogenerate sees every table.
The initial migration contains `import pgvector.sqlalchemy` at the top — keep that line in future autogenerated
migrations too, otherwise upgrading fails with `NameError: name 'pgvector' is not defined`.

### FastAPI server

```powershell
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload                    # dev (auto-reload, port 8000)
.\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000
Invoke-RestMethod http://127.0.0.1:8000/health          # {"status":"ok"}
Invoke-WebRequest http://127.0.0.1:8000/docs            # 200 = docs page up
```

### Tests

```powershell
.\.venv\Scripts\python.exe -m pytest                    # full suite: 13 tests (SQLite, no Postgres/Keycloak/Google needed)
.\.venv\Scripts\python.exe -m pytest tests/test_api.py -q   # 8 LMS/API tests
.\.venv\Scripts\python.exe -m pytest tests/test_auth.py -q  # 5 auth tests (Google verifier is mocked)
.\.venv\Scripts\python.exe -m pytest -k survey          # single area, e.g. Flow B anonymity
```

### Phase 3 worker (stub)

```powershell
# Requires Redis on localhost:6379. Tasks currently only log — no AI is generated yet.
.\.venv\Scripts\python.exe -m celery -A app.worker.celery_app.celery_app worker --loglevel=info
```

### Checking endpoints in Swagger UI

```powershell
# Terminal 1: start the server (keep it open) — Terminal 2: open the docs
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload
Start-Process "http://localhost:8000/docs"
Invoke-RestMethod http://127.0.0.1:8000/health          # {"status":"ok"}
```

In the docs page, expand any endpoint → **Try it out** → edit the example body → **Execute**.
For protected routes (`GET /auth/me`, all `/api/v1` routes): first get a token (`POST /auth/login` for
`/auth` routes, a Keycloak token for `/api/v1`), click **Authorize** (top-right), paste `Bearer <token>`,
then execute. Without a token you will see `401` — expected. The password-reset OTP appears in the
Terminal 1 (uvicorn) console as `[dev email] Password-reset OTP for …` when `SMTP_HOST` is empty.

### First API calls — local auth (`/auth`, no Keycloak needed)

```powershell
$base = "http://127.0.0.1:8000"

# Register -> login -> me
Invoke-RestMethod -Method Post "$base/auth/register" -ContentType application/json `
  -Body '{"email":"check@example.com","password":"password123","full_name":"Check User"}'
$login = Invoke-RestMethod -Method Post "$base/auth/login" -ContentType application/json `
  -Body '{"email":"check@example.com","password":"password123"}'
Invoke-RestMethod "$base/auth/me" -Headers @{ Authorization = "Bearer $($login.access_token)" }

# Forgot/reset (generic 200 either way; read the OTP from the uvicorn console, paste it below)
Invoke-RestMethod -Method Post "$base/auth/forgot-password" -ContentType application/json `
  -Body '{"email":"check@example.com"}'
Invoke-RestMethod -Method Post "$base/auth/reset-password" -ContentType application/json `
  -Body '{"email":"check@example.com","otp":"PASTE_OTP_HERE","new_password":"newpassword1"}'
```

### First API calls — LMS (with a Keycloak token)

```powershell
$token = "<keycloak-access-token>"
$headers = @{ Authorization = "Bearer $token" }

# 1. Provision your DB user from the token (required before most endpoints)
Invoke-RestMethod -Method Post -Uri http://localhost:8000/api/v1/users/me/sync -Headers $headers -ContentType application/json -Body '{}'

# 2. Who am I?
Invoke-RestMethod -Uri http://localhost:8000/api/v1/users/me -Headers $headers

# 3. Flow B example — anonymous survey (note: no trainee identifier is sent or stored)
$survey = @{ trainer_id = 2; cohort_id = 1; module_id = 1; pacing_score = 4; clarity_score = 5; difficulty_score = 3 } | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri http://localhost:8000/api/v1/surveys/trainee-to-trainer -Headers $headers -ContentType application/json -Body $survey
```

## Troubleshooting

| Symptom | Cause & fix |
|---|---|
| `ModuleNotFoundError: No module named 'app'` | You ran Python outside `backend\`. `Set-Location` into `backend\` first — `app` is a relative package. |
| `ModuleNotFoundError: No module named 'sqlalchemy'` / `'fastapi'` | System Python, not the venv. Use `.\.venv\Scripts\python.exe …` (or activate the venv). |
| `FATAL: password authentication failed for user "lms"` | The password segment in `.env`'s `DATABASE_URL` doesn't match the role. Align them: edit `.env`, or `ALTER USER lms WITH PASSWORD '…';` as superuser — both must agree. Also check the `lms` role and `lms_db` database exist (see psql commands). |
| `NameError: name 'pgvector' is not defined` on `alembic upgrade` | Autogenerated migration is missing the import — add `import pgvector.sqlalchemy` at its top (already done in the initial migration). |
| `could not connect` / connection refused on the SELECT 1 check | PostgreSQL service is stopped. `Get-Service postgresql-x64-18`, then `Start-Service` from an Administrator shell. |
| Port 8000 already in use | Another Uvicorn is running. Stop it (Ctrl+C in its window) or start with `--port 8001`. |
| Docs load but every `/api/v1` call is `401` | No/expired Keycloak token, or user not provisioned. Send a valid Bearer token and call `POST /api/v1/users/me/sync` once. `403` means your DB role lacks permission for that endpoint. |
| Tables missing / `relation "users" does not exist` | Migrations not applied. Run `alembic upgrade head` from `backend\`. |
| `/auth/*` returns `404` in the docs | The running server predates the auth module. Restart Uvicorn (or use `--reload`) from `backend\`. |
| `POST /auth/login` returns `500` "JWT_SECRET_KEY is not configured" | Set a long random `JWT_SECRET_KEY` in `.env` and restart the server. |
| `POST /auth/google` returns `503` / `401` | `503`: set `GOOGLE_CLIENT_ID` in `.env`. `401`: the ID token is expired, for another client, or the verifier is unreachable — use a fresh token from your Google OAuth client. |
| `POST /auth/reset-password` returns `400` | Generic failure by design: wrong code, code expired (10 min), 5 failed attempts reached, or code already used. Request a fresh OTP; in dev read it from the uvicorn console. |
| Verify auth state in the DB | `psql … -c "SELECT email, google_sub IS NOT NULL AS has_google, hashed_password IS NOT NULL AS has_password FROM users;"` and `SELECT user_id, attempts, used, expires_at FROM password_reset_otps ORDER BY id DESC LIMIT 3;` — `otp_hash` is a SHA-256 hash, never the code itself. |

## Out of scope (by design)

No real-time AI chat, no built-in video conferencing (use `modules.meeting_link` for Zoom/Meet/Jitsi),
no LLM training, no proprietary APIs or paid SDKs. See [AGENTS.md](AGENTS.md) §8.

