import { DAILY_CHECK_SECTIONS, type DayEntry } from "./daily-checks-schema";

/** Map a `daily_checks` table row to nested `DayEntry` (boolean columns only). */
export function dailyCheckRowToEntry(row: Record<string, unknown>): DayEntry {
  const entry: DayEntry = {};
  for (const s of DAILY_CHECK_SECTIONS) {
    const bucket: Record<string, boolean> = {};
    for (const item of s.items) {
      bucket[item.key] = row[item.key] === true;
    }
    entry[s.section] = bucket;
  }
  return entry;
}
