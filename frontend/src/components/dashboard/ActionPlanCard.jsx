import { CheckCircle2, Circle, Clock3, Sparkles } from "lucide-react";

const STATUS_META = {
  todo: {
    label: "To Do",
    nextLabel: "In Progress",
    icon: Circle,
    pillClass:
      "border-slate-300 bg-slate-100 text-slate-700 hover:bg-slate-200 dark:border-white/20 dark:bg-white/10 dark:text-slate-200 dark:hover:bg-white/15",
  },
  in_progress: {
    label: "In Progress",
    nextLabel: "Done",
    icon: Clock3,
    pillClass:
      "border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 dark:border-amber-500/40 dark:bg-amber-950/60 dark:text-amber-200 dark:hover:bg-amber-950/80",
  },
  done: {
    label: "Done",
    nextLabel: "To Do",
    icon: CheckCircle2,
    pillClass:
      "border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 dark:border-emerald-500/40 dark:bg-emerald-950/60 dark:text-emerald-200 dark:hover:bg-emerald-950/80",
  },
};

export default function ActionPlanCard({ steps, onCycleStatus, onAskAi }) {
  const doneCount = steps.filter((s) => s.status === "done").length;

  return (
    <section
      aria-labelledby="action-plan-heading"
      className="flex flex-col rounded-xl border border-ink/10 bg-white p-5 shadow-xs dark:border-white/10 dark:bg-ink sm:p-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-lagoon/10 px-2.5 py-0.5 text-[11px] font-semibold text-lagoon dark:bg-emerald-500/15 dark:text-emerald-300">
              Flow A · AI Action Plan
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {doneCount}/{steps.length} completed
            </span>
          </div>
          <h2
            id="action-plan-heading"
            className="mt-2 font-display text-xl font-semibold text-ink dark:text-white"
          >
            Your 3-Step Coaching Plan
          </h2>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400">
          Click any status pill to update progress
        </p>
      </div>

      <div className="mt-4 space-y-3">
        {steps.map((step) => {
          const meta = STATUS_META[step.status] || STATUS_META.todo;
          const StatusIcon = meta.icon;

          return (
            <article
              key={step.id}
              className="rounded-xl border border-ink/10 bg-paper/45 p-4 transition-colors dark:border-white/10 dark:bg-white/[0.03]"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex min-w-0 flex-1 items-start gap-3">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ink text-xs font-bold text-white dark:bg-white/15 dark:text-white">
                    {step.stepNumber}
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        {step.module}
                      </span>
                      <span className="text-[11px] text-slate-400 dark:text-slate-500">•</span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        ~{step.estimatedMinutes} min
                      </span>
                    </div>
                    <h3
                      className={`mt-1 text-sm font-semibold ${
                        step.status === "done"
                          ? "text-slate-500 line-through dark:text-slate-400"
                          : "text-ink dark:text-white"
                      }`}
                    >
                      {step.title}
                    </h3>
                    <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                      {step.rationale}
                    </p>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onCycleStatus(step.id)}
                    aria-label={`Step ${step.stepNumber} status: ${meta.label}. Click to change to ${meta.nextLabel}`}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${meta.pillClass}`}
                  >
                    <StatusIcon size={13} aria-hidden />
                    <span>{meta.label}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      onAskAi(
                        `Break down Step ${step.stepNumber} of my Action Plan: "${step.title}"`,
                        step
                      )
                    }
                    className="inline-flex items-center gap-1 rounded-full border border-lagoon/25 bg-white px-2.5 py-1 text-xs font-medium text-lagoon transition-colors hover:border-lagoon hover:bg-lagoon/10 dark:border-emerald-400/25 dark:bg-ink-deep dark:text-emerald-300 dark:hover:border-emerald-400/60 dark:hover:bg-emerald-500/15"
                  >
                    <Sparkles size={12} aria-hidden />
                    <span>Ask AI</span>
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
