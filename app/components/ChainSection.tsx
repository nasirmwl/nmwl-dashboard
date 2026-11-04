"use client";

import { ChevronDown, ChevronLeft, ChevronRight, Search, X } from "lucide-react";
import { FormEvent, useEffect, useRef, useState } from "react";

import {
  chainJoins,
  chainStartedOn,
  dayOn,
  daysForLinks,
  linkProgress,
  monthRange,
  parseMonthKey,
  placeForDate,
  shiftMonth,
  spanWeeks,
  type ChainDayPlace,
  type ChainDayView,
  type ChainPayload,
  type ChainStatus,
} from "@/lib/chain";

import SectionBox from "./SectionBox";

function formatChainDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(y, m - 1, d)));
}

const WEEKDAYS = ["M", "T", "W", "T", "F", "S", "S"] as const;

function statusLabel(status: ChainStatus): string {
  if (status === "done") return "Held";
  if (status === "broken") return "Broken";
  return "Open";
}

function monthName(year: number, month: number): string {
  return new Intl.DateTimeFormat("en-GB", {
    month: "long",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, 1)));
}

function spanTitle(
  earlier: { year: number; month: number },
  later: { year: number; month: number },
): string {
  const start = monthName(earlier.year, earlier.month);
  const end = monthName(later.year, later.month);
  if (earlier.year === later.year) return `${start} – ${end} ${later.year}`;
  return `${start} ${earlier.year} – ${end} ${later.year}`;
}

function ChainLinkIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M13.5442 10.4558C11.8385 8.75022 9.07316 8.75022 7.36753 10.4558L4.27922 13.5442C2.57359 15.2498 2.57359 18.0152 4.27922 19.7208C5.98485 21.4264 8.75021 21.4264 10.4558 19.7208L12 18.1766"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10.4558 13.5442C12.1614 15.2498 14.9268 15.2498 16.6324 13.5442L19.7207 10.4558C21.4264 8.75021 21.4264 5.98485 19.7207 4.27922C18.0151 2.57359 15.2497 2.57359 13.5441 4.27922L12 5.82338"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function cellClass(place: ChainDayPlace, selected: boolean): string {
  const ring = selected ? "border-crt-phosphor-bright" : "border-transparent";
  if (place === "held") return `border ${ring} text-crt-phosphor`;
  if (place === "open") {
    return `border ${selected ? "border-crt-phosphor-bright" : "border-crt-phosphor"} text-crt-phosphor`;
  }
  if (place === "broken") return `border ${ring} text-crt-danger-dim`;
  return `border ${ring} text-crt-muted/40`;
}

function SpanGrid({
  earlier,
  later,
  today,
  days,
  selectedDate,
  onSelect,
}: {
  earlier: { year: number; month: number };
  later: { year: number; month: number };
  today: string;
  days: ChainDayView[];
  selectedDate: string;
  onSelect: (date: string) => void;
}) {
  const startedOn = chainStartedOn(days);
  const weeks = spanWeeks(earlier.year, earlier.month, later.year, later.month);
  const placeByDate = new Map<string, ChainDayPlace>();
  for (const week of weeks) {
    for (const date of week) {
      if (date) placeByDate.set(date, placeForDate(date, today, days, startedOn));
    }
  }

  return (
    <div aria-label={spanTitle(earlier, later)}>
      <div className="mb-1 grid grid-cols-7">
        {WEEKDAYS.map((label, index) => (
          <div
            key={`${label}-${index}`}
            className="text-center text-[8px] font-medium leading-none text-crt-muted"
            aria-hidden="true"
          >
            {label}
          </div>
        ))}
      </div>
      <div className="space-y-0.5">
        {weeks.map((week, weekIndex) => (
          <div key={`week-${weekIndex}`} className="grid grid-cols-7">
            {week.map((date, index) => {
              if (!date) return <div key={`pad-${weekIndex}-${index}`} className="h-6" />;
              const place = placeByDate.get(date) ?? "before";
              const previous = index > 0 ? week[index - 1] : (weeks[weekIndex - 1]?.[6] ?? null);
              const previousPlace = previous ? placeByDate.get(previous) : undefined;
              const joined = previousPlace ? chainJoins(previousPlace, place) : false;
              const selectable = place !== "before";
              const selected = date === selectedDate;
              const dayNum = Number(date.slice(8, 10));
              return (
                <button
                  key={date}
                  type="button"
                  disabled={!selectable}
                  aria-pressed={selected}
                  aria-current={date === today ? "date" : undefined}
                  aria-label={`${formatChainDate(date)}, ${place}`}
                  onClick={() => onSelect(date)}
                  className={`relative flex h-6 items-center justify-center gap-0.5 ${cellClass(place, selected)} disabled:cursor-default`}
                >
                  {joined ? (
                    <span
                      aria-hidden="true"
                      className="absolute -left-px top-1/2 h-px w-2 -translate-y-1/2 bg-crt-phosphor"
                    />
                  ) : null}
                  <span className="text-[9px] tabular-nums leading-none">{dayNum}</span>
                  {place === "held" ? <ChainLinkIcon className="size-3" /> : null}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Multi-select with search. An empty selection means "All links".
 * Selecting every link collapses back to "All" so the two states never disagree.
 */
function LinkSelect({
  options,
  selected,
  onChange,
}: {
  options: string[];
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const needle = query.trim().toLowerCase();
  const filtered = needle
    ? options.filter((option) => option.toLowerCase().includes(needle))
    : options;

  const label =
    selected.length === 0
      ? "All links"
      : selected.length === 1
        ? selected[0]
        : `${selected.length} links`;

  const toggle = (title: string) => {
    const next = selected.includes(title)
      ? selected.filter((item) => item !== title)
      : [...selected, title];
    onChange(next.length === options.length ? [] : next);
  };

  return (
    <div ref={rootRef} className="relative w-full sm:max-w-md">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between gap-2 rounded-sm px-3 py-2 text-left text-sm crt-input"
      >
        <span className="truncate">{label}</span>
        <ChevronDown className="size-3.5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
      </button>

      {open ? (
        <div className="absolute left-0 right-0 z-20 mt-1 rounded-sm border border-crt-border bg-crt-panel p-2 shadow-lg">
          <div className="relative mb-2">
            <Search
              className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-crt-muted"
              strokeWidth={1.75}
              aria-hidden="true"
            />
            <input
              type="search"
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search links"
              aria-label="Search links"
              className="w-full rounded-sm py-1.5 pl-8 pr-3 text-sm crt-input"
            />
          </div>
          <ul role="listbox" aria-multiselectable="true" aria-label="Links" className="max-h-60 space-y-0.5 overflow-y-auto">
            <li role="option" aria-selected={selected.length === 0}>
              <label className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-crt-phosphor-bright hover:bg-crt-bar-track">
                <input
                  type="checkbox"
                  className="size-4 rounded border-crt-border accent-[var(--crt-phosphor)]"
                  checked={selected.length === 0}
                  onChange={() => onChange([])}
                />
                <span>All links</span>
              </label>
            </li>
            {filtered.map((option) => (
              <li key={option} role="option" aria-selected={selected.includes(option)}>
                <label className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-crt-phosphor-bright hover:bg-crt-bar-track">
                  <input
                    type="checkbox"
                    className="size-4 rounded border-crt-border accent-[var(--crt-phosphor)]"
                    checked={selected.includes(option)}
                    onChange={() => toggle(option)}
                  />
                  <span className="truncate">{option}</span>
                </label>
              </li>
            ))}
            {filtered.length === 0 ? (
              <li className="px-2 py-1.5 text-sm text-crt-muted">No links match.</li>
            ) : null}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

export default function ChainSection() {
  const [payload, setPayload] = useState<ChainPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [visibleMonth, setVisibleMonth] = useState<{ year: number; month: number } | null>(null);
  const [draft, setDraft] = useState("");
  const [linkFilter, setLinkFilter] = useState<string[]>([]);
  const queueRef = useRef(Promise.resolve());

  const applyPayload = (next: ChainPayload) => {
    setPayload(next);
    setSelectedDate((current) => current ?? next.today.targetDate);
    setVisibleMonth((current) => current ?? parseMonthKey(next.today.targetDate));
    setError(null);
  };

  const loadChain = async () => {
    const response = await fetch("/api/supabase/chain");
    const data = (await response.json()) as ChainPayload & { error?: string };
    if (!response.ok) throw new Error(data.error || "Failed to load the chain");
    applyPayload(data);
  };

  useEffect(() => {
    let cancelled = false;
    fetch("/api/supabase/chain")
      .then(async (response) => {
        const data = (await response.json()) as ChainPayload & { error?: string };
        if (!response.ok) throw new Error(data.error || "Failed to load the chain");
        return data;
      })
      .then((data) => {
        if (!cancelled) applyPayload(data);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load the chain");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const runMutation = (body: Record<string, string>) => {
    queueRef.current = queueRef.current
      .then(async () => {
        const response = await fetch("/api/supabase/chain", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = (await response.json()) as ChainPayload & { error?: string };
        if (!response.ok) throw new Error(data.error || "Could not update the chain");
        applyPayload(data);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Could not update the chain");
        return loadChain().catch(() => undefined);
      });
    return queueRef.current;
  };

  const toggleItem = (itemId: string) => {
    setPayload((current) => {
      if (!current) return current;
      const flip = (day: ChainDayView): ChainDayView =>
        day.targetDate !== current.today.targetDate
          ? day
          : {
              ...day,
              items: day.items.map((item) =>
                item.id === itemId ? { ...item, isDone: !item.isDone } : item,
              ),
            };
      return {
        ...current,
        days: current.days.map(flip),
        today: flip(current.today),
      };
    });
    void runMutation({ action: "toggle", itemId });
  };

  const deleteItem = (itemId: string) => {
    void runMutation({ action: "delete", itemId });
  };

  const addItem = (event: FormEvent) => {
    event.preventDefault();
    const title = draft.trim();
    if (!title) return;
    setDraft("");
    void runMutation({ action: "add", title });
  };

  if (loading) {
    return (
      <SectionBox title="Chain">
        <div className="h-32 animate-pulse rounded-sm bg-crt-bar-track/40" />
      </SectionBox>
    );
  }

  if (!payload) {
    return (
      <SectionBox title="Chain">
        <p className="text-sm text-crt-danger crt-text-plain">{error ?? "Could not load the chain."}</p>
      </SectionBox>
    );
  }

  const selected = selectedDate
    ? dayOn(payload.today.targetDate, payload.days, selectedDate, payload.templates)
    : null;
  const isToday = selected?.targetDate === payload.today.targetDate;
  const isFuture = selected != null && selected.targetDate > payload.today.targetDate;
  const editable = isToday && selected?.id != null;

  const linkTitles = payload.templates.map((template) => template.title);
  const activeFilter = linkFilter.filter((title) => linkTitles.includes(title));
  const activeTitles = activeFilter.length === 0 ? linkTitles : activeFilter;
  // With a link selected, the calendar shows that link's chain instead of whole-day status.
  const calendarDays = activeFilter.length > 0 ? daysForLinks(payload.days, activeFilter) : payload.days;
  const visibleItems = selected
    ? selected.items.filter((item) => activeTitles.includes(item.title))
    : [];
  const progressRange = visibleMonth ? monthRange(visibleMonth.year, visibleMonth.month) : null;
  const progressRows = progressRange
    ? activeTitles.map((title) =>
        linkProgress(title, payload.today.targetDate, payload.days, progressRange),
      )
    : [];

  const shiftVisibleMonth = (delta: number) => {
    if (!visibleMonth) return;
    const next = shiftMonth(visibleMonth.year, visibleMonth.month, delta);
    const todayMonth = parseMonthKey(payload.today.targetDate);
    const showsToday = next.year === todayMonth.year && next.month === todayMonth.month;
    setVisibleMonth(next);
    setSelectedDate(showsToday ? payload.today.targetDate : null);
  };

  return (
    <SectionBox title="Chain">
      <div className="space-y-3 crt-text-plain">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="text-sm text-crt-phosphor-bright tabular-nums">
            Current {payload.tracker.currentStreak}
            <span className="mx-2 text-crt-muted">·</span>
            Longest {payload.tracker.longestStreak}
          </p>
          <p className="text-[11px] text-crt-muted">
            Links repeat every day. A chain mark is a held day.
          </p>
        </div>

        {linkTitles.length > 0 ? (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <span className="text-[11px] uppercase tracking-wider text-crt-muted">Link</span>
            <LinkSelect options={linkTitles} selected={activeFilter} onChange={setLinkFilter} />
          </div>
        ) : null}

        {visibleMonth ? (
          <div>
            {(() => {
              const later = visibleMonth;
              const earlier = shiftMonth(later.year, later.month, -1);
              const current = parseMonthKey(payload.today.targetDate);
              const atCurrent = later.year === current.year && later.month === current.month;
              return (
                <>
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      aria-label="Previous months"
                      onClick={() => shiftVisibleMonth(-1)}
                      className="inline-flex size-7 items-center justify-center rounded-sm border border-crt-border text-crt-phosphor hover:border-crt-phosphor-dim hover:text-crt-phosphor-bright"
                    >
                      <ChevronLeft className="size-3.5" strokeWidth={1.75} aria-hidden="true" />
                    </button>
                    <p className="text-[11px] text-crt-phosphor-bright">{spanTitle(earlier, later)}</p>
                    <button
                      type="button"
                      aria-label="Next months"
                      disabled={atCurrent}
                      onClick={() => shiftVisibleMonth(1)}
                      className="inline-flex size-7 items-center justify-center rounded-sm border border-crt-border text-crt-phosphor hover:border-crt-phosphor-dim hover:text-crt-phosphor-bright disabled:pointer-events-none disabled:opacity-40"
                    >
                      <ChevronRight className="size-3.5" strokeWidth={1.75} aria-hidden="true" />
                    </button>
                  </div>
                  <SpanGrid
                    earlier={earlier}
                    later={later}
                    today={payload.today.targetDate}
                    days={calendarDays}
                    selectedDate={selectedDate ?? ""}
                    onSelect={setSelectedDate}
                  />
                </>
              );
            })()}
          </div>
        ) : null}

        {visibleMonth && progressRange && progressRows.length > 0 ? (
          <div className="space-y-2">
            <p className="text-[11px] uppercase tracking-wider text-crt-muted">
              Progress · {monthName(visibleMonth.year, visibleMonth.month)} {visibleMonth.year}
            </p>
            <ul className="space-y-2">
              {progressRows.map((row) => {
                const percent = row.totalDays > 0 ? Math.round((row.doneDays / row.totalDays) * 100) : 0;
                return (
                  <li key={row.title} className="space-y-1">
                    <div className="flex items-baseline justify-between gap-3 text-sm">
                      <span className="min-w-0 truncate text-crt-phosphor-bright">{row.title}</span>
                      <span className="shrink-0 text-[11px] tabular-nums text-crt-muted">
                        {row.doneDays}/{row.totalDays} days
                        <span className="mx-1.5">·</span>
                        Streak {row.currentStreak}
                      </span>
                    </div>
                    <div
                      role="progressbar"
                      aria-label={`${row.title} progress`}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={percent}
                      className="h-1.5 w-full overflow-hidden rounded-sm bg-crt-bar-track"
                    >
                      <div
                        className="h-full bg-crt-phosphor transition-[width]"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}

        <div>
          {selected ? (
          <div className="mb-2 flex items-baseline justify-between gap-3">
            <h3 className="text-sm font-medium text-crt-phosphor-bright">
              {formatChainDate(selected.targetDate)}
              {isToday ? " · today" : ""}
            </h3>
            <p className="text-[11px] uppercase tracking-wider text-crt-muted">
              {isFuture ? "Repeats" : statusLabel(selected.status)}
              {editable ? "" : " · read only"}
            </p>
          </div>
          ) : (
            <p className="text-sm text-crt-muted">Select a day.</p>
          )}

          {selected && selected.items.length === 0 ? (
            <p className="text-sm text-crt-muted">
              {editable
                ? "Add a link once. It shows on every day, unchecked until you mark it."
                : "No links on this day."}
            </p>
          ) : selected && visibleItems.length === 0 ? (
            <p className="text-sm text-crt-muted">None of the selected links are on this day.</p>
          ) : selected ? (
            <ul className="space-y-1">
              {visibleItems.map((item) => (
                <li key={item.id} className="flex items-start gap-2 rounded-sm px-1 py-1">
                  <label className="flex min-w-0 flex-1 items-start gap-3">
                    <input
                      type="checkbox"
                      className="mt-1 size-4 shrink-0 rounded border-crt-border accent-[var(--crt-phosphor)] disabled:cursor-default"
                      checked={item.isDone}
                      disabled={!editable}
                      onChange={() => toggleItem(item.id)}
                    />
                    <span
                      className={`text-sm leading-snug ${
                        item.isDone ? "text-crt-muted line-through" : "text-crt-phosphor-bright"
                      }`}
                    >
                      {item.title}
                    </span>
                  </label>
                  {editable ? (
                    <button
                      type="button"
                      aria-label={`Remove ${item.title}`}
                      onClick={() => deleteItem(item.id)}
                      className="inline-flex size-8 shrink-0 items-center justify-center rounded-sm text-crt-danger hover:bg-crt-bar-track"
                    >
                      <X className="size-4" strokeWidth={1.75} aria-hidden="true" />
                    </button>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : null}

          {editable ? (
            <form onSubmit={addItem} className="mt-3 flex flex-col gap-2 sm:flex-row">
              <input
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                maxLength={255}
                placeholder="Add a link"
                aria-label="New chain link"
                className="w-full rounded-sm px-3 py-2 text-sm crt-input"
              />
              <button
                type="submit"
                disabled={!draft.trim()}
                className="rounded-sm px-4 py-2 text-sm crt-btn disabled:pointer-events-none disabled:opacity-50"
              >
                Add
              </button>
            </form>
          ) : null}

          {error ? <p className="mt-3 text-sm text-crt-danger">{error}</p> : null}
        </div>
      </div>
    </SectionBox>
  );
}
