import {
  BookOpen,
  ClipboardCheck,
  LayoutDashboard,
  ListChecks,
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
        className={`fixed inset-y-0 left-0 z-50 flex w-68 shrink-0 flex-col border-r border-ink/10 bg-white transition-transform duration-200 dark:border-white/10 dark:bg-ink lg:static lg:z-auto lg:w-64 lg:translate-x-0 ${isOpenMobile ? "translate-x-0" : "-translate-x-full"
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

        {/* Navigation */}
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
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors ${active
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
        </div>
      </aside>
    </>
  );
}
