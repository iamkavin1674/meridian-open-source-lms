import { Menu, Sparkles } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import ThemeToggle from "../common/ThemeToggle.jsx";
import Sidebar from "./Sidebar.jsx";

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

const PAGE_TITLES = {
  courses: "My Courses",
  "action-plan": "Action Plan",
  survey: "Weekly Survey",
  settings: "Settings",
};

export default function DashboardLayout({
  activeNav,
  onSelectNav,
  user,
  onSignOut,
  isAiOpen,
  onToggleAi,
  drawer,
  children,
}) {
  const [isDark, setIsDark] = useState(initialDark);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
    try {
      localStorage.setItem(THEME_KEY, isDark ? "dark" : "light");
    } catch {
      // storage unavailable; theme still applies for this session
    }
  }, [isDark]);

  const toggleTheme = useCallback(() => setIsDark((v) => !v), []);

  const firstName = user?.full_name?.trim()?.split(/\s+/)[0] || "Learner";
  const headerTitle =
    activeNav === "dashboard"
      ? `Welcome back, ${firstName}`
      : PAGE_TITLES[activeNav] || "Dashboard";

  return (
    <div className="flex min-h-screen bg-paper font-sans text-ink transition-colors dark:bg-ink-deep dark:text-white">
      <Sidebar
        activeNav={activeNav}
        onSelectNav={onSelectNav}
        isOpenMobile={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
        isAiOpen={isAiOpen}
        onToggleAi={onToggleAi}
        user={user}
        onSignOut={onSignOut}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between gap-4 border-b border-ink/10 bg-white/90 px-4 backdrop-blur dark:border-white/10 dark:bg-ink/90 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation menu"
              className="rounded-lg border border-ink/15 p-2 text-ink hover:bg-ink/5 dark:border-white/15 dark:text-white dark:hover:bg-white/10 lg:hidden"
            >
              <Menu size={18} aria-hidden />
            </button>

            <div className="min-w-0">
              <h1 className="truncate font-display text-xl font-semibold tracking-tight sm:text-2xl">
                {headerTitle}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onToggleAi}
              aria-expanded={isAiOpen}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                isAiOpen
                  ? "border-lagoon bg-lagoon text-white dark:border-emerald-400 dark:bg-emerald-500 dark:text-ink-deep"
                  : "border-ink/15 bg-white text-ink hover:border-lagoon/50 hover:text-lagoon dark:border-white/15 dark:bg-ink-deep dark:text-slate-200 dark:hover:border-emerald-400/50 dark:hover:text-emerald-300"
              }`}
            >
              <Sparkles size={14} aria-hidden />
              <span>AI Coach</span>
            </button>

            <ThemeToggle isDark={isDark} onToggle={toggleTheme} inline />
          </div>
        </header>

        {/* Main Workspace + Right AI Coach Drawer */}
        <div className="relative flex min-w-0 flex-1">
          <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
          {drawer}
        </div>
      </div>
    </div>
  );
}
