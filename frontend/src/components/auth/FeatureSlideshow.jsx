import { useEffect, useRef, useState } from "react";

const SLIDES = [
  {
    id: "flow-a",
    label: "Flow A — Trainer to Trainee",
    title: "Coaching that turns feedback into a plan",
    body: "Trainer evaluations meet each trainee's pgvector learning profile, producing a personalised 3-step action plan instead of a paragraph that gets forgotten.",
    detail: "Trainer evaluations · Learning profiles · 3-step plans",
  },
  {
    id: "flow-b",
    label: "Flow B — Trainee to Trainer",
    title: "Honest signals, with no name attached",
    body: "Weekly surveys on pacing, clarity, and difficulty are strictly anonymous. Trainers see trends they can act on; trainees stay impossible to single out.",
    detail: "Anonymous surveys · Pacing, clarity, difficulty · Trend analytics",
  },
  {
    id: "scale",
    label: "5-Country Scale",
    title: "One workspace, five regions",
    body: "Trainees, Trainers, and regional Admins share one system across all five countries — local languages and time zones, one standard of coaching.",
    detail: "5 regions · 3 roles · Local languages & time zones",
  },
];

const COUNTRIES = ["KE", "NG", "ZA", "EG", "GH"];

export default function FeatureSlideshow() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (paused) return undefined;
    timerRef.current = setInterval(() => {
      setIndex((current) => (current + 1) % SLIDES.length);
    }, 5000);
    return () => clearInterval(timerRef.current);
  }, [paused]);

  const slide = SLIDES[index];

  return (
    <section
      aria-label="Meridian LMS features"
      className="relative flex min-h-[320px] flex-col overflow-hidden bg-ink text-white lg:min-h-screen"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Meridian arcs: quiet atlas geometry behind the copy */}
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full opacity-25"
        viewBox="0 0 600 800"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden
      >
        <g fill="none" stroke="#7fb5a8" strokeWidth="1">
          <ellipse cx="300" cy="400" rx="120" ry="390" />
          <ellipse cx="300" cy="400" rx="240" ry="390" />
          <ellipse cx="300" cy="400" rx="380" ry="390" />
          <line x1="300" y1="0" x2="300" y2="800" />
          <line x1="0" y1="200" x2="600" y2="200" />
          <line x1="0" y1="400" x2="600" y2="400" />
          <line x1="0" y1="600" x2="600" y2="600" />
        </g>
        {COUNTRIES.map((code, i) => {
          const x = 110 + i * 95;
          const y = 210 + ((i * 137) % 380);
          return (
            <g key={code}>
              <circle cx={x} cy={y} r="4" fill="#b07d2b" />
              <text x={x + 10} y={y + 4} fill="#cfe3dc" fontSize="13" fontFamily="Public Sans, sans-serif">
                {code}
              </text>
            </g>
          );
        })}
      </svg>

      <div className="relative flex flex-1 flex-col justify-between p-8 sm:p-12">
        <header>
          <p className="font-display text-2xl font-semibold tracking-tight">Meridian LMS</p>
          <p className="mt-1 text-sm text-white/70">AI-Powered Multi-Country Learning</p>
        </header>

        <div key={slide.id} className="slide-enter max-w-xl pb-10 pt-16">
          <p className="text-sm font-semibold text-amber-200">{slide.label}</p>
          <h2 className="mt-3 font-display text-4xl font-semibold leading-tight sm:text-5xl">
            {slide.title}
          </h2>
          <p className="mt-4 max-w-md text-base leading-relaxed text-white/80">{slide.body}</p>
          <p className="mt-5 border-t border-white/15 pt-4 text-sm text-white/60">{slide.detail}</p>
        </div>

        <div className="relative flex items-center gap-2" role="tablist" aria-label="Feature slides">
          {SLIDES.map((item, i) => (
            <button
              key={item.id}
              role="tab"
              aria-selected={i === index}
              aria-label={`Show slide ${i + 1}: ${item.label}`}
              onClick={() => setIndex(i)}
              className={`h-8 flex-1 border-t-2 text-left text-xs transition-colors ${
                i === index
                  ? "border-brass text-white"
                  : "border-white/25 text-white/50 hover:border-white/50 hover:text-white/80"
              }`}
            >
              <span className="mt-2 block truncate px-1">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
