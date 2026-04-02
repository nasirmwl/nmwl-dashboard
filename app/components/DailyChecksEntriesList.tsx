"use client";

import Link from "next/link";
import { format, parseISO } from "date-fns";
import { Check } from "lucide-react";
import { useEffect, useState } from "react";

import { DAILY_CHECK_SECTIONS, type DayEntry } from "@/lib/daily-checks-schema";
import { getGrowthFieldRule } from "@/lib/growth-stats";

type ListItem = {
  date: string;
  updated_at: string | null;
  entry: DayEntry;
  checkedCount: number;
  totalCount: number;
};

export default function DailyChecksEntriesList() {
  const [items, setItems] = useState<ListItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch("/api/supabase/daily-checks?list=true");
        const body = await r.json().catch(() => ({}));
        if (!r.ok) {
          throw new Error(typeof body.error === "string" ? body.error : "Failed to load entries");
        }
        if (!cancelled) setItems(Array.isArray(body.items) ? body.items : []);
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
      <div className="crt-panel rounded-sm p-6">
        <p className="text-crt-danger text-sm crt-text-plain">{error}</p>
      </div>
    );
  }

  if (items === null) {
    return (
      <div className="crt-panel rounded-sm p-6" aria-busy="true">
        <div className="animate-pulse h-32 rounded-sm bg-crt-bar-track/40 border border-crt-border" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="crt-panel overflow-hidden rounded-sm p-6">
        <p className="text-crt-muted text-sm crt-text-plain">
          No saved entries yet. Log one on{" "}
          <Link href="/daily-checks" className="text-crt-phosphor hover:underline">
            Daily checks
          </Link>
          .
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {items.map((row) => {
        const dateLabel = (() => {
          try {
            return format(parseISO(row.date), "EEEE, MMM d, yyyy");
          } catch {
            return row.date;
          }
        })();
        const updatedLabel = (() => {
          if (!row.updated_at) return null;
          try {
            return format(parseISO(row.updated_at), "MMM d, h:mm a");
          } catch {
            return null;
          }
        })();

        return (
          <details
            key={row.date}
            className="crt-panel overflow-hidden rounded-sm group open:ring-1 open:ring-crt-phosphor-dim/40"
          >
            <summary className="cursor-pointer list-none p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 crt-text-plain [&::-webkit-details-marker]:hidden">
              <span className="font-semibold text-crt-phosphor-bright tracking-wide">{dateLabel}</span>
              <span className="text-sm text-crt-muted">
                {row.checkedCount}/{row.totalCount} checked
                {updatedLabel ? (
                  <span className="text-crt-phosphor-dim ml-2">· updated {updatedLabel}</span>
                ) : null}
              </span>
            </summary>
            <div className="px-4 pb-4 sm:px-5 sm:pb-5 border-t border-crt-border space-y-4">
              {DAILY_CHECK_SECTIONS.map((fieldset) => (
                <div key={fieldset.section}>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-crt-phosphor-dim mb-2 crt-text-plain">
                    {fieldset.legend}
                  </h3>
                  <ul className="space-y-1.5 list-none m-0 p-0">
                    {fieldset.items.map((item) => {
                      const on = row.entry[fieldset.section]?.[item.key] === true;
                      const rule = getGrowthFieldRule(fieldset.section, item.key);
                      return (
                        <li
                          key={`${fieldset.section}-${item.key}`}
                          className="flex items-start gap-2.5 text-sm crt-text-plain"
                        >
                          <span
                            className="mt-0.5 shrink-0 w-5 inline-flex justify-center text-crt-phosphor-bright"
                            aria-hidden="true"
                          >
                            {on ? (
                              <Check className="w-4 h-4" strokeWidth={2.75} />
                            ) : null}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span
                              className={
                                on
                                  ? "text-crt-phosphor-bright"
                                  : "text-crt-phosphor-dim/90"
                              }
                            >
                              {item.label}
                            </span>
                            {rule ? (
                              <span className="mt-0.5 block text-[10px] text-crt-muted tabular-nums">
                                w{rule.weight}
                                {rule.polarity === "good_when_false"
                                  ? " · score when unchecked"
                                  : " · score when checked"}
                              </span>
                            ) : null}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
              <p className="pt-2">
                <Link
                  href={`/daily-checks?date=${encodeURIComponent(row.date)}`}
                  className="text-sm text-crt-phosphor hover:text-crt-phosphor-bright hover:underline"
                >
                  Edit this day
                </Link>
              </p>
            </div>
          </details>
        );
      })}
    </div>
  );
}
