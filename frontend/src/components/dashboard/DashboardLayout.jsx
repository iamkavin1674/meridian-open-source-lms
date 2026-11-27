import { Flame, Menu, Sparkles } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { LEARNING_STREAK } from "../../data/mockStudentDashboard.js";
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

function getInitials(fullName, email) {
  const source = (fullName || email || "M").trim();
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
}

const PAGE_TITLES = {
  courses: "My Courses",
  "action-plan": "Action Plan",
  survey: "Weekly Survey",
  settings: "Settings",
  profile: "My Profile",
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
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    function handleScroll() {
      const currentScrollY = window.scrollY;
      if (currentScrollY < 10) {
        setIsHeaderVisible(true);
      } else if (currentScrollY > lastScrollY.current && currentScrollY > 60) {
        // Scrolling down
        setIsHeaderVisible(false);
      } else if (currentScrollY < lastScrollY.current) {
        // Scrolling up
        setIsHeaderVisible(true);
      }
      lastScrollY.current = currentScrollY;
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
    try {
      localStorage.setItem(THEME_KEY, isDark ? "dark" : "light");
    } catch {
      // storage unavailable; theme still applies for this session
    }
  }, [isDark]);

  const toggleTheme = useCallback(() => setIsDark((v) => !v), []);

  const displayName = user?.full_name || "Meridian Student";
  const avatarUrl = user?.avatar_url || user?.picture || "";
  const initials = getInitials(user?.full_name, user?.email);
  const firstName = displayName.trim().split(/\s+/)[0] || "Learner";
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
        onSignOut={onSignOut}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top Bar */}
        <header
          className={`sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between gap-3 border-b border-ink/10 bg-white/90 px-4 backdrop-blur transition-transform duration-300 ease-in-out dark:border-white/10 dark:bg-ink/90 sm:px-6 lg:px-8 ${
            isHeaderVisible ? "translate-y-0" : "-translate-y-full"
          }`}
        >
          {/* Top-left: Mobile menu + Learning Streak + Greeting / Page Title */}
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation menu"
              className="rounded-lg border border-ink/15 p-2 text-ink hover:bg-ink/5 dark:border-white/15 dark:text-white dark:hover:bg-white/10 lg:hidden"
            >
              <Menu size={18} aria-hidden />
            </button>

            <div
              title={LEARNING_STREAK.label}
              aria-label={LEARNING_STREAK.label}
              className="inline-flex shrink-0 items-center gap-1 rounded-full border border-brass/25 bg-brass/10 px-2.5 py-1 text-xs font-semibold text-brass dark:border-amber-400/30 dark:bg-amber-400/15 dark:text-amber-300"
            >
              <Flame size={14} aria-hidden />
              <span>{LEARNING_STREAK.days}d</span>
              <span className="hidden md:inline">streak</span>
            </div>

            <h1 className="truncate font-display text-lg font-semibold tracking-tight sm:text-xl">
              {headerTitle}
            </h1>
          </div>

          {/* Top-right: AI Coach + ThemeToggle + Clickable Profile Avatar & Username */}
          <div className="flex shrink-0 items-center gap-2.5">
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
              <span className="hidden sm:inline">AI Coach</span>
            </button>

            <ThemeToggle isDark={isDark} onToggle={toggleTheme} inline />

            <button
              type="button"
              onClick={() => onSelectNav("profile")}
              aria-label="Open my profile"
              title="Open my profile"
              className={`flex items-center gap-2 rounded-full border py-1 pl-1 pr-3 text-left transition-colors ${
                activeNav === "profile"
                  ? "border-lagoon bg-lagoon/10 dark:border-emerald-400/60 dark:bg-emerald-500/15"
                  : "border-ink/15 bg-paper/50 hover:border-lagoon/50 dark:border-white/15 dark:bg-white/5 dark:hover:border-emerald-400/50"
              }`}
            >
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={displayName}
                  className="h-7 w-7 shrink-0 rounded-full object-cover"
                />
              ) : (
                <span
                  aria-hidden="true"
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ink text-[11px] font-semibold text-white dark:bg-emerald-400 dark:text-ink-deep"
                >
                  {initials}
                </span>
              )}
              <span className="hidden max-w-[140px] truncate text-xs font-semibold text-ink dark:text-white sm:inline">
                {displayName}
              </span>
            </button>
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
