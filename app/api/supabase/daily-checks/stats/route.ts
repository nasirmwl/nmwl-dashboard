import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

import { dailyCheckRowToEntry } from "@/lib/daily-checks-row";
import type { DayEntry } from "@/lib/daily-checks-schema";
import {
  getLastNDatesUtcEndingToday,
  normalizeEntryDate,
} from "@/lib/date-window";
import {
  GROWTH_STATS_WINDOW_DAYS,
  growthStatsFromRowDays,
  SCORING_VERSION,
} from "@/lib/growth-stats";

const supabaseUrl = "https://zgkrelbxmwsidhbsoowb.supabase.co";
const supabaseKey = "sb_publishable_xzfyp23xWPwl4CKT0v4F8w_nL20TZcv";

const supabase = createClient(supabaseUrl, supabaseKey);

export const dynamic = "force-dynamic";

const TABLE = "daily_checks";

/** GET → weighted stats for last N UTC calendar days, strict denominator */
export async function GET() {
  try {
    const calendarDates = getLastNDatesUtcEndingToday(GROWTH_STATS_WINDOW_DAYS);
    const windowStart = calendarDates[0];
    const windowEnd = calendarDates[calendarDates.length - 1];
    const dateSet = new Set(calendarDates);

    const { data, error } = await supabase
      .from(TABLE)
      .select("*")
      .gte("entry_date", windowStart)
      .lte("entry_date", windowEnd)
      .order("entry_date", { ascending: true });

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const rowDays: { entryDate: string; entry: DayEntry }[] = [];
    const loggedDates = new Set<string>();

    for (const row of data ?? []) {
      const r = row as Record<string, unknown>;
      const rawDate = String(r.entry_date ?? "");
      const entryDate = normalizeEntryDate(rawDate);
      if (!dateSet.has(entryDate)) continue;
      rowDays.push({
        entryDate,
        entry: dailyCheckRowToEntry(r),
      });
      loggedDates.add(entryDate);
    }

    const stats = growthStatsFromRowDays(rowDays, calendarDates);

    return NextResponse.json({
      scoringVersion: SCORING_VERSION,
      windowStart,
      windowEnd,
      windowDays: calendarDates.length,
      loggedDaysInWindow: loggedDates.size,
      stats,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("daily-checks stats GET error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
