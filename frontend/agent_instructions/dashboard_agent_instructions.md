# Student Dashboard Rules (`frontend/agent_instructions/dashboard.md`)

These instructions govern the **Meridian LMS Student Dashboard (v1)** and post-login routing. They assume the authentication layer (`LoginPage.jsx`, `AuthContext.jsx`, `api/client.js`, `api/auth.js`, and `ThemeToggle.jsx`) is already implemented and working—**do not alter existing `/auth/*` API contracts or rewrite the login UI.**

## Tech Stack & Constraints
- **Framework:** React (JavaScript — `.jsx` and `.js` files only; **no TypeScript**)
- **Bundler:** Vite (`http://localhost:3000`)
- **Routing:** `react-router-dom` (v6+)
- **Styling:** Tailwind CSS v4 with class-based dark mode (`@custom-variant dark (&:where(.dark, .dark *));`)
- **Icons:** `lucide-react`
- **Charts:** Lightweight pure Tailwind/SVG (do **not** install heavy charting libraries unless explicitly requested)

## Dashboard File Structure

### Files to Update (Routing Integration Only)
- `src/main.jsx` — Wrap `<App />` with `<BrowserRouter>` alongside `<GoogleOAuthProvider>` and `<AuthProvider>`.
- `src/App.jsx` — Define routes for `/login`, `/dashboard` (guarded by `ProtectedRoute`), and a `*` fallback redirect.
- `src/pages/LoginPage.jsx` — Redirect to `/dashboard` immediately when a user is already authenticated or upon successful login/registration.

### New Files to Create
```text
frontend/src/
├── api/
│   └── aiChat.js                      # Frontend-only mock AI chat helper (isolated for easy backend swap)
├── data/
│   └── mockStudentDashboard.js        # Realistic sample data for Action Plan, scores, and trainer feedback
├── pages/
│   └── StudentDashboardPage.jsx       # Main Student Bento Grid dashboard view
└── components/
    ├── common/
    │   └── ProtectedRoute.jsx         # Redirects unauthenticated users to /login
    └── dashboard/
        ├── DashboardLayout.jsx        # Persistent left sidebar + top bar + main workspace + AI drawer slot
        ├── Sidebar.jsx                # Nav links, AI Coach trigger, and bottom-pinned Profile & Settings
        ├── KpiCards.jsx               # Top row of 3 dynamic summary cards
        ├── ActionPlanCard.jsx         # Interactive 3-step AI Action Plan (Flow A) with clickable status pills
        ├── ProgressChartCard.jsx      # Weekly evaluation score chart (Weeks 1–6)
        ├── WeeklyPulseCard.jsx        # Anonymous weekly survey (Flow B: pacing, clarity, difficulty)
        ├── TrainerFeedbackCard.jsx    # Recent trainer notes with contextual "Ask AI" triggers
        └── AICoachDrawer.jsx          # Collapsible right-side AI chat panel
```

## Routing & Auth Integration
- **`/dashboard` (`StudentDashboardPage.jsx`):** Wrapped in `ProtectedRoute` and `DashboardLayout`. Unauthenticated users are redirected to `/login`.
- **`/login` (`LoginPage.jsx`):** If `AuthContext` already holds a valid session, redirect immediately to `/dashboard`.
- **Post-Login Navigation:** After successful login, Google Sign-In, or token-returning registration, load the user profile via `GET /auth/me` and `navigate("/dashboard", { replace: true })`.
- **Live User Data:** Populate the greeting, sidebar profile name/email, and initials/avatar directly from `AuthContext` (`GET /auth/me`). Use `src/data/mockStudentDashboard.js` for LMS metrics until those backend endpoints are built.

## UI & Layout Requirements

### 1. App Shell & Left Sidebar (`DashboardLayout.jsx`, `Sidebar.jsx`)
- **Left Sidebar:**
  - **Top:** Brand header (**Meridian LMS**) and a close button on mobile viewports.
  - **Navigation Links:** `Dashboard`, `My Courses`, `Action Plan`, and `Weekly Survey`. For v1, `Dashboard` renders the full Bento Grid; clicking the other links can show clean in-page placeholder views or focus states with zero broken routes.
  - **AI Coach Trigger:** Prominent sidebar button (`AI Coach` with `Sparkles` icon) that opens/closes the right-side `AICoachDrawer`.
  - **Bottom Pinned Section:** Anchored to the bottom of the left sidebar:
    - Student profile picture (or initials avatar), full name, and email from `AuthContext`.
    - **Settings** button and **Sign Out** button (clears auth state/token and redirects to `/login`).
- **Top Bar:**
  - Mobile sidebar hamburger button, friendly greeting (*"Welcome back, [First Name]"*) or active page title.
  - Reuse the existing `components/common/ThemeToggle.jsx` (Sun/Moon dark mode switch) and an optional quick `AI Coach` toggle.

### 2. Bento Grid Main Workspace (`StudentDashboardPage.jsx`)
Arrange the dashboard into a clean, responsive 2-column Bento Grid (stacking to 1 column on mobile) with consistent card borders, padding, and full light/dark mode contrast:

- **Top Row — 3 KPI Summary Cards (`KpiCards.jsx`):**
  1. **Action Plan Progress:** Dynamically reflects completed steps from `ActionPlanCard` (e.g., `2 / 3 Steps Done` with a mini progress bar).
  2. **Latest Evaluation Score:** e.g., `8.5 / 10` with a subtle trend indicator (`+0.6 vs last week`).
  3. **Weekly Survey Status:** Dynamically flips from `Pending` to `Completed` once `WeeklyPulseCard` is submitted.

- **Middle Left — AI 3-Step Action Plan (`ActionPlanCard.jsx` — Flow A):**
  - Displays 3 personalized action steps derived from the student's latest evaluation.
  - Each step includes a short rationale and a clickable **status pill** that cycles through `To Do` → `In Progress` → `Done`, updating both the card's progress bar and the top KPI card in real time.
  - Includes a subtle *"Ask AI"* button on each step that opens `AICoachDrawer` pre-loaded with a contextual prompt about that step.

- **Middle Right — Weekly Progress Graph (`ProgressChartCard.jsx`):**
  - Clean, lightweight bar or area chart (built with pure Tailwind/SVG) showing weekly evaluation scores over the past 5–6 weeks (e.g., Weeks 1–6) with hover tooltips displaying the exact score and week label.

- **Bottom Left — Anonymous Weekly Pulse Survey (`WeeklyPulseCard.jsx` — Flow B):**
  - Displays a reassuring **"100% Anonymous"** badge.
  - Three 1–5 rating selectors for **Pacing**, **Clarity**, and **Difficulty**, plus an optional short comment textarea and a **Submit Anonymously** button.
  - Submitting transitions the card cleanly to a confirmation state (*"Thanks for your feedback! Next survey opens Monday."*) and updates the top KPI card.

- **Bottom Right — Recent Trainer Feedback (`TrainerFeedbackCard.jsx`):**
  - Compact list of recent trainer evaluation notes (date, module/topic, short note).
  - Each note includes a small *"Ask AI"* button that opens `AICoachDrawer` with a pre-filled question referencing that specific feedback.

### 3. Collapsible Right-Side AI Coach Drawer (`AICoachDrawer.jsx` & `api/aiChat.js`)
- **Placement & Behavior:**
  - Triggered from the **AI Coach** button in the left sidebar, the top bar, or any card's *"Ask AI"* button.
  - Slides out smoothly on the **right side** (~360–400px wide on desktop, full-width overlay on mobile), keeping the Bento Grid visible alongside the chat on desktop so students can reference their metrics while chatting.
- **Drawer UI:**
  - **Header:** Title (`AI Study Coach`), close (`X`) button, and a context badge (e.g., *"Aware of: Week 4 Progress & Latest Feedback"*).
  - **Empty State:** 3–4 clickable starter prompt chips:
    - *"Explain my latest trainer feedback"*
    - *"Break down Step 2 of my Action Plan"*
    - *"Why did my score change this week?"*
    - *"Build a 30-min study plan for today"*
  - **Chat Thread:** Distinct user/AI message bubbles, auto-scroll to the latest message, animated thinking state (*"Analyzing your progress..."*), and a subtle disclaimer footer (*"AI can make mistakes—verify key targets with your trainer"*).
- **Frontend-First Mock Layer (`src/api/aiChat.js`):**
  - Export `sendChatMessage(message, studentContext)` that simulates a ~900ms thinking delay and returns contextual mock responses referencing the student's Action Plan steps, evaluation scores, and trainer feedback.
  - Isolate all mock logic inside `src/api/aiChat.js` so connecting to FastAPI (`POST /ai/chat`) later requires editing only that file.

## Design & Code Quality Rules
- Every new component must support both light and dark modes seamlessly via Tailwind `dark:` classes.
- Keep state lifting clean in `StudentDashboardPage.jsx` so status pill changes, survey submission, and *"Ask AI"* card triggers stay in sync across `KpiCards`, `ActionPlanCard`, `WeeklyPulseCard`, and `AICoachDrawer`.
- Never hardcode backend URLs; always use `src/api/client.js` and `import.meta.env`.