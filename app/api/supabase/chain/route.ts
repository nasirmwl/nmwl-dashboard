import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

import {
  currentStreak,
  nextLongestStreak,
  statusForDay,
  todayUtcISO,
  type ChainDayView,
  type ChainItemView,
  type ChainPayload,
  type ChainStatus,
} from "@/lib/chain";

const supabaseUrl = "https://zgkrelbxmwsidhbsoowb.supabase.co";
const supabaseKey = "sb_publishable_xzfyp23xWPwl4CKT0v4F8w_nL20TZcv";

const supabase = createClient(supabaseUrl, supabaseKey);

export const dynamic = "force-dynamic";

type ItemRow = {
  id: string;
  title: string;
  is_done: boolean;
  sort_order: number;
};

type ChainRow = {
  id: string;
  target_date: string;
  status: ChainStatus;
  completed_at: string | null;
  chain_items: ItemRow[] | null;
};

type TrackerRow = {
  id: string;
  title: string;
  current_streak: number;
  longest_streak: number;
};

function isoDate(value: string): string {
  return value.slice(0, 10);
}

function toItem(row: ItemRow): ChainItemView {
  return {
    id: row.id,
    title: row.title,
    isDone: row.is_done,
    sortOrder: row.sort_order,
  };
}

function toDay(row: ChainRow, today: string): ChainDayView {
  const items = (row.chain_items ?? [])
    .slice()
    .sort((a, b) => a.sort_order - b.sort_order || a.id.localeCompare(b.id))
    .map(toItem);
  return {
    id: row.id,
    targetDate: isoDate(row.target_date),
    status: statusForDay(isoDate(row.target_date), today, items),
    completedAt: row.completed_at,
    items,
  };
}

async function loadTracker(): Promise<TrackerRow> {
  const { data, error } = await supabase
    .from("chain_tracker")
    .select("id, title, current_streak, longest_streak")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (data) return data as TrackerRow;

  const inserted = await supabase
    .from("chain_tracker")
    .insert({ title: "Main Chain" })
    .select("id, title, current_streak, longest_streak")
    .single();

  if (inserted.error || !inserted.data) {
    throw new Error(inserted.error?.message ?? "Could not create chain tracker");
  }
  return inserted.data as TrackerRow;
}

async function loadChains(trackerId: string): Promise<ChainRow[]> {
  const { data, error } = await supabase
    .from("chains")
    .select("id, target_date, status, completed_at, chain_items(id, title, is_done, sort_order)")
    .eq("tracker_id", trackerId)
    .order("target_date", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as ChainRow[];
}

type TemplateRow = {
  id: string;
  title: string;
  sort_order: number;
};

async function ensureToday(trackerId: string, today: string): Promise<void> {
  const existing = await supabase
    .from("chains")
    .select("id")
    .eq("tracker_id", trackerId)
    .eq("target_date", today)
    .maybeSingle();

  if (existing.error) throw new Error(existing.error.message);
  if (existing.data) return;

  const inserted = await supabase
    .from("chains")
    .insert({ tracker_id: trackerId, target_date: today, status: "pending" })
    .select("id")
    .single();

  if (inserted.error && inserted.error.code !== "23505") {
    throw new Error(inserted.error.message);
  }
}

async function loadTemplates(trackerId: string): Promise<TemplateRow[]> {
  const { data, error } = await supabase
    .from("chain_templates")
    .select("id, title, sort_order")
    .eq("tracker_id", trackerId)
    .order("sort_order", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as TemplateRow[];
}

/** Keep titles already checked on any day as the standing list. */
async function seedTemplates(trackerId: string, rows: ChainRow[]): Promise<void> {
  const existing = await loadTemplates(trackerId);
  const have = new Set(existing.map((template) => template.title));
  const pending: { title: string; sort_order: number }[] = [];

  for (const row of rows) {
    for (const item of row.chain_items ?? []) {
      if (have.has(item.title)) continue;
      have.add(item.title);
      pending.push({ title: item.title, sort_order: item.sort_order });
    }
  }

  if (pending.length === 0) return;

  const inserted = await supabase.from("chain_templates").insert(
    pending.map((item) => ({
      tracker_id: trackerId,
      title: item.title,
      sort_order: item.sort_order,
    })),
  );
  if (inserted.error) throw new Error(inserted.error.message);
}

/** Every stored day gets every standing link. New copies start unchecked. */
async function fillTemplateItems(templates: TemplateRow[], rows: ChainRow[]): Promise<void> {
  const missing: {
    chain_id: string;
    title: string;
    is_done: boolean;
    sort_order: number;
  }[] = [];

  for (const row of rows) {
    const have = new Set((row.chain_items ?? []).map((item) => item.title));
    for (const template of templates) {
      if (have.has(template.title)) continue;
      missing.push({
        chain_id: row.id,
        title: template.title,
        is_done: false,
        sort_order: template.sort_order,
      });
    }
  }

  if (missing.length === 0) return;
  const inserted = await supabase.from("chain_items").insert(missing);
  if (inserted.error) throw new Error(inserted.error.message);
}

async function persistDay(day: ChainDayView, stored: ChainRow): Promise<void> {
  const stayDone = day.status === "done" && stored.status === "done" && stored.completed_at;
  if (stayDone) return;

  const unchanged =
    stored.status === day.status &&
    (day.status === "done" ? Boolean(stored.completed_at) : stored.completed_at == null);
  if (unchanged) return;

  const completedAt = day.status === "done" ? stored.completed_at ?? new Date().toISOString() : null;
  const { error } = await supabase
    .from("chains")
    .update({ status: day.status, completed_at: completedAt })
    .eq("id", day.id);

  if (error) throw new Error(error.message);
  day.completedAt = completedAt;
}

async function syncChain(): Promise<ChainPayload> {
  const today = todayUtcISO();
  const tracker = await loadTracker();
  await ensureToday(tracker.id, today);

  let rows = await loadChains(tracker.id);
  await seedTemplates(tracker.id, rows);
  const templates = await loadTemplates(tracker.id);
  await fillTemplateItems(templates, rows);
  rows = await loadChains(tracker.id);

  const days = rows.map((row) => toDay(row, today));
  await Promise.all(
    days.map((day, index) => persistDay(day, rows[index])),
  );

  const streak = currentStreak(days, today);
  const longest = nextLongestStreak(tracker.longest_streak, streak);
  if (streak !== tracker.current_streak || longest !== tracker.longest_streak) {
    const { error } = await supabase
      .from("chain_tracker")
      .update({
        current_streak: streak,
        longest_streak: longest,
        updated_at: new Date().toISOString(),
      })
      .eq("id", tracker.id);
    if (error) throw new Error(error.message);
  }

  const todayDay = days.find((day) => day.targetDate === today);
  if (!todayDay) throw new Error("Today is missing from the chain");

  return {
    tracker: {
      id: tracker.id,
      title: tracker.title,
      currentStreak: streak,
      longestStreak: longest,
    },
    days,
    today: todayDay,
    templates: templates.map((template) => ({
      id: template.id,
      title: template.title,
      sortOrder: template.sort_order,
    })),
  };
}

async function todayChainId(trackerId: string, today: string): Promise<string> {
  const { data, error } = await supabase
    .from("chains")
    .select("id")
    .eq("tracker_id", trackerId)
    .eq("target_date", today)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw new Error("Today's chain is missing");
  return data.id as string;
}

export async function GET() {
  try {
    return NextResponse.json(await syncChain());
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("chain GET error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

type ChainAction =
  | { action: "toggle"; itemId: string }
  | { action: "add"; title: string }
  | { action: "delete"; itemId: string };

function readAction(body: unknown): ChainAction | null {
  if (!body || typeof body !== "object") return null;
  const record = body as Record<string, unknown>;
  if (record.action === "add") {
    if (typeof record.title !== "string") return null;
    const title = record.title.trim();
    if (!title || title.length > 255) return null;
    return { action: "add", title };
  }
  if (record.action === "toggle" || record.action === "delete") {
    if (typeof record.itemId !== "string" || !record.itemId) return null;
    return { action: record.action, itemId: record.itemId };
  }
  return null;
}

export async function POST(request: Request) {
  try {
    const action = readAction(await request.json());
    if (!action) {
      return NextResponse.json(
        { error: "action must be toggle, add, or delete" },
        { status: 400 },
      );
    }

    const today = todayUtcISO();
    const tracker = await loadTracker();
    await ensureToday(tracker.id, today);
    const chainId = await todayChainId(tracker.id, today);

    if (action.action === "add") {
      const templates = await loadTemplates(tracker.id);
      if (templates.some((template) => template.title === action.title)) {
        return NextResponse.json({ error: "That link is already on the chain" }, { status: 400 });
      }
      const sortOrder = templates.reduce((max, template) => Math.max(max, template.sort_order), -1) + 1;
      const inserted = await supabase.from("chain_templates").insert({
        tracker_id: tracker.id,
        title: action.title,
        sort_order: sortOrder,
      });
      if (inserted.error) throw new Error(inserted.error.message);
    } else {
      const item = await supabase
        .from("chain_items")
        .select("id, title, is_done, chain_id")
        .eq("id", action.itemId)
        .maybeSingle();
      if (item.error) throw new Error(item.error.message);
      if (!item.data || item.data.chain_id !== chainId) {
        return NextResponse.json(
          { error: "That link is not on today's chain" },
          { status: 400 },
        );
      }

      if (action.action === "toggle") {
        const updated = await supabase
          .from("chain_items")
          .update({ is_done: !item.data.is_done })
          .eq("id", action.itemId);
        if (updated.error) throw new Error(updated.error.message);
      } else {
        const chains = await supabase.from("chains").select("id").eq("tracker_id", tracker.id);
        if (chains.error) throw new Error(chains.error.message);
        const chainIds = (chains.data ?? []).map((row) => row.id as string);
        const removedItems = await supabase
          .from("chain_items")
          .delete()
          .in("chain_id", chainIds)
          .eq("title", item.data.title);
        if (removedItems.error) throw new Error(removedItems.error.message);
        const removedTemplate = await supabase
          .from("chain_templates")
          .delete()
          .eq("tracker_id", tracker.id)
          .eq("title", item.data.title);
        if (removedTemplate.error) throw new Error(removedTemplate.error.message);
      }
    }

    return NextResponse.json(await syncChain());
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("chain POST error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
