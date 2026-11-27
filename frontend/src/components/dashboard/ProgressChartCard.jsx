import { Megaphone } from "lucide-react";
import { useState } from "react";

import { MOCK_ANNOUNCEMENTS } from "../../data/mockStudentDashboard.js";

const CHART_WIDTH = 520;
const CHART_HEIGHT = 210;
const PAD_LEFT = 36;
const PAD_RIGHT = 20;
const PAD_TOP = 24;
const PAD_BOTTOM = 32;
const MIN_SCORE = 5;
const MAX_SCORE = 10;

export default function ProgressChartCard({ weeklyScores }) {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  const plotWidth = CHART_WIDTH - PAD_LEFT - PAD_RIGHT;
  const plotHeight = CHART_HEIGHT - PAD_TOP - PAD_BOTTOM;

  const points = weeklyScores.map((item, idx) => {
    const x =
      weeklyScores.length > 1
        ? PAD_LEFT + (idx / (weeklyScores.length - 1)) * plotWidth
        : PAD_LEFT + plotWidth / 2;
    const clamped = Math.max(MIN_SCORE, Math.min(MAX_SCORE, item.score));
    const y =
      PAD_TOP + ((MAX_SCORE - clamped) / (MAX_SCORE - MIN_SCORE)) * plotHeight;
    return { ...item, x, y, index: idx };
  });

  const linePath = points
    .map((p, idx) => `${idx === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(" ");

  const areaPath =
    points.length > 0
      ? `${linePath} L ${points[points.length - 1].x.toFixed(1)} ${(
          PAD_TOP + plotHeight
        ).toFixed(1)} L ${points[0].x.toFixed(1)} ${(PAD_TOP + plotHeight).toFixed(1)} Z`
      : "";

  const activePoint = hoveredIndex !== null ? points[hoveredIndex] : points[points.length - 1];
  const gridTicks = [5, 7.5, 10];

  return (
    <section
      aria-labelledby="progress-chart-heading"
      className="flex flex-col rounded-xl border border-ink/10 bg-white p-5 shadow-xs dark:border-white/10 dark:bg-ink sm:p-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <span className="rounded-full bg-ink/8 px-2.5 py-0.5 text-[11px] font-semibold text-ink dark:bg-white/10 dark:text-slate-200">
            Weeks 1–{weeklyScores.length} Trajectory
          </span>
          <h2
            id="progress-chart-heading"
            className="mt-2 font-display text-xl font-semibold text-ink dark:text-white"
          >
            Weekly Evaluation Scores
          </h2>
        </div>

        {/* Active / hovered summary readout */}
        {activePoint && (
          <div className="rounded-lg border border-ink/10 bg-paper/60 px-3 py-1.5 text-right dark:border-white/10 dark:bg-white/5">
            <p className="text-xs font-semibold text-ink dark:text-white">
              {activePoint.week}: {activePoint.score.toFixed(1)} / 10
            </p>
            <p className="max-w-[180px] truncate text-[11px] text-slate-500 dark:text-slate-400">
              {activePoint.topic}
            </p>
          </div>
        )}
      </div>

      {/* Pure SVG + Tailwind Area/Line Chart */}
      <div className="relative mt-4">
        <svg
          viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
          role="img"
          aria-label="Weekly evaluation scores from Week 1 to Week 6"
          className="h-56 w-full overflow-visible"
          onMouseLeave={() => setHoveredIndex(null)}
        >
          <defs>
            <linearGradient id="meridianScoreFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0e6b5c" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#0e6b5c" stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {/* Horizontal reference grid lines */}
          {gridTicks.map((tick) => {
            const y =
              PAD_TOP + ((MAX_SCORE - tick) / (MAX_SCORE - MIN_SCORE)) * plotHeight;
            return (
              <g key={tick}>
                <line
                  x1={PAD_LEFT}
                  y1={y}
                  x2={CHART_WIDTH - PAD_RIGHT}
                  y2={y}
                  className="stroke-ink/10 dark:stroke-white/10"
                  strokeDasharray="4 4"
                />
                <text
                  x={PAD_LEFT - 8}
                  y={y + 4}
                  textAnchor="end"
                  className="fill-slate-400 text-[11px] dark:fill-slate-500"
                >
                  {tick}
                </text>
              </g>
            );
          })}

          {/* Area fill & trend line */}
          {areaPath && <path d={areaPath} fill="url(#meridianScoreFill)" />}
          {linePath && (
            <path
              d={linePath}
              fill="none"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="stroke-lagoon dark:stroke-emerald-400"
            />
          )}

          {/* Interactive points & hover columns */}
          {points.map((point) => {
            const isHovered = hoveredIndex === point.index;
            const colWidth = plotWidth / Math.max(points.length, 1);

            return (
              <g
                key={point.week}
                tabIndex={0}
                role="button"
                aria-label={`${point.week}: ${point.score} out of 10, ${point.topic}`}
                onMouseEnter={() => setHoveredIndex(point.index)}
                onFocus={() => setHoveredIndex(point.index)}
                onBlur={() => setHoveredIndex(null)}
                className="cursor-pointer outline-none"
              >
                {/* Invisible wider hit target for smooth hover */}
                <rect
                  x={point.x - colWidth / 2}
                  y={PAD_TOP}
                  width={colWidth}
                  height={plotHeight + PAD_BOTTOM}
                  fill="transparent"
                />

                {isHovered && (
                  <line
                    x1={point.x}
                    y1={PAD_TOP}
                    x2={point.x}
                    y2={PAD_TOP + plotHeight}
                    className="stroke-lagoon/35 dark:stroke-emerald-400/35"
                    strokeWidth="1.5"
                    strokeDasharray="3 3"
                  />
                )}

                <circle
                  cx={point.x}
                  cy={point.y}
                  r={isHovered ? 6 : 4.5}
                  className={`transition-all ${
                    isHovered
                      ? "fill-brass stroke-white dark:fill-amber-300 dark:stroke-ink"
                      : "fill-lagoon stroke-white dark:fill-emerald-400 dark:stroke-ink"
                  }`}
                  strokeWidth="2"
                />

                {/* Hover tooltip inside SVG */}
                {isHovered && (
                  <g transform={`translate(${Math.min(Math.max(point.x, 75), CHART_WIDTH - 75)}, ${Math.max(point.y - 16, 18)})`}>
                    <rect
                      x="-58"
                      y="-24"
                      width="116"
                      height="24"
                      rx="6"
                      className="fill-ink dark:fill-white"
                    />
                    <text
                      x="0"
                      y="-8"
                      textAnchor="middle"
                      className="fill-white text-[11px] font-semibold dark:fill-ink"
                    >
                      {point.week} · {point.score.toFixed(1)} / 10
                    </text>
                  </g>
                )}

                {/* X-axis week label */}
                <text
                  x={point.x}
                  y={CHART_HEIGHT - 8}
                  textAnchor="middle"
                  className={`text-[11px] font-medium ${
                    isHovered
                      ? "fill-ink font-semibold dark:fill-white"
                      : "fill-slate-500 dark:fill-slate-400"
                  }`}
                >
                  {point.shortLabel}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Cohort Announcements */}
      <div className="mt-5 border-t border-ink/10 pt-4 dark:border-white/10">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-brass/15 text-brass dark:bg-amber-400/15 dark:text-amber-300">
              <Megaphone size={13} aria-hidden />
            </span>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
              Announcements
            </h3>
          </div>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            {MOCK_ANNOUNCEMENTS.length} updates
          </span>
        </div>

        <div className="mt-3 space-y-2.5">
          {MOCK_ANNOUNCEMENTS.map((item) => (
            <div
              key={item.id}
              className="rounded-lg border border-ink/10 bg-paper/45 px-3.5 py-2.5 dark:border-white/10 dark:bg-white/[0.03]"
            >
              <div className="flex items-center justify-between gap-2 text-[11px]">
                <span className="font-semibold text-lagoon dark:text-emerald-300">
                  {item.tag}
                </span>
                <span className="text-slate-500 dark:text-slate-400">{item.date}</span>
              </div>
              <p className="mt-1 text-xs font-semibold text-ink dark:text-white">
                {item.title}
              </p>
              <p className="mt-0.5 text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
                {item.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
