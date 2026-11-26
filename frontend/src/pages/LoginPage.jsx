import { CheckCircle2, LogOut } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import ForgotPasswordFlow from "../components/auth/ForgotPasswordFlow.jsx";
import LoginForm from "../components/auth/LoginForm.jsx";
import RegisterForm from "../components/auth/RegisterForm.jsx";
import FeatureSlideshow from "../components/auth/FeatureSlideshow.jsx";
import ThemeToggle from "../components/common/ThemeToggle.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const THEME_KEY = "meridian_theme";

function initialDark() {
  try {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored) return stored === "dark";
  } catch {
    // fall through to system preference
  }
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
}

export default function LoginPage() {
  const { isAuthenticated, user, initializing, logout } = useAuth();
  const [isDark, setIsDark] = useState(initialDark);
  const [tab, setTab] = useState("signin");
  const [inForgotFlow, setInForgotFlow] = useState(false);
  const [banner, setBanner] = useState("");

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
    try {
      localStorage.setItem(THEME_KEY, isDark ? "dark" : "light");
    } catch {
      // storage unavailable; theme still applies for this session
    }
  }, [isDark]);

  const toggleTheme = useCallback(() => setIsDark((v) => !v), []);

  function showSignInWithBanner(message) {
    setInForgotFlow(false);
    setTab("signin");
    setBanner(message);
  }

  return (
    <div className="min-h-screen bg-paper font-sans text-ink transition-colors dark:bg-ink-deep dark:text-white">
      <ThemeToggle isDark={isDark} onToggle={toggleTheme} />

      <div className="flex min-h-screen flex-col lg:flex-row">
        <div className="lg:w-[54%]">
          <FeatureSlideshow />
        </div>

        <main className="flex flex-1 items-center justify-center px-5 py-12 sm:px-10">
          <div className="w-full max-w-md border border-ink/10 bg-white p-7 shadow-[0_18px_50px_rgba(11,36,40,0.10)] dark:border-white/10 dark:bg-ink sm:p-9">
            <header className="mb-7 lg:hidden">
              <p className="font-display text-xl font-semibold">Meridian LMS</p>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                AI-Powered Multi-Country Learning
              </p>
            </header>

            {initializing ? (
              <p className="py-10 text-center text-sm text-slate-600 dark:text-slate-300">
                Checking your session…
              </p>
            ) : isAuthenticated ? (
              <section aria-label="Signed in session">
                <p className="text-sm font-semibold text-lagoon dark:text-emerald-300">
                  Session active
                </p>
                <h2 className="mt-2 font-display text-3xl font-semibold">
                  You are signed in
                </h2>
                {user ? (
                  <dl className="mt-6 space-y-3 border-t border-ink/10 pt-5 text-sm dark:border-white/10">
                    <div className="flex justify-between gap-4">
                      <dt className="text-slate-500 dark:text-slate-400">Name</dt>
                      <dd className="font-medium">{user.full_name}</dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-slate-500 dark:text-slate-400">Email</dt>
                      <dd className="break-all font-medium">{user.email}</dd>
                    </div>
                    <div className="flex justify-between gap-4">
                      <dt className="text-slate-500 dark:text-slate-400">Role</dt>
                      <dd className="font-medium capitalize">{user.role}</dd>
                    </div>
                  </dl>
                ) : (
                  <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">
                    Your token is stored, but the profile could not be loaded. Sign out and
                    sign in again to refresh it.
                  </p>
                )}
                <button
                  type="button"
                  onClick={logout}
                  className="mt-7 flex w-full items-center justify-center gap-2 border border-ink/20 px-4 py-3 text-sm font-semibold transition-colors hover:bg-ink hover:text-white dark:border-white/25 dark:hover:bg-white dark:hover:text-ink"
                >
                  <LogOut size={16} aria-hidden /> Sign out
                </button>
              </section>
            ) : inForgotFlow ? (
              <ForgotPasswordFlow
                onBack={() => setInForgotFlow(false)}
                onResetSuccess={() =>
                  showSignInWithBanner("Password reset complete. Sign in with your new password.")
                }
              />
            ) : (
              <>
                <h2 className="font-display text-3xl font-semibold">
                  {tab === "signin" ? "Welcome back" : "Create your account"}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                  {tab === "signin"
                    ? "Sign in to continue learning across all five Meridian regions."
                    : "Join Meridian as a trainee, trainer, or regional learner."}
                </p>

                <div
                  role="tablist"
                  aria-label="Authentication options"
                  className="mt-6 grid grid-cols-2 border border-ink/15 dark:border-white/15"
                >
                  {[
                    ["signin", "Sign In"],
                    ["register", "Create Account"],
                  ].map(([value, label]) => (
                    <button
                      key={value}
                      role="tab"
                      aria-selected={tab === value}
                      onClick={() => {
                        setTab(value);
                        setBanner("");
                      }}
                      className={`px-4 py-2.5 text-sm font-semibold transition-colors ${
                        tab === value
                          ? "bg-ink text-white dark:bg-white dark:text-ink"
                          : "text-slate-600 hover:bg-ink/5 dark:text-slate-300 dark:hover:bg-white/5"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {banner && (
                  <p
                    role="status"
                    className="mt-5 flex items-start gap-2 border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-200"
                  >
                    <CheckCircle2 size={16} className="mt-0.5 shrink-0" aria-hidden />
                    {banner}
                  </p>
                )}

                <div className="mt-6">
                  {tab === "signin" ? (
                    <LoginForm
                      isDark={isDark}
                      onForgotPassword={() => {
                        setBanner("");
                        setInForgotFlow(true);
                      }}
                    />
                  ) : (
                    <RegisterForm
                      onRegistered={() =>
                        showSignInWithBanner(
                          "Account created. Sign in with your new credentials."
                        )
                      }
                    />
                  )}
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
