import { MessageSquareQuote, Sparkles } from "lucide-react";

export default function TrainerFeedbackCard({ feedbackList, onAskAi }) {
  return (
    <section
      aria-labelledby="trainer-feedback-heading"
      className="flex flex-col rounded-xl border border-ink/10 bg-white p-5 shadow-xs dark:border-white/10 dark:bg-ink sm:p-6"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <span className="rounded-full bg-brass/15 px-2.5 py-0.5 text-[11px] font-semibold text-brass dark:bg-amber-400/15 dark:text-amber-300">
            Evaluator Notes
          </span>
          <h2
            id="trainer-feedback-heading"
            className="mt-2 font-display text-xl font-semibold text-ink dark:text-white"
          >
            Recent Trainer Feedback
          </h2>
        </div>

        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink/5 text-slate-600 dark:bg-white/10 dark:text-slate-300">
          <MessageSquareQuote size={16} aria-hidden />
        </span>
      </div>

      <div className="mt-4 space-y-3">
        {feedbackList.map((item) => (
          <article
            key={item.id}
            className="rounded-xl border border-ink/10 bg-paper/45 p-4 dark:border-white/10 dark:bg-white/[0.03]"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="font-semibold text-ink dark:text-white">{item.module}</span>
                <span className="text-slate-400 dark:text-slate-500">•</span>
                <span className="text-slate-500 dark:text-slate-400">
                  {item.date} · {item.trainer}
                </span>
              </div>

              <span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-semibold text-lagoon shadow-2xs dark:bg-ink dark:text-emerald-300">
                {item.score}
              </span>
            </div>

            <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
              “{item.note}”
            </p>

            <div className="mt-3 flex justify-end">
              <button
                type="button"
                onClick={() =>
                  onAskAi(
                    `Explain my trainer feedback from ${item.date} on ${item.module}: "${item.note}"`,
                    item
                  )
                }
                className="inline-flex items-center gap-1 rounded-full border border-lagoon/25 bg-white px-2.5 py-1 text-xs font-medium text-lagoon transition-colors hover:border-lagoon hover:bg-lagoon/10 dark:border-emerald-400/25 dark:bg-ink-deep dark:text-emerald-300 dark:hover:border-emerald-400/60 dark:hover:bg-emerald-500/15"
              >
                <Sparkles size={12} aria-hidden />
                <span>Ask AI</span>
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
