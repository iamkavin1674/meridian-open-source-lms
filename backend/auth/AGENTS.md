# Auth Module Rules (`backend/auth/`)

These rules apply specifically to authentication and extend the root `backend/AGENTS.md`. Do not recreate or modify the core database engine, session setup, or existing FastAPI app initialization—reuse them.

## Module Structure
Keep all auth code self-contained inside `backend/auth/`:
- `router.py` — Thin FastAPI endpoints mounted under `/auth` in `main.py`
- `schemas.py` — Pydantic v2 request/response models
- `models.py` — SQLAlchemy models (`PasswordResetOTP`, and `User` if not already defined in the DB layer)
- `service.py` — Business logic (registration, login, Google token verification, OTP lifecycle)
- `security.py` — Password hashing, JWT creation/decoding, OTP generation/hashing
- `dependencies.py` — `get_current_user` and role guards for protected routes
- `email.py` — OTP email delivery (prints OTP to console in dev; SMTP/provider in prod)

## Required Endpoints
- `POST /auth/register` — Email, password, full name → hashes password, creates user
- `POST /auth/login` — Email, password → verifies hash, returns JWT access token
- `POST /auth/google` — `{ "id_token" }` → verifies Google OAuth2 ID token, upserts user via `google_sub`, returns JWT
- `POST /auth/forgot-password` — `{ "email" }` → generates 6-digit OTP, stores hash + expiry, sends/logs OTP
- `POST /auth/reset-password` — `{ "email", "otp", "new_password" }` → validates OTP, updates password hash, marks OTP used

## Security Rules (Strict)
- **Password hashing:** Use `pwdlib[argon2]`. Never store, log, or return plain-text passwords.
- **Google accounts:** Keep `hashed_password` nullable and add a unique, nullable `google_sub` column on `users`. Handle Google-only accounts gracefully if they attempt password login.
- **OTP handling:** Generate cryptographically random 6-digit codes (`secrets`), store only the hash (`SHA-256` or Argon2), enforce a 10-minute expiry, cap failed attempts (e.g., 5 max), and invalidate prior unused OTPs on re-request.
- **No email enumeration:** `POST /auth/forgot-password` must always return `200 OK` with a generic message whether or not the email exists.
- **Secrets:** Read `JWT_SECRET_KEY`, `GOOGLE_CLIENT_ID`, and SMTP credentials from environment variables via your existing config/settings module—never hardcode them.

## Integration Checklist
- Import `get_db` from the existing database module.
- Register new SQLAlchemy models in Alembic's `env.py` before generating migrations.
- Mount `auth.router` in `main.py` with `prefix="/auth"` and ensure `CORSMiddleware` allows `http://localhost:3000` for local frontend testing.

## File Structure

Keep all auth code self-contained inside `backend/auth/` using this exact file layout:

```text
backend/auth/
├── __init__.py        # Re-exports router and get_current_user for clean imports
├── router.py          # Thin FastAPI endpoints mounted under /auth in main.py
├── schemas.py         # Pydantic v2 request/response models (Register, Login, GoogleAuth, OTP, Token)
├── models.py          # SQLAlchemy models (PasswordResetOTP, and User if not already in the DB layer)
├── service.py         # Business logic: registration, login, Google ID token check, OTP lifecycle
├── security.py        # Argon2 password hashing, JWT encode/decode, 6-digit OTP generation & hashing
├── dependencies.py    # get_current_user and role guards for protected LMS routes
└── email.py           # OTP email delivery (prints OTP to console in dev; SMTP/provider in prod)
``` 

