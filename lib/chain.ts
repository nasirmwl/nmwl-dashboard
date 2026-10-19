/** Daily chain: a day holds only when every link is checked. Streaks ignore today while it is still open. */

export const CHAIN_WINDOW_DAYS = 21;

export type ChainStatus = "done" | "broken" | "pending";

export type ChainItemView = {
  id: string;
  title: string;
  isDone: boolean;
  sortOrder: number;
};

export type ChainDayView = {
  id: string | null;
  targetDate: string;
  status: ChainStatus;
  completedAt: string | null;
  items: ChainItemView[];
};

export type ChainTrackerView = {
  id: string;
  title: string;
  currentStreak: number;
  longestStreak: number;
};

export type ChainTemplateView = {
  id: string;
  title: string;
  sortOrder: number;
};

export type ChainPayload = {
  tracker: ChainTrackerView;
  days: ChainDayView[];
  today: ChainDayView;
  templates: ChainTemplateView[];
};

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function todayUtcISO(now = new Date()): string {
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, "0");
  const d = String(now.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function addUtcDays(isoDate: string, delta: number): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  return todayUtcISO(new Date(Date.UTC(y, m - 1, d + delta)));
}

/** Last `n` UTC dates ending on `today`, oldest first. */
export function lastNDatesEnding(today: string, n: number): string[] {
  const dates: string[] = [];
  for (let i = n - 1; i >= 0; i -= 1) {
    dates.push(addUtcDays(today, -i));
  }
  return dates;
}

/** Finished only when the day has at least one link and every link is checked. */
export function dayIsFinished(items: { isDone: boolean }[]): boolean {
  return items.length > 0 && items.every((item) => item.isDone);
}

export function statusForDay(
  targetDate: string,
  today: string,
  items: { isDone: boolean }[],
): ChainStatus {
  if (dayIsFinished(items)) return "done";
  if (targetDate < today) return "broken";
  return "pending";
}

/**
 * Consecutive `done` days.
 * Today still `pending` does not break the run: counting starts at yesterday.
 * A missing date or any non-done day stops the walk. A broken today is zero.
 */
export function currentStreak(
  rows: { targetDate: string; status: ChainStatus }[],
  today: string,
): number {
  const byDate = new Map(rows.map((row) => [row.targetDate, row.status]));
  const todayStatus = byDate.get(today);
  if (todayStatus === "broken") return 0;

  let cursor = todayStatus === "done" ? today : addUtcDays(today, -1);
  let streak = 0;
  while (byDate.get(cursor) === "done") {
    streak += 1;
    cursor = addUtcDays(cursor, -1);
  }
  return streak;
}

export function nextLongestStreak(stored: number, current: number): number {
  return Math.max(stored, current);
}

/** The line between two links stays lit only while the run is still intact. */
export function linkContinues(previous: ChainStatus, current: ChainStatus): boolean {
  return previous === "done" && (current === "done" || current === "pending");
}

export function isIsoDate(value: string): boolean {
  return ISO_DATE.test(value);
}

export function monthKey(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, "0")}`;
}

export function parseMonthKey(today: string): { year: number; month: number } {
  const [year, month] = today.split("-").map(Number);
  return { year, month };
}

export function shiftMonth(year: number, month: number, delta: number): { year: number; month: number } {
  const next = new Date(Date.UTC(year, month - 1 + delta, 1));
  return { year: next.getUTCFullYear(), month: next.getUTCMonth() + 1 };
}

/** Monday-first weeks from the 1st of the start month through the last day of the end month. */
export function spanWeeks(
  startYear: number,
  startMonth: number,
  endYear: number,
  endMonth: number,
): (string | null)[][] {
  const start = `${startYear}-${String(startMonth).padStart(2, "0")}-01`;
  const lastDay = new Date(Date.UTC(endYear, endMonth, 0)).getUTCDate();
  const end = `${endYear}-${String(endMonth).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  const firstDow = new Date(Date.UTC(startYear, startMonth - 1, 1)).getUTCDay();
  const leading = (firstDow + 6) % 7;
  const cells: (string | null)[] = [...Array<string | null>(leading).fill(null)];
  let cursor = start;
  while (cursor <= end) {
    cells.push(cursor);
    cursor = addUtcDays(cursor, 1);
  }
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks: (string | null)[][] = [];
  for (let index = 0; index < cells.length; index += 7) {
    weeks.push(cells.slice(index, index + 7));
  }
  return weeks;
}

/** Monday-first weeks for a calendar month. `null` pads days outside the month. */
export function monthWeeks(year: number, month: number): (string | null)[][] {
  const firstDow = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
  const leading = (firstDow + 6) % 7;
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const cells: (string | null)[] = [
    ...Array<string | null>(leading).fill(null),
    ...Array.from({ length: daysInMonth }, (_, index) => {
      const day = String(index + 1).padStart(2, "0");
      return `${year}-${String(month).padStart(2, "0")}-${day}`;
    }),
  ];
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks: (string | null)[][] = [];
  for (let index = 0; index < cells.length; index += 7) {
    weeks.push(cells.slice(index, index + 7));
  }
  return weeks;
}

export function chainStartedOn(rows: { targetDate: string }[]): string | null {
  if (rows.length === 0) return null;
  return rows.reduce(
    (earliest, row) => (row.targetDate < earliest ? row.targetDate : earliest),
    rows[0].targetDate,
  );
}

export type ChainDayPlace = "held" | "open" | "broken" | "future" | "before";

export function chainJoins(previous: ChainDayPlace, current: ChainDayPlace): boolean {
  return previous === "held" && (current === "held" || current === "open");
}

export function placeForDate(
  targetDate: string,
  today: string,
  rows: ChainDayView[],
  startedOn: string | null,
): ChainDayPlace {
  const row = rows.find((item) => item.targetDate === targetDate);
  if (targetDate > today && row?.status !== "done") return "future";
  if (!row && startedOn && targetDate < startedOn) return "before";
  if (row?.status === "done") return "held";
  if (targetDate === today) return "open";
  return "broken";
}

export function dayOn(
  today: string,
  rows: ChainDayView[],
  targetDate: string,
  templates: ChainTemplateView[] = [],
): ChainDayView {
  const row = rows.find((item) => item.targetDate === targetDate);
  if (row) return row;
  return {
    id: null,
    targetDate,
    status: targetDate < today ? "broken" : "pending",
    completedAt: null,
    items: templates.map((template) => ({
      id: template.id,
      title: template.title,
      isDone: false,
      sortOrder: template.sortOrder,
    })),
  };
}

/** Fill the visible strip. A past day with no row is broken and is not stored. */
export function chainWindow(
  today: string,
  rows: ChainDayView[],
  windowSize = CHAIN_WINDOW_DAYS,
): ChainDayView[] {
  const byDate = new Map(rows.map((row) => [row.targetDate, row]));
  return lastNDatesEnding(today, windowSize).map((targetDate) => {
    const row = byDate.get(targetDate);
    if (row) return row;
    return {
      id: null,
      targetDate,
      status: targetDate < today ? "broken" : "pending",
      completedAt: null,
      items: [],
    };
  });
}
