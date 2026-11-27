import { CheckCircle2, ShieldCheck } from "lucide-react";
import { useState } from "react";

const METRICS = [
  { key: "pacing", label: "Pacing", low: "Too slow", high: "Too fast" },
  { key: "clarity", label: "Clarity", low: "Unclear", high: "Crystal clear" },
  { key: "difficulty", label: "Difficulty", low: "Too easy", high: "Very challenging" },
];

export default function WeeklyPulseCard({ submitted, submittedData, onSubmit }) {
  const [ratings, setRatings] = useState({ pacing: null, clarity: null, difficulty: null });
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");

  function handleRating(key, value) {
    setError("");
    setRatings((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (!ratings.pacing || !ratings.clarity || !ratings.difficulty) {
      setError("Please select a 1–5 rating for Pacing, Clarity, and Difficulty.");
      return;
    }
    onSubmit({
      ...ratings,
      comment: comment.trim(),
      submittedAt: new Date().toISOString(),
    });
  }

  return (
    <section
      aria-labelledby="weekly-pulse-heading"
      className="flex flex-col rounded-xl border border-ink/10 bg-white p-5 shadow-xs dark:border-white/10 dark:bg-ink sm:p-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <span className="rounded-full bg-ink/8 px-2.5 py-0.5 text-[11px] font-semibold text-ink dark:bg-white/10 dark:text-slate-200">
            Flow B · Weekly Survey
          </span>
          <h2
            id="weekly-pulse-heading"
            className="mt-2 font-display text-xl font-semibold text-ink dark:text-white"
          >
            Anonymous Weekly Pulse
          </h2>
        </div>

        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800 dark:border-emerald-500/40 dark:bg-emerald-950/60 dark:text-emerald-200">
          <ShieldCheck size={14} aria-hidden />
          <span>100% Anonymous</span>
        </span>
      </div>

      {submitted ? (
        <div
          role="status"
          className="mt-5 flex flex-1 flex-col items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50/70 p-6 text-center dark:border-emerald-500/30 dark:bg-emerald-950/30"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-600 text-white dark:bg-emerald-500 dark:text-ink-deep">
            <CheckCircle2 size={22} aria-hidden />
          </span>
          <h3 className="mt-3 font-display text-lg font-semibold text-ink dark:text-white">
            Thanks for your feedback!
          </h3>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Next survey opens Monday.
          </p>
          {submittedData && (
            <div className="mt-4 flex flex-wrap justify-center gap-2 text-xs font-medium text-emerald-900 dark:text-emerald-200">
              <span className="rounded-full bg-white/80 px-3 py-1 dark:bg-ink/70">
                Pacing: {submittedData.pacing}/5
              </span>
              <span className="rounded-full bg-white/80 px-3 py-1 dark:bg-ink/70">
                Clarity: {submittedData.clarity}/5
              </span>
              <span className="rounded-full bg-white/80 px-3 py-1 dark:bg-ink/70">
                Difficulty: {submittedData.difficulty}/5
              </span>
            </div>
          )}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-4 flex flex-1 flex-col justify-between space-y-4">
          <div className="space-y-4">
            {METRICS.map(({ key, label, low, high }) => (
              <div key={key}>
                <div className="mb-1.5 flex items-center justify-between text-xs">
                  <span className="font-semibold text-ink dark:text-white">{label}</span>
                  <span className="text-slate-500 dark:text-slate-400">
                    {low} (1) — {high} (5)
                  </span>
                </div>
                <div role="radiogroup" aria-label={`${label} rating`} className="grid grid-cols-5 gap-2">
                  {[1, 2, 3, 4, 5].map((value) => {
                    const selected = ratings[key] === value;
                    return (
                      <button
                        key={value}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        onClick={() => handleRating(key, value)}
                        className={`rounded-lg border py-2 text-sm font-semibold transition-colors ${
                          selected
                            ? "border-lagoon bg-lagoon text-white dark:border-emerald-400 dark:bg-emerald-500 dark:text-ink-deep"
                            : "border-ink/15 bg-paper/40 text-ink hover:border-lagoon/50 hover:bg-lagoon/5 dark:border-white/15 dark:bg-white/5 dark:text-slate-200 dark:hover:border-emerald-400/50"
                        }`}
                      >
                        {value}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            <div>
              <label
                htmlFor="weekly-pulse-comment"
                className="mb-1.5 block text-xs font-semibold text-ink dark:text-white"
              >
                Optional note{" "}
                <span className="font-normal text-slate-500 dark:text-slate-400">
                  (stripped of identity)
                </span>
              </label>
              <textarea
                id="weekly-pulse-comment"
                rows={2}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share what helped most or where this week felt rushed…"
                className="w-full resize-none rounded-lg border border-ink/15 bg-white px-3 py-2 text-sm text-ink placeholder:text-slate-400 dark:border-white/15 dark:bg-white/5 dark:text-white dark:placeholder:text-slate-500"
              />
            </div>
          </div>

          {error && (
            <p role="alert" className="text-xs font-medium text-red-700 dark:text-red-300">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="w-full rounded-lg bg-lagoon px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-lagoon-deep dark:bg-emerald-500 dark:text-ink-deep dark:hover:bg-emerald-400"
          >
            Submit Anonymously
          </button>
        </form>
      )}
    </section>
  );
}
