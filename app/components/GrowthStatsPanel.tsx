"use client";

import { useEffect, useMemo, useState } from "react";

import { 
  PRODUCTIVITY_CHART_WINDOW_DAYS, 
  type GrowthStatRow, 
  type FieldStat 
} from "@/lib/growth-stats";

import GrowthStatsRadar from "./GrowthStatsRadar";

function StatBar({
  name,
  detail,
  value,
  maxWeightPerDay,
  fields = [],
}: {
  name: string;
  detail: string;
  value: number;
  maxWeightPerDay: number;
  fields?: FieldStat[];
}) {
  const [expanded, setExpanded] = useState(false);
  const clamped = Math.min(100, Math.max(0, value));

  return (
    <div className="flex flex-col">
      <div 
        className="group/me-tip relative min-w-0 cursor-pointer hover:z-30"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="me-stat-row crt-text-plain hover:bg-crt-phosphor/5 transition-colors rounded-sm px-1 -mx-1">
          <span
            className="me-stat-label justify-self-start text-left normal-case tracking-normal flex items-center gap-1.5"
            title={name}
          >
            <span className={`text-[8px] transition-transform duration-200 ${expanded ? 'rotate-90' : ''}`}>
              ▶
            </span>
            {name}
          </span>
          <div
            className="me-stat-track"
            role="progressbar"
            aria-valuenow={clamped}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${name}: ${clamped} percent`}
          >
            <div className="me-stat-fill" style={{ width: `${clamped}%` }} />
          </div>
          <span className="me-stat-value">{clamped}</span>
        </div>
        
        {/* Tooltip (only when not expanded to avoid clutter) */}
        {!expanded && (
          <span
            role="tooltip"
            className="pointer-events-none absolute left-0 top-full z-50 mt-1 w-max max-w-[min(18rem,calc(100vw-2rem))] space-y-1.5 rounded-sm border border-crt-border bg-crt-panel px-2.5 py-2 text-left text-[10px] font-semibold normal-case tracking-wide text-crt-phosphor-bright opacity-0 shadow-[0_4px_12px_rgba(0,0,0,0.45)] transition-opacity duration-100 group-hover/me-tip:opacity-100 crt-text-plain"
          >
            <span className="block">{name}</span>
            <span className="block font-normal leading-snug text-crt-muted">{detail}</span>
            <span className="block border-t border-crt-border pt-1.5 font-normal text-crt-muted">
              Σ weight/day: {maxWeightPerDay} (14-day % uses this × 14)
            </span>
          </span>
        )}
      </div>

      {expanded && fields.length > 0 && (
        <div className="ml-4 mt-1 space-y-2 border-l border-crt-border/30 pl-3 py-1">
          {fields.map((f) => (
            <div key={f.key} className="flex flex-col gap-0.5">
              <div className="flex items-center justify-between text-[10px] crt-text-plain">
                <span className="text-crt-muted truncate max-w-[160px]" title={f.label}>{f.label}</span>
                <span className={`font-mono ${f.successRate < 50 ? 'text-crt-danger' : 'text-crt-phosphor-dim'}`}>
                  {f.successRate}%
                </span>
              </div>
              <div className="h-0.5 w-full bg-crt-bar-track/30 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all ${f.successRate < 50 ? 'bg-crt-danger/50' : 'bg-crt-phosphor/40'}`}
                  style={{ width: `${f.successRate}%` }}
                />
              </div>
              {f.pointsLost > 0 && (
                <span className="text-[8px] text-crt-danger/70 leading-none">
                  -{f.pointsLost} pts lost
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

type DailyProductivityPoint = {
  date: string;
  score: number;
  logged: boolean;
};

type StatsPayload = {
  stats?: GrowthStatRow[];
  dailyStats?: GrowthStatRow[];
  topFrictionPoints?: FieldStat[];
  dailyDate?: string;
  dailyLogged?: boolean;
  error?: string;
  windowDays?: number;
  loggedDaysInWindow?: number;
  windowStart?: string;
  windowEnd?: string;
  productivityWindowDays?: number;
  dailyProductivity?: DailyProductivityPoint[];
};

function parseIsoDateUtc(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, (m ?? 1) - 1, d ?? 1));
}

/** Square fill from daily score (warmer = lower, greener = higher). */
function productivityHeatFill(score: number, logged: boolean): string {
  if (!logged) {
    return "color-mix(in srgb, var(--crt-muted) 22%, var(--crt-bar-track))";
  }
  const s = Math.min(100, Math.max(0, score));
  const h = 12 + (s / 100) * 108;
  const L = 34 + (s / 100) * 26;
  return `hsl(${h} 58% ${L}%)`;
}

/** Pad to full weeks (Sun→Sat columns), GitHub-style. */
function productivityHeatmapCells(
  days: DailyProductivityPoint[],
): (DailyProductivityPoint | null)[] {
  if (days.length === 0) return [];
  const first = parseIsoDateUtc(days[0].date);
  const paddingBefore = first.getUTCDay();
  const n = days.length;
  const paddingAfter = (7 - ((paddingBefore + n) % 7)) % 7;
  return [
    ...Array<DailyProductivityPoint | null>(paddingBefore).fill(null),
    ...days,
    ...Array<DailyProductivityPoint | null>(paddingAfter).fill(null),
  ];
}

const HEATMAP_DOW_LABELS = ["S", "M", "T", "W", "T", "F", "S"] as const;

function ProductivityDailySection({ days }: { days: DailyProductivityPoint[] }) {
  const from = days[0]?.date ?? "";
  const to = days[days.length - 1]?.date ?? "";

  const cells = useMemo(() => productivityHeatmapCells(days), [days]);
  const weeks = useMemo(() => {
    if (cells.length === 0) return [];
    const colCount = cells.length / 7;
    return Array.from({ length: colCount }, (_, w) => cells.slice(w * 7, w * 7 + 7));
  }, [cells]);

  const gapCls = "gap-[3px] sm:gap-1";

  return (
    <div className="border-t border-crt-border py-4 sm:py-5">
      <div className="mb-3 px-4 sm:px-6 crt-text-plain">
        <h3 className="text-[11px] font-bold uppercase tracking-wider text-crt-muted">
          {PRODUCTIVITY_CHART_WINDOW_DAYS}-day checklist heatmap 
        </h3>
      </div>
      <div className="w-full min-w-0 px-4 sm:px-6">
        <div className="flex w-full items-stretch gap-2 sm:gap-3">
          <div
            className={`flex w-7 shrink-0 flex-col self-stretch min-h-0 sm:w-8 ${gapCls}`}
            aria-hidden
          >
            {HEATMAP_DOW_LABELS.map((label, row) => (
              <div
                key={`dow-${row}`}
                className="flex min-h-0 flex-1 items-center justify-end text-[8px] leading-none text-crt-muted"
              >
                {row % 2 === 1 ? label : "\u00a0"}
              </div>
            ))}
          </div>
          <div
            className={`flex min-w-0 flex-1 items-stretch ${gapCls}`}
            role="img"
            aria-label={`Productivity heatmap from ${from} to ${to}, Sunday top to Saturday bottom, older weeks left.`}
          >
            {weeks.map((week, wi) => (
              <div
                key={`week-${wi}`}
                className={`flex min-w-0 flex-1 flex-col ${gapCls}`}
              >
                {week.map((cell, ri) => {
                  const key = cell ? cell.date : `empty-${wi}-${ri}`;
                  const fill = cell
                    ? productivityHeatFill(cell.score, cell.logged)
                    : "var(--crt-bar-track)";
                  const tooltipMain = !cell
                    ? "Outside range"
                    : cell.logged
                      ? `Score: ${cell.score}`
                      : "No log · 0";
                  const tooltipDate = cell?.date ?? "";
                  return (
                    <div
                      key={key}
                      className="group/heat-cell relative aspect-square w-full min-h-0 cursor-default hover:z-20"
                    >
                      <div
                        className="aspect-square w-full min-h-0 rounded-[3px] border border-crt-border/50"
                        style={{
                          backgroundColor: fill,
                          boxShadow:
                            cell && cell.logged
                              ? "inset 0 1px 0 rgba(255,255,255,0.08)"
                              : undefined,
                        }}
                      />
                      <span
                        role="tooltip"
                        className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-1 w-max max-w-[min(14rem,calc(100vw-2rem))] -translate-x-1/2 space-y-0.5 rounded-sm border border-crt-border bg-crt-panel px-2 py-1.5 text-left text-[10px] font-semibold normal-case tracking-wide text-crt-phosphor-bright opacity-0 shadow-[0_4px_12px_rgba(0,0,0,0.45)] transition-opacity duration-100 group-hover/heat-cell:opacity-100 crt-text-plain"
                      >
                        {tooltipDate ? (
                          <>
                            <span className="block tabular-nums">{tooltipDate}</span>
                            <span className="block font-normal leading-snug text-crt-muted">
                              {tooltipMain}
                            </span>
                          </>
                        ) : (
                          <span className="block font-normal text-crt-muted">{tooltipMain}</span>
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
        <div className="mt-3 flex w-full flex-wrap items-center justify-end gap-2 text-[9px] text-crt-muted crt-text-plain">
          <span>Less</span>
          <div className={`flex items-center ${gapCls}`}>
            {[0, 25, 50, 75, 100].map((level) => (
              <div
                key={level}
                className="aspect-square w-3 min-w-3 rounded-[2px] border border-crt-border/50 sm:w-3.5 sm:min-w-3.5"
                style={{
                  backgroundColor: productivityHeatFill(level, true),
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08)",
                }}
              />
            ))}
          </div>
          <span>More</span>
        </div>
      </div>
    </div>
  );
}

export default function GrowthStatsPanel() {
  const [stats, setStats] = useState<GrowthStatRow[] | null>(null);
  const [dailyStats, setDailyStats] = useState<GrowthStatRow[] | null>(null);
  const [topFriction, setTopFriction] = useState<FieldStat[] | null>(null);
  const [dailyMeta, setDailyMeta] = useState<{
    date: string;
    logged: boolean;
  } | null>(null);
  const [meta, setMeta] = useState<{
    windowDays: number;
    loggedDaysInWindow: number;
  } | null>(null);
  const [dailyProductivity, setDailyProductivity] = useState<
    DailyProductivityPoint[] | null
  >(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch("/api/supabase/daily-checks/stats");
        const body = (await r.json().catch(() => ({}))) as StatsPayload;
        if (!r.ok) {
          throw new Error(typeof body.error === "string" ? body.error : "Failed to load stats");
        }
        if (!cancelled) {
          setStats(Array.isArray(body.stats) ? body.stats : []);
          setDailyStats(Array.isArray(body.dailyStats) ? body.dailyStats : []);
          setTopFriction(Array.isArray(body.topFrictionPoints) ? body.topFrictionPoints : []);
          setDailyMeta({
            date: typeof body.dailyDate === "string" ? body.dailyDate : "",
            logged: body.dailyLogged === true,
          });
          setMeta({
            windowDays: typeof body.windowDays === "number" ? body.windowDays : 14,
            loggedDaysInWindow:
              typeof body.loggedDaysInWindow === "number"
                ? body.loggedDaysInWindow
                : 0,
          });
          setDailyProductivity(
            Array.isArray(body.dailyProductivity) ? body.dailyProductivity : [],
          );
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return (
      <div className="crt-panel overflow-hidden rounded-sm p-6">
        <p className="text-crt-danger text-sm crt-text-plain">{error}</p>
      </div>
    );
  }

  if (
    stats === null ||
    dailyStats === null ||
    dailyMeta === null ||
    meta === null ||
    dailyProductivity === null
  ) {
    return (
      <div className="crt-panel overflow-hidden rounded-sm" aria-busy="true">
        <div className="h-36 w-full overflow-hidden sm:h-40">
          <div className="h-full w-full bg-crt-bar-track/40 animate-pulse" />
        </div>
        <div className="flex min-w-0 flex-col gap-3 p-4 sm:p-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="me-stat-row crt-text-plain">
              <span className="me-stat-label opacity-25">·</span>
              <div className="me-stat-track">
                <div className="me-stat-fill opacity-25" style={{ width: "40%" }} />
              </div>
              <span className="me-stat-value opacity-25">0</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="crt-panel crt-panel--tooltips rounded-sm">
      <div className="h-36 w-full overflow-hidden sm:h-40">
        <img
          src="/girl-green-eye.png"
          alt=""
          className="block h-full w-full object-cover object-center"
          decoding="async"
        />
      </div>
      <p className="border-b border-crt-border px-4 py-2 text-[11px] leading-snug text-crt-muted sm:px-6 crt-text-plain">
        Last {meta.windowDays} days · {meta.loggedDaysInWindow} logged
      </p>
      <div className="grid grid-cols-1 border-b border-crt-border sm:grid-cols-2">
        <div className="border-b border-crt-border sm:border-b-0 sm:border-r border-crt-border">
          <GrowthStatsRadar
            stats={dailyStats}
            title="Today"
            variant="today"
            caption={
              dailyMeta.logged
                ? null
                : `No log for ${dailyMeta.date || "today"} — scores are 0`
            }
          />
        </div>
        <GrowthStatsRadar
          stats={stats}
          title={`${meta.windowDays}-day window`}
          variant="window"
        />
      </div>
      
      <ProductivityDailySection days={dailyProductivity} />

      <div className="flex min-w-0 flex-col gap-4 p-4 sm:p-6">
        <div className="space-y-3">
          {stats.map((s) => (
            <StatBar
              key={s.id}
              name={s.label}
              detail={s.detail}
              value={s.value}
              maxWeightPerDay={s.maxWeightPerDay ?? 0}
              fields={s.fields}
            />
          ))}
        </div>

        {topFriction && topFriction.length > 0 && (
          <div className="mt-4 border-t border-crt-border/50 pt-5">
            <h3 className="mb-3 text-[11px] font-bold uppercase tracking-wider text-crt-danger">
              [!] Top Friction Points (Lost Pts)
            </h3>
            <div className="space-y-2">
              {topFriction.map((f) => (
                <div key={f.key} className="flex items-center gap-3 text-[10px] crt-text-plain">
                  <span className="text-crt-danger font-mono shrink-0">-{f.pointsLost}</span>
                  <div className="flex min-w-0 flex-col">
                    <span className="text-crt-phosphor truncate">{f.label}</span>
                    <span className="text-[9px] text-crt-muted">Success: {f.successRate}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
