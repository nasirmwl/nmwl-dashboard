"use client";

import { Check, ChevronDown } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";

import {
  DAILY_CHECK_SECTIONS,
  flatKeyForCheckbox,
  readDayEntryBoolean,
  type DayEntry,
} from "@/lib/daily-checks-schema";
import {
  DAY_TEMPLATE_BUTTON_LABEL,
  flatFromDayTemplateKind,
  type DayTemplateKind,
} from "@/lib/daily-check-templates";
import { getGrowthFieldRule, sectionScoreIsMax } from "@/lib/growth-stats";

const STORAGE_KEY = "nmwl-daily-checks";

const SECTIONS = DAILY_CHECK_SECTIONS;

function sectionIsMax(flat: Record<string, boolean>, section: string): boolean {
  return sectionScoreIsMax(
    section,
    (sectionName, key) => flat[flatKeyForCheckbox(sectionName, key)] === true,
  );
}

/** Finished sections start closed. The rest stay open so the unfinished work is in view. */
function openStateForFlat(flat: Record<string, boolean>): Record<string, boolean> {
  return Object.fromEntries(
    SECTIONS.map((section) => [section.section, !sectionIsMax(flat, section.section)]),
  );
}

const DAY_TEMPLATE_KINDS = [
  "productive",
  "unproductive",
  "rest",
] as const satisfies readonly DayTemplateKind[];

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

function isIsoDate(value: string | undefined): value is string {
  return !!value && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export default function DailyChecksEntry({ initialDate }: DailyChecksEntryProps) {
  const router = useRouter();
  const [dateStr, setDateStr] = useState(() =>
    isIsoDate(initialDate) ? initialDate : todayLocalISO(),
  );
  const [flat, setFlat] = useState<Record<string, boolean>>({});
  const [status, setStatus] = useState("");
  const [hydrated, setHydrated] = useState(false);
  const [loadingEntry, setLoadingEntry] = useState(true);
  const [saving, setSaving] = useState(false);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(SECTIONS.map((section) => [section.section, true])),
  );
  const flatRef = useRef<Record<string, boolean>>({});
  const dateStrRef = useRef(dateStr);
  const saveQueueRef = useRef(Promise.resolve());
  /** Date already written into the edit URL, so later checks only save. */
  const editUrlDateRef = useRef<string | null>(isIsoDate(initialDate) ? initialDate : null);

  dateStrRef.current = dateStr;

  const applyFlat = (next: Record<string, boolean>) => {
    flatRef.current = next;
    setFlat(next);
  };

  useEffect(() => {
    if (isIsoDate(initialDate)) {
      setDateStr(initialDate);
      editUrlDateRef.current = initialDate;
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
        const loaded = flatFromDay(entry ?? loadLog()[dateStr]);
        if (ac.signal.aborted) return;
        applyFlat(loaded);
        setOpenSections(openStateForFlat(loaded));
      } catch {
        if (ac.signal.aborted) return;
        const loaded = flatFromDay(loadLog()[dateStr]);
        applyFlat(loaded);
        setOpenSections(openStateForFlat(loaded));
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

  const persistFlat = async (date: string, nextFlat: Record<string, boolean>) => {
    const entry = buildEntryFromFlat(nextFlat);
    const log = loadLog();
    log[date] = entry;
    saveLog(log);
    const r = await fetch("/api/supabase/daily-checks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, entry }),
    });
    const body = await r.json().catch(() => ({}));
    if (!r.ok) {
      throw new Error(typeof body.error === "string" ? body.error : "Save failed");
    }
  };

  const enqueueSave = (date: string, nextFlat: Record<string, boolean>, source: "check" | "submit") => {
    saveQueueRef.current = saveQueueRef.current
      .catch(() => undefined)
      .then(async () => {
        setSaving(true);
        try {
          await persistFlat(date, nextFlat);
          if (dateStrRef.current !== date) return;
          const openingEdit = editUrlDateRef.current !== date;
          if (openingEdit) {
            editUrlDateRef.current = date;
            router.replace(`/daily-checks?date=${encodeURIComponent(date)}`, { scroll: false });
            setStatus(`Saved ${date}. Editing this day.`);
          } else if (source === "check") {
            setStatus(`Saved ${date}.`);
          } else {
            setStatus(`Entry saved for ${date}.`);
          }
        } catch (err) {
          const msg = err instanceof Error ? err.message : "Unknown error";
          setStatus(`Saved locally only. Cloud sync failed: ${msg}`);
        } finally {
          setSaving(false);
        }
      });
  };

  const setChecked = (section: string, key: string, checked: boolean) => {
    const id = flatKeyForCheckbox(section, key);
    if (!checklistIds.has(id)) return;
    const next = { ...flatRef.current, [id]: checked };
    applyFlat(next);
    if (!dateStr) {
      setStatus("Please select a date.");
      return;
    }
    enqueueSave(dateStr, next, "check");
  };

  const applyDayTemplate = (kind: DayTemplateKind) => {
    applyFlat(flatFromDayTemplateKind(kind));
    setStatus(`${DAY_TEMPLATE_BUTTON_LABEL[kind]} template applied — review and save.`);
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!dateStr) {
      setStatus("Please select a date.");
      return;
    }
    enqueueSave(dateStr, flatRef.current, "submit");
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
  const editing = isIsoDate(initialDate) && initialDate === dateStr;

  return (
    <article
      className="crt-panel overflow-hidden rounded-sm"
      aria-label="Daily checklist"
    >
      <div className="p-4 sm:p-6 space-y-4">
        <header>
          <h1 className="text-lg sm:text-xl font-bold tracking-wide text-crt-phosphor-bright crt-text-plain">
            {editing ? "edit entry" : "log entry"}
          </h1>
        </header>

        <p className="text-sm text-crt-muted crt-text-plain leading-relaxed">
          {editing
            ? "Changes to a check save immediately for this date."
            : "Select the items that were true for the chosen date. The first check saves the day and opens it for editing."}
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

          <div className="space-y-2">
            <p className="text-xs font-medium text-crt-muted uppercase tracking-wider crt-text-plain">
              Quick fill
            </p>
            <div className="flex flex-wrap gap-2">
              {DAY_TEMPLATE_KINDS.map((kind) => (
                <button
                  key={kind}
                  type="button"
                  disabled={formBusy}
                  onClick={() => applyDayTemplate(kind)}
                  className="px-3 py-2.5 md:py-2 rounded-sm border border-crt-border bg-crt-bar-track/60 text-sm font-medium text-crt-phosphor-bright crt-text-plain transition-colors hover:border-crt-phosphor-dim hover:bg-crt-bg/50 min-h-[44px] md:min-h-0 disabled:opacity-50"
                >
                  {DAY_TEMPLATE_BUTTON_LABEL[kind]}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-crt-muted crt-text-plain leading-snug">
              Fills every checkbox from that day template. Save entry to store a template fill.
            </p>
          </div>

          {SECTIONS.map((fieldset) => {
            const sectionOpen = openSections[fieldset.section] ?? true;
            const atMax = !loadingEntry && sectionIsMax(flat, fieldset.section);
            return (
            <details
              key={fieldset.section}
              open={sectionOpen}
              onToggle={(e) => {
                const isOpen = e.currentTarget.open;
                setOpenSections((prev) =>
                  prev[fieldset.section] === isOpen
                    ? prev
                    : { ...prev, [fieldset.section]: isOpen },
                );
              }}
              className="rounded-sm border border-crt-border bg-crt-bar-track/40 crt-text-plain"
            >
              <summary className="cursor-pointer list-none flex items-center justify-between gap-3 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-crt-phosphor-bright select-none [&::-webkit-details-marker]:hidden">
                <span className="inline-flex items-center gap-2">
                  {fieldset.legend}
                  {atMax ? (
                    <Check
                      className="h-3.5 w-3.5 text-crt-phosphor"
                      aria-hidden
                      strokeWidth={2.75}
                    />
                  ) : null}
                  {atMax ? <span className="sr-only">maximum score</span> : null}
                </span>
                <ChevronDown
                  className={`h-4 w-4 shrink-0 text-crt-phosphor-dim transition-transform ${sectionOpen ? "rotate-180" : ""}`}
                  aria-hidden
                />
              </summary>
              <div className="space-y-1 px-4 pb-4">
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
              </div>
            </details>
            );
          })}

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
