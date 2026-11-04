"use client";

import { useState } from "react";

interface WeeklyLoginChartProps {
  data: { week: string; count: number }[];
}

const CHART_HEIGHT = 160;
const BAR_MAX_WIDTH = 24;
const BAR_GAP = 8;

function formatWeekLabel(iso: string) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function WeeklyLoginChart({ data }: WeeklyLoginChartProps) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const maxValue = Math.max(1, ...data.map((d) => d.count));
  // Round the axis ceiling up to a clean number
  const niceMax = Math.max(4, Math.ceil(maxValue / 4) * 4);
  const ticks = [0, niceMax / 2, niceMax];

  return (
    <div
      className="viz-root relative"
      style={{ ["--series-1" as string]: "#6633cc" }}
    >
      <div className="flex">
        {/* Y axis */}
        <div
          className="flex flex-col justify-between text-right pr-2 shrink-0"
          style={{ height: CHART_HEIGHT }}
        >
          {[...ticks].reverse().map((t) => (
            <span key={t} className="text-[10px] text-slate-400 tabular-nums leading-none">
              {t}
            </span>
          ))}
        </div>

        {/* Plot area */}
        <div className="flex-1 relative" style={{ height: CHART_HEIGHT }}>
          {/* Gridlines */}
          {ticks.map((t) => (
            <div
              key={t}
              className="absolute left-0 right-0 border-t border-slate-100"
              style={{ bottom: `${(t / niceMax) * 100}%` }}
            />
          ))}
          {/* Baseline */}
          <div className="absolute left-0 right-0 bottom-0 border-t border-slate-300" />

          <div
            className="absolute inset-0 flex items-end"
            style={{ gap: `${BAR_GAP}px` }}
          >
            {data.map((d, idx) => {
              const heightPct = (d.count / niceMax) * 100;
              const isHovered = hoverIdx === idx;
              return (
                <div
                  key={d.week}
                  className="flex-1 flex items-end justify-center h-full cursor-pointer"
                  style={{ maxWidth: `${BAR_MAX_WIDTH + BAR_GAP}px` }}
                  onPointerEnter={() => setHoverIdx(idx)}
                  onPointerLeave={() => setHoverIdx(null)}
                  onFocus={() => setHoverIdx(idx)}
                  onBlur={() => setHoverIdx(null)}
                  tabIndex={0}
                  role="img"
                  aria-label={`Week of ${formatWeekLabel(d.week)}: ${d.count} logins`}
                >
                  <div
                    style={{
                      width: `${BAR_MAX_WIDTH}px`,
                      height: `${Math.max(heightPct, d.count > 0 ? 2 : 0)}%`,
                      backgroundColor: "var(--series-1)",
                      opacity: isHovered ? 0.8 : 1,
                      borderRadius: "4px 4px 0 0",
                      transition: "opacity 120ms ease",
                    }}
                  />
                </div>
              );
            })}
          </div>

          {/* Tooltip */}
          {hoverIdx !== null && (
            <div
              className="absolute z-10 pointer-events-none bg-slate-900 text-white text-xs rounded-md px-2.5 py-1.5 shadow-lg -translate-x-1/2"
              style={{
                left: `${((hoverIdx + 0.5) / data.length) * 100}%`,
                bottom: `${Math.max((data[hoverIdx].count / niceMax) * 100, 4) + 8}%`,
              }}
            >
              <div className="font-semibold tabular-nums">{data[hoverIdx].count} logins</div>
              <div className="text-slate-300">Week of {formatWeekLabel(data[hoverIdx].week)}</div>
            </div>
          )}
        </div>
      </div>

      {/* X axis labels — every other week to avoid crowding */}
      <div className="flex mt-2" style={{ gap: `${BAR_GAP}px`, paddingLeft: "28px" }}>
        {data.map((d, idx) => (
          <div key={d.week} className="flex-1 text-center" style={{ maxWidth: `${BAR_MAX_WIDTH + BAR_GAP}px` }}>
            {idx % 2 === 0 && (
              <span className="text-[9px] text-slate-400">{formatWeekLabel(d.week)}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
