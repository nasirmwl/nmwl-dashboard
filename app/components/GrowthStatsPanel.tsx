"use client";

import { useEffect, useState } from "react";

import type { GrowthStatRow } from "@/lib/growth-stats";

function StatBar({
  name,
  detail,
  value,
  maxWeightPerDay,
}: {
  name: string;
  detail: string;
  value: number;
  maxWeightPerDay: number;
}) {
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <div className="group/me-tip relative cursor-default hover:z-30">
      <div className="me-stat-row crt-text-plain">
        <span
          className="me-stat-label justify-self-start text-left normal-case tracking-normal"
          title={name}
        >
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
    </div>
  );
}

type StatsPayload = {
  stats?: GrowthStatRow[];
  error?: string;
  scoringVersion?: string;
  windowDays?: number;
  loggedDaysInWindow?: number;
  windowStart?: string;
  windowEnd?: string;
};

export default function GrowthStatsPanel() {
  const [stats, setStats] = useState<GrowthStatRow[] | null>(null);
  const [meta, setMeta] = useState<{
    scoringVersion: string;
    windowDays: number;
    loggedDaysInWindow: number;
  } | null>(null);
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
          setMeta({
            scoringVersion:
              typeof body.scoringVersion === "string" ? body.scoringVersion : "—",
            windowDays: typeof body.windowDays === "number" ? body.windowDays : 14,
            loggedDaysInWindow:
              typeof body.loggedDaysInWindow === "number"
                ? body.loggedDaysInWindow
                : 0,
          });
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

  if (stats === null || meta === null) {
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
        Last {meta.windowDays} days (UTC) · {meta.loggedDaysInWindow} logged ·{" "}
        {meta.scoringVersion}
      </p>
      <div className="flex min-w-0 flex-col gap-3 p-4 sm:p-6">
        {stats.map((s) => (
          <StatBar
            key={s.id}
            name={s.label}
            detail={s.detail}
            value={s.value}
            maxWeightPerDay={s.maxWeightPerDay ?? 0}
          />
        ))}
      </div>
    </div>
  );
}
