import { CheckCircle2, Clock, ListChecks, TrendingUp } from "lucide-react";

export default function KpiCards({ actionPlan, weeklyScores, surveySubmitted }) {
  const totalSteps = actionPlan.length;
  const doneSteps = actionPlan.filter((step) => step.status === "done").length;
  const progressPct = totalSteps > 0 ? Math.round((doneSteps / totalSteps) * 100) : 0;

  const latest = weeklyScores[weeklyScores.length - 1];
  const previous = weeklyScores[weeklyScores.length - 2];
  const delta = latest && previous ? (latest.score - previous.score).toFixed(1) : "0.0";
  const deltaPositive = Number(delta) >= 0;

  return (
    <section aria-label="Key learning metrics" className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {/* KPI 1: Action Plan Progress */}
      <div className="rounded-xl border border-ink/10 bg-white p-5 shadow-xs dark:border-white/10 dark:bg-ink">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Action Plan Progress
          </span>
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-lagoon/10 text-lagoon dark:bg-emerald-500/15 dark:text-emerald-300">
            <ListChecks size={16} aria-hidden />
          </span>
        </div>

        <div className="mt-3 flex items-baseline justify-between gap-2">
          <p className="font-display text-2xl font-semibold text-ink dark:text-white">
            {doneSteps} / {totalSteps} Steps Done
          </p>
          <span className="text-xs font-semibold text-lagoon dark:text-emerald-300">
            {progressPct}%
          </span>
        </div>

        <div
          role="progressbar"
          aria-valuenow={progressPct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Action plan completion"
          className="mt-3 h-2 w-full overflow-hidden rounded-full bg-ink/10 dark:bg-white/10"
        >
          <div
            className="h-full rounded-full bg-lagoon transition-all duration-300 dark:bg-emerald-400"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* KPI 2: Latest Evaluation Score */}
      <div className="rounded-xl border border-ink/10 bg-white p-5 shadow-xs dark:border-white/10 dark:bg-ink">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Latest Evaluation Score
          </span>
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brass/15 text-brass dark:bg-amber-400/15 dark:text-amber-300">
            <TrendingUp size={16} aria-hidden />
          </span>
        </div>

        <div className="mt-3 flex items-baseline justify-between gap-2">
          <p className="font-display text-2xl font-semibold text-ink dark:text-white">
            {latest ? `${latest.score.toFixed(1)} / 10` : "—"}
          </p>
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
              deltaPositive
                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                : "bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
            }`}
          >
            {deltaPositive ? `+${delta}` : delta} vs last week
          </span>
        </div>

        <p className="mt-2.5 truncate text-xs text-slate-500 dark:text-slate-400">
          {latest ? `${latest.week} · ${latest.topic}` : "No evaluations recorded yet"}
        </p>
      </div>

      {/* KPI 3: Weekly Survey Status */}
      <div className="rounded-xl border border-ink/10 bg-white p-5 shadow-xs dark:border-white/10 dark:bg-ink">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Weekly Survey Status
          </span>
          <span
            className={`flex h-8 w-8 items-center justify-center rounded-lg ${
              surveySubmitted
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
                : "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300"
            }`}
          >
            {surveySubmitted ? (
              <CheckCircle2 size={16} aria-hidden />
            ) : (
              <Clock size={16} aria-hidden />
            )}
          </span>
        </div>

        <div className="mt-3 flex items-center justify-between gap-2">
          <p className="font-display text-2xl font-semibold text-ink dark:text-white">
            {surveySubmitted ? "Completed" : "Pending"}
          </p>
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
              surveySubmitted
                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                : "bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300"
            }`}
          >
            {surveySubmitted ? "Flow B Recorded" : "Action Needed"}
          </span>
        </div>

        <p className="mt-2.5 text-xs text-slate-500 dark:text-slate-400">
          {surveySubmitted
            ? "Anonymous pulse submitted for this week"
            : "100% anonymous · Takes under 1 minute"}
        </p>
      </div>
    </section>
  );
}
