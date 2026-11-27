import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

function buildMonthGrid(year, month) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = Array.from({ length: firstDay }, () => null);
  for (let d = 1; d <= daysInMonth; d += 1) {
    cells.push(d);
  }
  return cells;
}

export default function CalendarKpiCard() {
  const today = new Date();
  const [viewDate, setViewDate] = useState(
    () => new Date(today.getFullYear(), today.getMonth(), 1)
  );
  const [expanded, setExpanded] = useState(false);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const monthLabel = viewDate.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
  const formattedToday = today.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const isCurrentMonth =
    year === today.getFullYear() && month === today.getMonth();
  const cells = buildMonthGrid(year, month);

  return (
    <section
      aria-label="Learning calendar"
      className="rounded-xl border border-ink/10 bg-white p-5 shadow-xs dark:border-white/10 dark:bg-ink"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Learning Calendar
          </span>
          <div className="mt-2 flex items-baseline gap-2.5">
            <p className="font-display text-2xl font-semibold text-ink dark:text-white">
              {formattedToday}
            </p>
            <span className="rounded-full bg-lagoon/10 px-2.5 py-0.5 text-xs font-semibold text-lagoon dark:bg-emerald-500/15 dark:text-emerald-300">
              Week 6
            </span>
          </div>
          <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
            Next milestone: Capstone benchmark due Fri 18:00 UTC
          </p>
        </div>

        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className="inline-flex items-center gap-2 rounded-lg border border-ink/15 bg-paper/50 px-3 py-2 text-xs font-semibold text-ink transition-colors hover:border-lagoon/50 hover:text-lagoon dark:border-white/15 dark:bg-white/5 dark:text-slate-200 dark:hover:border-emerald-400/50 dark:hover:text-emerald-300"
        >
          <CalendarIcon size={15} aria-hidden />
          <span>{expanded ? "Hide calendar" : "Open calendar"}</span>
        </button>
      </div>

      {expanded && (
        <div className="mt-4 border-t border-ink/10 pt-4 dark:border-white/10">
          <div className="flex items-center justify-between">
            <p className="font-display text-sm font-semibold text-ink dark:text-white">
              {monthLabel}
            </p>
            <div className="flex items-center gap-1">
              <button
                type="button"
                aria-label="Previous month"
                onClick={() => setViewDate(new Date(year, month - 1, 1))}
                className="rounded-md p-1 text-slate-500 hover:bg-ink/5 hover:text-ink dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white"
              >
                <ChevronLeft size={16} aria-hidden />
              </button>
              <button
                type="button"
                aria-label="Next month"
                onClick={() => setViewDate(new Date(year, month + 1, 1))}
                className="rounded-md p-1 text-slate-500 hover:bg-ink/5 hover:text-ink dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white"
              >
                <ChevronRight size={16} aria-hidden />
              </button>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-slate-400 dark:text-slate-500">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <span key={d}>{d}</span>
            ))}
          </div>

          <div className="mt-1.5 grid grid-cols-7 gap-1 text-center text-xs">
            {cells.map((day, idx) =>
              day ? (
                <span
                  key={day}
                  className={`mx-auto flex h-7 w-7 items-center justify-center rounded-full font-medium ${isCurrentMonth && day === today.getDate()
                      ? "bg-lagoon font-semibold text-white dark:bg-emerald-500 dark:text-ink-deep"
                      : "text-slate-700 dark:text-slate-300"
                    }`}
                >
                  {day}
                </span>
              ) : (
                <span key={`empty-${idx}`} />
              )
            )}
          </div>
        </div>
      )}
    </section>
  );
}
