import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Task logger data layer (Supabase, RLS-scoped to the signed-in user).
 *
 * Tables: task_logger_tasks, task_logger_entries (append-only minute ledger),
 * task_logger_timers (one running timer per user). See
 * supabase/migrations/20261104210000_task_logger.sql.
 */

export type Task = { id: string; name: string; createdAt: string };
export type Timer = { taskId: string; startedAt: number };
/** dateKey (YYYY-MM-DD, local) -> taskId -> minutes */
export type DayLog = Record<string, Record<string, number>>;
export type TaskLoggerData = { tasks: Task[]; log: DayLog; timer: Timer | null };

/** Pre-Supabase localStorage key (PR #1). Renamed after a successful import. */
export const LEGACY_STORAGE_KEY = "nmwl.taskLogger.v1";
const LEGACY_IMPORTED_KEY = `${LEGACY_STORAGE_KEY}.imported`;

export function dateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function shiftDays(d: Date, days: number): Date {
  const next = new Date(d);
  next.setDate(next.getDate() + days);
  return next;
}

export function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function throwIf(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

/** Tasks, the minute ledger from `fromDay` on (summed per day), and the running timer. */
export async function fetchTaskLogger(sb: SupabaseClient, fromDay: string): Promise<TaskLoggerData> {
  const [tasksRes, entriesRes, timerRes] = await Promise.all([
    sb.from("task_logger_tasks").select("id, name, created_at").order("created_at"),
    sb.from("task_logger_entries").select("task_id, day, minutes").gte("day", fromDay).limit(10000),
    sb.from("task_logger_timers").select("task_id, started_at").maybeSingle(),
  ]);
  throwIf(tasksRes.error);
  throwIf(entriesRes.error);
  throwIf(timerRes.error);

  const log: DayLog = {};
  for (const row of entriesRes.data ?? []) {
    const day = String(row.day).slice(0, 10);
    const dayLog = (log[day] ??= {});
    dayLog[row.task_id] = (dayLog[row.task_id] ?? 0) + row.minutes;
  }
  // Corrections never push a day below zero.
  for (const dayLog of Object.values(log)) {
    for (const id of Object.keys(dayLog)) dayLog[id] = Math.max(0, dayLog[id]);
  }

  return {
    tasks: (tasksRes.data ?? []).map((t) => ({
      id: t.id,
      name: t.name,
      createdAt: t.created_at,
    })),
    log,
    timer: timerRes.data
      ? { taskId: timerRes.data.task_id, startedAt: new Date(timerRes.data.started_at).getTime() }
      : null,
  };
}

export async function insertTask(sb: SupabaseClient, task: Task) {
  const { error } = await sb
    .from("task_logger_tasks")
    .insert({ id: task.id, name: task.name, created_at: task.createdAt });
  throwIf(error);
}

export async function renameTask(sb: SupabaseClient, id: string, name: string) {
  const { error } = await sb.from("task_logger_tasks").update({ name }).eq("id", id);
  throwIf(error);
}

/** Deletes the task for good; its minutes and any running timer go with it (FK cascade). */
export async function deleteTask(sb: SupabaseClient, id: string) {
  const { error } = await sb.from("task_logger_tasks").delete().eq("id", id);
  throwIf(error);
}

export async function insertEntry(sb: SupabaseClient, taskId: string, day: string, minutes: number) {
  const { error } = await sb
    .from("task_logger_entries")
    .insert({ task_id: taskId, day, minutes, source: "manual" });
  throwIf(error);
}

/** Start `taskId` (stopping & crediting any running timer), or stop it if it is the one running. */
export async function toggleTimer(sb: SupabaseClient, taskId: string) {
  const { error } = await sb.rpc("task_logger_toggle_timer", {
    p_task_id: taskId,
    p_tz_offset_minutes: new Date().getTimezoneOffset(),
  });
  throwIf(error);
}

type LegacyStore = {
  tasks?: Task[];
  log?: DayLog;
  timer?: Timer | null;
};

/**
 * One-time copy of this browser's old localStorage log into Supabase.
 *
 * Safe to retry and safe to run from several browsers: tasks are matched by
 * name (case-insensitive) so the same task logged on phone and laptop becomes
 * one task, and each (browser task, day) row has a stable import_key so it is
 * never inserted twice. Afterwards the old key is renamed, not deleted.
 *
 * Returns true if anything was imported.
 */
export async function importLegacyLocalStorage(sb: SupabaseClient): Promise<boolean> {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(LEGACY_STORAGE_KEY);
  } catch {
    return false;
  }
  if (!raw) return false;

  let legacy: LegacyStore;
  try {
    legacy = JSON.parse(raw) as LegacyStore;
  } catch {
    return false;
  }
  const legacyTasks = Array.isArray(legacy.tasks) ? legacy.tasks : [];
  const legacyLog = legacy.log && typeof legacy.log === "object" ? legacy.log : {};

  if (legacyTasks.length > 0) {
    const { data: existing, error } = await sb.from("task_logger_tasks").select("id, name");
    throwIf(error);
    const idByName = new Map((existing ?? []).map((t) => [t.name.toLowerCase(), t.id as string]));
    const idMap = new Map<string, string>();
    const toInsert: { id: string; name: string; created_at: string }[] = [];

    for (const t of legacyTasks) {
      const name = String(t.name ?? "").trim().slice(0, 80);
      if (!t.id || !name) continue;
      const match = idByName.get(name.toLowerCase());
      if (match) {
        idMap.set(t.id, match);
      } else {
        idMap.set(t.id, t.id);
        idByName.set(name.toLowerCase(), t.id);
        toInsert.push({ id: t.id, name, created_at: t.createdAt ?? new Date().toISOString() });
      }
    }

    if (toInsert.length > 0) {
      const res = await sb
        .from("task_logger_tasks")
        .upsert(toInsert, { onConflict: "id", ignoreDuplicates: true });
      throwIf(res.error);
    }

    const entries: { task_id: string; day: string; minutes: number; source: string; import_key: string }[] = [];
    for (const [day, dayLog] of Object.entries(legacyLog)) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || !dayLog) continue;
      for (const [legacyId, mins] of Object.entries(dayLog)) {
        const taskId = idMap.get(legacyId);
        const minutes = Math.min(1440, Math.round(Number(mins)));
        if (!taskId || !(minutes > 0)) continue;
        entries.push({ task_id: taskId, day, minutes, source: "import", import_key: `${legacyId}:${day}` });
      }
    }
    if (entries.length > 0) {
      const res = await sb
        .from("task_logger_entries")
        .upsert(entries, { onConflict: "import_key", ignoreDuplicates: true });
      throwIf(res.error);
    }

    // Carry over a running timer only if none is running in the cloud yet.
    const timerTask = legacy.timer ? idMap.get(legacy.timer.taskId) : undefined;
    if (legacy.timer && timerTask) {
      const res = await sb.from("task_logger_timers").upsert(
        { task_id: timerTask, started_at: new Date(legacy.timer.startedAt).toISOString() },
        { onConflict: "user_id", ignoreDuplicates: true },
      );
      throwIf(res.error);
    }
  }

  try {
    window.localStorage.setItem(LEGACY_IMPORTED_KEY, raw);
    window.localStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch {
    /* ignore: import_keys keep a retry harmless */
  }
  return legacyTasks.length > 0;
}
