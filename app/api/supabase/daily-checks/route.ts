import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

import { dailyCheckRowToEntry } from "@/lib/daily-checks-row";
import {
  countCheckedInEntry,
  DAILY_CHECK_SECTIONS,
  totalChecklistItemCount,
  type DayEntry,
} from "@/lib/daily-checks-schema";

const supabaseUrl = "https://zgkrelbxmwsidhbsoowb.supabase.co";
const supabaseKey = "sb_publishable_xzfyp23xWPwl4CKT0v4F8w_nL20TZcv";

const supabase = createClient(supabaseUrl, supabaseKey);

export const dynamic = "force-dynamic";

const TABLE = "daily_checks";

function entryToRow(
  date: string,
  entry: Record<string, Record<string, boolean> | undefined>,
): Record<string, string | boolean> {
  const row: Record<string, string | boolean> = {
    entry_date: date,
    updated_at: new Date().toISOString(),
  };
  for (const s of DAILY_CHECK_SECTIONS) {
    const sec = entry[s.section];
    for (const item of s.items) {
      row[item.key] = sec?.[item.key] === true;
    }
  }
  return row;
}

/**
 * GET ?date=YYYY-MM-DD → { entry: DayEntry | null }
 * GET ?list=true → { items: Array<{ date, updated_at, entry, checkedCount, totalCount }> }
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const list = searchParams.get("list");
    const date = searchParams.get("date");

    if (list === "true" || list === "1") {
      const { data, error } = await supabase
        .from(TABLE)
        .select("*")
        .order("entry_date", { ascending: false });

      if (error) {
        console.error("Supabase error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      const totalCount = totalChecklistItemCount();
      const items = (data ?? []).map((row) => {
        const r = row as Record<string, unknown>;
        const entry = dailyCheckRowToEntry(r);
        return {
          date: String(r.entry_date ?? ""),
          updated_at: r.updated_at != null ? String(r.updated_at) : null,
          entry,
          checkedCount: countCheckedInEntry(entry),
          totalCount,
        };
      });

      return NextResponse.json({ items });
    }

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json(
        { error: "Query param date (YYYY-MM-DD) is required, or use list=true" },
        { status: 400 },
      );
    }

    const { data, error } = await supabase.from(TABLE).select("*").eq("entry_date", date).maybeSingle();

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ entry: null });
    }

    return NextResponse.json({ entry: dailyCheckRowToEntry(data as Record<string, unknown>) });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("daily-checks GET error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** POST body: { date: string, entry: DayEntry } — booleans stored as columns */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { date, entry } = body as { date?: string; entry?: DayEntry };

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json({ error: "date (YYYY-MM-DD) is required" }, { status: 400 });
    }
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
      return NextResponse.json({ error: "entry (object) is required" }, { status: 400 });
    }

    const row = entryToRow(date, entry);

    const { error } = await supabase.from(TABLE).upsert(row, { onConflict: "entry_date" });

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("daily-checks POST error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
