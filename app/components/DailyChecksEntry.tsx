"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";

import {
  DAILY_CHECK_SECTIONS,
  flatKeyForCheckbox,
  readDayEntryBoolean,
  type DayEntry,
} from "@/lib/daily-checks-schema";
import { getGrowthFieldRule } from "@/lib/growth-stats";

const STORAGE_KEY = "nmwl-daily-checks";

const SECTIONS = DAILY_CHECK_SECTIONS;

function todayLocalISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function loadLog(): Record<string, DayEntry> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") as Record<
      string,
      DayEntry
    >;
  } catch {
    return {};
  }
}

function saveLog(log: Record<string, DayEntry>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(log));
}

function readCheckboxValue(day: DayEntry | undefined, section: string, dataKey: string): boolean {
  return readDayEntryBoolean(day, section, dataKey);
}

function flatFromDay(day: DayEntry | undefined): Record<string, boolean> {
  const out: Record<string, boolean> = {};
  for (const s of SECTIONS) {
    for (const item of s.items) {
      const fk = flatKeyForCheckbox(s.section, item.key);
      const v = readCheckboxValue(day, s.section, item.key);
      out[fk] = out[fk] === true || v;
    }
  }
  return out;
}

function buildEntryFromFlat(flat: Record<string, boolean>): DayEntry {
  const entry: DayEntry = {};
  for (const s of SECTIONS) {
    const bucket: Record<string, boolean> = {};
    for (const item of s.items) {
      bucket[item.key] = flat[flatKeyForCheckbox(s.section, item.key)] === true;
    }
    entry[s.section] = bucket;
  }
  return entry;
}

type DailyChecksEntryProps = {
  /** When set (e.g. from `/daily-checks?date=YYYY-MM-DD`), loads that date. */
  initialDate?: string;
};

export default function DailyChecksEntry({ initialDate }: DailyChecksEntryProps) {
  const [dateStr, setDateStr] = useState(() =>
    initialDate && /^\d{4}-\d{2}-\d{2}$/.test(initialDate) ? initialDate : todayLocalISO(),
  );
  const [flat, setFlat] = useState<Record<string, boolean>>({});
  const [status, setStatus] = useState("");
  const [hydrated, setHydrated] = useState(false);
  const [loadingEntry, setLoadingEntry] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initialDate && /^\d{4}-\d{2}-\d{2}$/.test(initialDate)) {
      setDateStr(initialDate);
    }
  }, [initialDate]);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const ac = new AbortController();
    setStatus("");
    setLoadingEntry(true);
    (async () => {
      try {
        const r = await fetch(
          `/api/supabase/daily-checks?date=${encodeURIComponent(dateStr)}`,
          { signal: ac.signal },
        );
        const body = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(typeof body.error === "string" ? body.error : "Failed to load");
        const entry = body.entry as DayEntry | null | undefined;
        if (ac.signal.aborted) return;
        if (entry) {
          setFlat(flatFromDay(entry));
        } else {
          setFlat(flatFromDay(loadLog()[dateStr]));
        }
      } catch {
        if (ac.signal.aborted) return;
        setFlat(flatFromDay(loadLog()[dateStr]));
      } finally {
        if (!ac.signal.aborted) setLoadingEntry(false);
      }
    })();
    return () => ac.abort();
  }, [dateStr, hydrated]);

  const checklistIds = useMemo(
    () =>
      new Set(
        SECTIONS.flatMap((s) =>
          s.items.map((item) => flatKeyForCheckbox(s.section, item.key)),
        ),
      ),
    [],
  );

  const setChecked = (section: string, key: string, checked: boolean) => {
    const id = flatKeyForCheckbox(section, key);
    if (!checklistIds.has(id)) return;
    setFlat((prev) => ({ ...prev, [id]: checked }));
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!dateStr) {
      setStatus("Please select a date.");
      return;
    }
    const entry = buildEntryFromFlat(flat);
    setSaving(true);
    try {
      const r = await fetch("/api/supabase/daily-checks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: dateStr, entry }),
      });
      const body = await r.json().catch(() => ({}));
      if (!r.ok) {
        throw new Error(typeof body.error === "string" ? body.error : "Save failed");
      }
      const log = loadLog();
      log[dateStr] = entry;
      saveLog(log);
      setStatus(`Entry saved for ${dateStr}.`);
    } catch (err) {
      const log = loadLog();
      log[dateStr] = entry;
      saveLog(log);
      const msg = err instanceof Error ? err.message : "Unknown error";
      setStatus(`Saved locally only. Cloud sync failed: ${msg}`);
    } finally {
      setSaving(false);
    }
  };

  if (!hydrated) {
    return (
      <div
        className="crt-panel rounded-sm p-6"
        aria-busy="true"
      >
        <div className="animate-pulse h-40 rounded-sm bg-crt-bar-track/40 border border-crt-border" />
      </div>
    );
  }

  const formBusy = loadingEntry || saving;

  return (
    <article
      className="crt-panel overflow-hidden rounded-sm"
      aria-label="Daily checklist"
    >
      <div className="p-4 sm:p-6 space-y-4">
        <header>
          <h1 className="text-lg sm:text-xl font-bold tracking-wide text-crt-phosphor-bright crt-text-plain">
            log entry
          </h1>
        </header>

        <p className="text-sm text-crt-muted crt-text-plain leading-relaxed">
          Select the items that were true for the chosen date.
        </p>

        <form
          className="space-y-6"
          onSubmit={onSubmit}
          id="stat-entry-form"
          aria-busy={formBusy}
        >
          <div>
            <label className="block text-xs font-medium text-crt-muted uppercase tracking-wider crt-text-plain">
              Date
              <input
                type="date"
                name="date"
                id="entry-date"
                required
                value={dateStr}
                onChange={(e) => setDateStr(e.target.value)}
                disabled={loadingEntry}
                className="mt-1.5 block w-full max-w-xs px-3 py-2 crt-input rounded-sm text-sm disabled:opacity-50"
              />
            </label>
          </div>

          {SECTIONS.map((fieldset) => (
            <fieldset
              key={fieldset.section}
              className="rounded-sm border border-crt-border bg-crt-bar-track/40 p-4 space-y-3 crt-text-plain"
            >
              <legend className="px-1 text-xs font-semibold uppercase tracking-wider text-crt-phosphor-bright">
                {fieldset.legend}
              </legend>
              {fieldset.items.map((item) => {
                const id = `${fieldset.section}-${item.key}`;
                const checked =
                  flat[flatKeyForCheckbox(fieldset.section, item.key)] === true;
                const rule = getGrowthFieldRule(fieldset.section, item.key);
                return (
                  <label
                    key={item.key}
                    htmlFor={id}
                    className="flex items-start gap-3 cursor-pointer rounded-sm p-2 -mx-1 hover:bg-crt-bg/50 transition-colors"
                  >
                    <input
                      id={id}
                      type="checkbox"
                      className="mt-1 size-4 shrink-0 rounded border-crt-border accent-[var(--crt-phosphor)]"
                      checked={checked}
                      disabled={loadingEntry}
                      onChange={(e) =>
                        setChecked(fieldset.section, item.key, e.target.checked)
                      }
                      data-section={fieldset.section}
                      data-key={item.key}
                    />
                    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="text-sm text-crt-phosphor-bright leading-snug">
                        {item.label}
                      </span>
                      {rule ? (
                        <span className="text-[10px] text-crt-muted tabular-nums crt-text-plain">
                          Weight {rule.weight}
                          {rule.polarity === "good_when_false"
                            ? " · points when unchecked"
                            : " · points when checked"}
                        </span>
                      ) : null}
                    </span>
                    {rule ? (
                      <span
                        className="mt-0.5 shrink-0 text-[10px] font-medium tabular-nums text-crt-phosphor-dim"
                        title={
                          rule.polarity === "good_when_false"
                            ? "Full weight counts toward 14-day score when this box is unchecked"
                            : "Full weight counts toward 14-day score when this box is checked"
                        }
                      >
                        w{rule.weight}
                      </span>
                    ) : null}
                  </label>
                );
              })}
            </fieldset>
          ))}

          <div className="pt-1">
            <button
              type="submit"
              disabled={formBusy}
              className="w-full sm:w-auto px-5 py-3 md:py-2 crt-btn crt-btn-primary rounded-sm font-medium transition-colors text-base md:text-sm min-h-[44px] crt-text-plain disabled:opacity-50"
            >
              {saving ? "Saving…" : loadingEntry ? "Loading…" : "Save entry"}
            </button>
          </div>
        </form>

        <p
          id="entry-status"
          role="status"
          aria-live="polite"
          className="text-sm text-crt-muted crt-text-plain"
        >
          {status}
        </p>

        <p className="text-sm crt-text-plain flex flex-wrap gap-x-4 gap-y-1">
          <Link
            href="/"
            className="text-crt-phosphor hover:text-crt-phosphor-bright hover:underline"
          >
            Back to summary panel
          </Link>
          <Link
            href="/entries"
            className="text-crt-phosphor hover:text-crt-phosphor-bright hover:underline"
          >
            View saved entries
          </Link>
        </p>
      </div>
    </article>
  );
}
