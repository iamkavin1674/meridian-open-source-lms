# Frontend Rules (`frontend/`)

These rules govern the **Meridian LMS** frontend (AI-powered, 5-country SaaS Learning Management System). For now, scope all implementation strictly to the **Login Page** and its authentication flows. Follow the stack, folder layout, and FastAPI contract below without introducing unrequested frameworks or TypeScript.

## Tech Stack & Environment

* **Framework:** React (JavaScript — `.jsx` and `.js` files only; do **not** use TypeScript)
* **Bundler:** Vite, locked to `http://localhost:3000` (`server.port = 3000` in `vite.config.js`) to match FastAPI CORS and Google OAuth authorized origins
* **Styling:** Tailwind CSS v4 (`@tailwindcss/vite` plugin)
* **Icons:** `lucide-react`
* **Google Auth:** `@react-oauth/google`
* **Environment Variables (`frontend/.env`):**
  * `VITE_API_BASE_URL` (default: `http://127.0.0.1:8000`)
  * `VITE_GOOGLE_CLIENT_ID` (Google OAuth 2.0 Web Client ID)

## Folder Structure

Keep the frontend modular using this exact layout:

```text
frontend/
├── vite.config.js                 # React + Tailwind v4 plugins, server.port = 3000
├── .env                           # VITE_API_BASE_URL, VITE_GOOGLE_CLIENT_ID (gitignored)
└── src/
    ├── main.jsx                   # Wraps <App/> in <GoogleOAuthProvider> and <AuthProvider>
    ├── App.jsx                    # Renders LoginPage
    ├── index.css                  # Tailwind v4 import + class-based dark mode variant
    ├── api/
    │   ├── client.js              # Shared fetch wrapper, Bearer token header, FastAPI error parser
    │   └── auth.js                # /auth/* API helpers built on client.js
    ├── context/
    │   └── AuthContext.jsx        # Global auth state (token, user, login, logout)
    ├── pages/
    │   └── LoginPage.jsx          # Split-screen authentication page (tabs + slideshow + theme toggle)
    └── components/
        ├── common/
        │   └── ThemeToggle.jsx    # Reusable Sun/Moon dark mode toggle button
        └── auth/
            ├── FeatureSlideshow.jsx   # Auto-advancing feature card slideshow
            ├── LoginForm.jsx          # Email/password login + Google Sign-In
            ├── RegisterForm.jsx       # Create account form
            └── ForgotPasswordFlow.jsx # 2-step OTP request + verify/reset flow
```

*(Note: Keep `pages/` for full-screen views and `components/common/` for reusable UI elements. Do not scaffold any dashboard or extra routes yet.)*

## UI & Design Requirements

### 1. Layout & Theme

* **Split-screen layout (`pages/LoginPage.jsx`):** Left column displays `FeatureSlideshow`; right column displays the authentication card (stacks cleanly on mobile/small screens).
* **Branding:** Working title **Meridian LMS** — *AI-Powered Multi-Country Learning*.
* **Dark Mode Toggle (`components/common/ThemeToggle.jsx`):**
  * Enable class-based dark mode in `src/index.css` using:
    ```css
    @import "tailwindcss";
    @custom-variant dark (&:where(.dark, .dark *));
    ```
  * Floating top-right toggle button using `Sun` and `Moon` icons from `lucide-react`.
  * Persist preference in `localStorage` (defaulting to system preference on first visit) and toggle the `dark` class on `document.documentElement`.
  * Sync the `<GoogleLogin />` button `theme` prop (`"filled_black"` in dark mode, `"outline"` in light mode).

### 2. Auto-Advancing Feature Slideshow (`components/auth/FeatureSlideshow.jsx`)

* Automatically advances to the next card every **5 seconds** (`setInterval` inside `useEffect`).
* Pauses auto-advance on mouse hover and resumes on mouse leave.
* Includes clickable progress indicators at the bottom for manual card switching.
* **3 Feature Cards:**
  1. **Flow A (Trainer → Trainee):** Trainer evaluations paired with `pgvector` learning profiles generate personalized 3-step AI action plans.
  2. **Flow B (Trainee → Trainer):** Strictly anonymous weekly surveys (pacing, clarity, difficulty) power trainer trend analytics.
  3. **5-Country Scale:** Unified workspace connecting Trainees, Trainers, and regional Admins across all 5 regions.

### 3. Auth Card Flows

* **Segmented Tabs (`pages/LoginPage.jsx`):** `Sign In` | `Create Account` (hidden while inside Forgot Password flow).
* **Sign In Tab (`components/auth/LoginForm.jsx`):**
  * Email input, Password input with show/hide eye toggle, `Forgot password?` link, primary Submit button with loading spinner, and `or continue with` divider + Google Sign-In button.
  * Handle missing `VITE_GOOGLE_CLIENT_ID` gracefully with a subtle setup notice instead of crashing.
* **Create Account Tab (`components/auth/RegisterForm.jsx`):**
  * Full Name, Email, Password (min 8 chars, show/hide toggle), Confirm Password (validate match before submitting).
  * If `/auth/register` returns an `access_token`, log the user in immediately; otherwise switch to the `Sign In` tab with a green success banner.
* **Forgot Password Flow (`components/auth/ForgotPasswordFlow.jsx`):**
  * Replaces the login form in-place with a **Back to Sign In** button.
  * **Step 1:** Email input → calls `/auth/forgot-password` → advances to Step 2 with confirmation text.
  * **Step 2:** Numeric 6-digit OTP input + New Password input (min 8 chars) → calls `/auth/reset-password` → returns to `Sign In` with a success banner.
* **Auth State & Session Verification (`context/AuthContext.jsx`):**
  * Persist `access_token` in `localStorage` via `AuthContext`.
  * When authenticated, display a compact signed-in status panel inside the auth card on `LoginPage.jsx` showing the active session, the fetched user profile from `GET /auth/me` (if available), and a **Sign Out** button so all auth flows can be tested end-to-end.

## Backend API Contract (Strict)

All requests go through `src/api/client.js`, sending and expecting `application/json` (do **not** use `application/x-www-form-urlencoded`):

| Endpoint | Method | JSON Payload | Notes |
| :--- | :--- | :--- | :--- |
| `/auth/register` | `POST` | `{ "full_name", "email", "password" }` | Creates user with Argon2 hash |
| `/auth/login` | `POST` | `{ "email", "password" }` | Returns `{ "access_token", ... }` |
| `/auth/google` | `POST` | `{ "id_token" }` | Pass `credentialResponse.credential` |
| `/auth/forgot-password` | `POST` | `{ "email" }` | Triggers 6-digit OTP (console/email) |
| `/auth/reset-password` | `POST` | `{ "email", "otp", "new_password" }` | Validates OTP and updates password |
| `/auth/me` | `GET` | — | Send `Authorization: Bearer <token>` |

## Code Quality Rules

* Never hardcode backend URLs or OAuth Client IDs; always read from `import.meta.env`.
* Trim whitespace on email and name inputs before sending requests.
* Parse both FastAPI string errors (`{ "detail": "..." }`) and Pydantic validation arrays (`{ "detail": [{ "loc": [...], "msg": "..." }] }`) inside `src/api/client.js` into readable inline error banners.
* Disable submit buttons and show a spinner during in-flight requests to prevent duplicate submissions.