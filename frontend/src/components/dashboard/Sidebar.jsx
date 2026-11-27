import {
  BookOpen,
  ClipboardCheck,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Settings,
  Sparkles,
  X,
} from "lucide-react";

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "courses", label: "My Courses", icon: BookOpen },
  { id: "action-plan", label: "Action Plan", icon: ListChecks },
  { id: "survey", label: "Weekly Survey", icon: ClipboardCheck },
];

export default function Sidebar({
  activeNav,
  onSelectNav,
  isOpenMobile,
  onCloseMobile,
  isAiOpen,
  onToggleAi,
  onSignOut,
}) {

  function handleNavClick(id) {
    onSelectNav(id);
    onCloseMobile?.();
  }

  return (
    <>
      {/* Mobile backdrop */}
      {isOpenMobile && (
        <div
          aria-hidden="true"
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-ink-deep/60 backdrop-blur-xs lg:hidden"
        />
      )}

      <aside
        aria-label="Primary navigation"
        className={`fixed inset-y-0 left-0 z-50 flex w-68 shrink-0 flex-col border-r border-ink/10 bg-white transition-transform duration-200 dark:border-white/10 dark:bg-ink lg:static lg:z-auto lg:w-64 lg:translate-x-0 ${
          isOpenMobile ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between border-b border-ink/10 px-5 dark:border-white/10">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-lagoon text-sm font-bold text-white dark:bg-emerald-500 dark:text-ink-deep">
              M
            </span>
            <div>
              <p className="font-display text-lg font-semibold leading-none tracking-tight">
                Meridian LMS
              </p>
              <p className="mt-0.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                Student Workspace
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onCloseMobile}
            aria-label="Close navigation menu"
            className="rounded-lg p-1.5 text-slate-500 hover:bg-ink/5 hover:text-ink dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white lg:hidden"
          >
            <X size={18} aria-hidden />
          </button>
        </div>

        {/* Navigation + AI Coach Trigger */}
        <div className="flex-1 overflow-y-auto px-3 py-5">
          <nav className="space-y-1">
            {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
              const active = activeNav === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => handleNavClick(id)}
                  aria-current={active ? "page" : undefined}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                    active
                      ? "bg-lagoon/10 text-lagoon dark:bg-emerald-500/15 dark:text-emerald-300"
                      : "text-slate-700 hover:bg-ink/5 hover:text-ink dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-white"
                  }`}
                >
                  <Icon size={18} aria-hidden />
                  <span>{label}</span>
                </button>
              );
            })}
          </nav>

          <div className="mt-6 border-t border-ink/10 pt-5 dark:border-white/10">
            <button
              type="button"
              onClick={() => {
                onToggleAi();
                onCloseMobile?.();
              }}
              aria-expanded={isAiOpen}
              className={`flex w-full items-center justify-between rounded-xl border px-3.5 py-3 text-left text-sm font-semibold transition-all ${
                isAiOpen
                  ? "border-lagoon bg-lagoon text-white shadow-sm dark:border-emerald-400 dark:bg-emerald-500 dark:text-ink-deep"
                  : "border-lagoon/30 bg-lagoon/8 text-lagoon hover:border-lagoon/60 hover:bg-lagoon/15 dark:border-emerald-400/30 dark:bg-emerald-500/10 dark:text-emerald-300 dark:hover:bg-emerald-500/20"
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Sparkles size={17} aria-hidden />
                <span>AI Coach</span>
              </span>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                  isAiOpen
                    ? "bg-white/20 text-white dark:bg-ink-deep/15 dark:text-ink-deep"
                    : "bg-lagoon/15 text-lagoon dark:bg-emerald-400/20 dark:text-emerald-200"
                }`}
              >
                {isAiOpen ? "Open" : "Ask"}
              </span>
            </button>
          </div>
        </div>

        {/* Bottom Pinned Settings & Sign Out */}
        <div className="mt-auto border-t border-ink/10 p-3 dark:border-white/10">
          <div className="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={() => handleNavClick("settings")}
              className={`flex items-center justify-center gap-1.5 rounded-lg border px-2.5 py-2 text-xs font-medium transition-colors ${
                activeNav === "settings"
                  ? "border-lagoon bg-lagoon/10 text-lagoon dark:border-emerald-400/40 dark:bg-emerald-500/15 dark:text-emerald-300"
                  : "border-ink/10 text-slate-700 hover:bg-ink/5 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/5"
              }`}
            >
              <Settings size={14} aria-hidden />
              <span>Settings</span>
            </button>

            <button
              type="button"
              onClick={onSignOut}
              className="flex items-center justify-center gap-1.5 rounded-lg border border-ink/10 px-2.5 py-2 text-xs font-medium text-slate-700 transition-colors hover:border-red-300 hover:bg-red-50 hover:text-red-700 dark:border-white/10 dark:text-slate-300 dark:hover:border-red-900/60 dark:hover:bg-red-950/40 dark:hover:text-red-300"
            >
              <LogOut size={14} aria-hidden />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
