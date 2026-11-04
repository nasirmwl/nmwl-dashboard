"use client";

import { Pause, Pencil, Play, Plus } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState, useSyncExternalStore } from "react";

import SectionBox from "./SectionBox";

/**
 * Daily task logger — localStorage only.
 *
 * Tasks are permanent (never deleted). Minutes are stored per local calendar
 * day, so "today" starts from zero every midnight while past days stay in
 * storage as history (used for the yesterday / 7-day hints).
 */

const STORAGE_KEY = "nmwl.taskLogger.v1";
const QUICK_ADD = [5, 15, 25, 45] as const;

type Task = { id: string; name: string; createdAt: string };
type Timer = { taskId: string; startedAt: number };
type Store = {
  tasks: Task[];
  /** dateKey (YYYY-MM-DD, local) -> taskId -> minutes */
  log: Record<string, Record<string, number>>;
  timer: Timer | null;
};

const EMPTY: Store = { tasks: [], log: {}, timer: null };

function dateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function shiftDays(d: Date, days: number): Date {
  const next = new Date(d);
  next.setDate(next.getDate() + days);
  return next;
}

function parseStore(raw: string | null): Store {
  if (!raw) return EMPTY;
  try {
    const parsed = JSON.parse(raw) as Partial<Store>;
    return {
      tasks: Array.isArray(parsed.tasks) ? parsed.tasks : [],
      log: parsed.log && typeof parsed.log === "object" ? parsed.log : {},
      timer: parsed.timer ?? null,
    };
  } catch {
    return EMPTY;
  }
}

// --- tiny localStorage-backed external store (works with useSyncExternalStore) ---
const listeners = new Set<() => void>();
let cache: { raw: string | null; store: Store } = { raw: null, store: EMPTY };
let memoryRaw: string | null = null; // fallback when storage is blocked

function readRaw(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return memoryRaw;
  }
}

function getSnapshot(): Store {
  const raw = readRaw();
  if (raw !== cache.raw) cache = { raw, store: parseStore(raw) };
  return cache.store;
}

function getServerSnapshot(): Store | null {
  return null;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function updateStore(fn: (s: Store) => Store) {
  const raw = JSON.stringify(fn(getSnapshot()));
  memoryRaw = raw;
  try {
    window.localStorage.setItem(STORAGE_KEY, raw);
  } catch {
    /* storage full / blocked — memoryRaw keeps this session working */
  }
  listeners.forEach((l) => l());
}

function addMinutes(
  log: Store["log"],
  day: string,
  taskId: string,
  delta: number,
): Store["log"] {
  const dayLog = { ...(log[day] ?? {}) };
  dayLog[taskId] = Math.max(0, (dayLog[taskId] ?? 0) + delta);
  return { ...log, [day]: dayLog };
}

/** Credit a finished timer run, splitting it across midnights if needed. */
function creditTimer(log: Store["log"], timer: Timer, endMs: number): Store["log"] {
  let next = log;
  let cursor = timer.startedAt;
  while (cursor < endMs) {
    const start = new Date(cursor);
    const midnight = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 1).getTime();
    const segmentEnd = Math.min(midnight, endMs);
    const minutes = Math.round((segmentEnd - cursor) / 60000);
    if (minutes > 0) next = addMinutes(next, dateKey(start), timer.taskId, minutes);
    cursor = segmentEnd;
  }
  return next;
}

function formatMinutes(total: number): string {
  if (total <= 0) return "0m";
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h === 0) return `${m}m`;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

function formatClock(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const mm = String(m).padStart(2, "0");
  const ss = String(sec).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export default function TaskLoggerSection() {
  const snapshot = useSyncExternalStore<Store | null>(subscribe, getSnapshot, getServerSnapshot);
  const ready = snapshot !== null;
  const store = snapshot ?? EMPTY;
  const [now, setNow] = useState(() => Date.now());
  const [newTaskName, setNewTaskName] = useState("");
  const [customMinutes, setCustomMinutes] = useState<Record<string, string>>({});
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  // Tick every second while a timer runs, otherwise every 30s (for midnight rollover).
  const timerRunning = store.timer !== null;
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), timerRunning ? 1000 : 30000);
    const onVisible = () => setNow(Date.now());
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [timerRunning]);

  const update = updateStore;

  const today = dateKey(new Date(now));
  const todayLog = useMemo(() => store.log[today] ?? {}, [store.log, today]);
  const yesterdayLog = store.log[dateKey(shiftDays(new Date(now), -1))] ?? {};

  const weekTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    for (let i = 0; i < 7; i++) {
      const day = store.log[dateKey(shiftDays(new Date(now), -i))] ?? {};
      for (const [taskId, mins] of Object.entries(day)) {
        totals[taskId] = (totals[taskId] ?? 0) + mins;
      }
    }
    return totals;
  }, [store.log, now]);

  const liveMinutes = (taskId: string) =>
    store.timer?.taskId === taskId
      ? Math.floor((now - Math.max(store.timer.startedAt, new Date(now).setHours(0, 0, 0, 0))) / 60000)
      : 0;

  const todayTotal =
    Object.values(todayLog).reduce((a, b) => a + b, 0) +
    (store.timer ? liveMinutes(store.timer.taskId) : 0);

  // Today's active tasks float to the top; the rest keep creation order.
  const orderedTasks = useMemo(() => {
    return [...store.tasks].sort((a, b) => {
      const am = (todayLog[a.id] ?? 0) + (store.timer?.taskId === a.id ? 1 : 0);
      const bm = (todayLog[b.id] ?? 0) + (store.timer?.taskId === b.id ? 1 : 0);
      if ((am > 0) !== (bm > 0)) return am > 0 ? -1 : 1;
      return a.createdAt.localeCompare(b.createdAt);
    });
  }, [store.tasks, todayLog, store.timer]);

  const handleAddTask = (e: FormEvent) => {
    e.preventDefault();
    const name = newTaskName.trim();
    if (!name) return;
    if (store.tasks.some((t) => t.name.toLowerCase() === name.toLowerCase())) {
      setNewTaskName("");
      return;
    }
    update((s) => ({
      ...s,
      tasks: [...s.tasks, { id: newId(), name, createdAt: new Date().toISOString() }],
    }));
    setNewTaskName("");
  };

  const logMinutes = (taskId: string, delta: number) => {
    if (!Number.isFinite(delta) || delta === 0) return;
    update((s) => ({ ...s, log: addMinutes(s.log, dateKey(new Date()), taskId, Math.round(delta)) }));
  };

  const submitCustom = (taskId: string) => {
    const value = Number(customMinutes[taskId]);
    if (!value) return;
    logMinutes(taskId, value);
    setCustomMinutes((c) => ({ ...c, [taskId]: "" }));
  };

  const toggleTimer = (taskId: string) => {
    update((s) => {
      const end = Date.now();
      let log = s.log;
      if (s.timer) log = creditTimer(log, s.timer, end);
      const stoppingSame = s.timer?.taskId === taskId;
      return { ...s, log, timer: stoppingSame ? null : { taskId, startedAt: end } };
    });
  };

  const saveRename = (taskId: string) => {
    const name = renameValue.trim();
    if (name) {
      update((s) => ({
        ...s,
        tasks: s.tasks.map((t) => (t.id === taskId ? { ...t, name } : t)),
      }));
    }
    setRenamingId(null);
  };

  if (!ready) {
    return (
      <SectionBox title="Today's log">
        <div className="animate-pulse h-32 bg-crt-bar-track/40 rounded-sm" />
      </SectionBox>
    );
  }

  const maxToday = Math.max(1, ...store.tasks.map((t) => (todayLog[t.id] ?? 0) + liveMinutes(t.id)));

  return (
    <SectionBox title="Today's log">
      <div className="mb-4 flex items-baseline justify-between gap-3 crt-text-plain">
        <span className="text-sm text-crt-muted">
          {new Date(now).toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "short" })}
          <span className="ml-2 text-xs text-crt-phosphor-dim">resets at midnight</span>
        </span>
        <span className="text-lg font-bold text-crt-phosphor-bright tabular-nums">
          {formatMinutes(todayTotal)}
        </span>
      </div>

      <form onSubmit={handleAddTask} className="mb-4 flex gap-2">
        <input
          value={newTaskName}
          onChange={(e) => setNewTaskName(e.target.value)}
          placeholder="New task (e.g. Deep work, Reading)…"
          className="min-w-0 flex-1 px-3 py-2 crt-input rounded-sm text-sm"
          maxLength={80}
        />
        <button
          type="submit"
          className="flex items-center gap-1 px-3 py-2 crt-btn crt-btn-primary rounded-sm text-sm min-h-[40px]"
          aria-label="Add task"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Add</span>
        </button>
      </form>

      {store.tasks.length === 0 ? (
        <p className="py-8 text-center text-sm text-crt-muted crt-text-plain">
          No tasks yet. Add one above — tasks stay forever, minutes reset daily.
        </p>
      ) : (
        <ul className="space-y-2">
          {orderedTasks.map((task) => {
            const live = liveMinutes(task.id);
            const mins = (todayLog[task.id] ?? 0) + live;
            const running = store.timer?.taskId === task.id;
            const yesterday = yesterdayLog[task.id] ?? 0;
            const week = (weekTotals[task.id] ?? 0) + live;
            const idle = mins === 0 && !running;

            return (
              <li
                key={task.id}
                className={`rounded-sm border p-3 crt-text-plain transition-colors ${
                  running
                    ? "border-crt-phosphor bg-crt-bar-track/60"
                    : "border-crt-border bg-crt-bar-track/30 hover:border-crt-phosphor-dim"
                } ${idle ? "opacity-70" : ""}`}
              >
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => toggleTimer(task.id)}
                    aria-label={running ? `Stop timer for ${task.name}` : `Start timer for ${task.name}`}
                    className={`inline-flex size-8 shrink-0 items-center justify-center rounded-sm border transition-colors ${
                      running
                        ? "border-crt-phosphor text-crt-phosphor-bright"
                        : "border-crt-border text-crt-phosphor hover:border-crt-phosphor-dim"
                    }`}
                  >
                    {running ? <Pause className="size-4" /> : <Play className="size-4" />}
                  </button>

                  {renamingId === task.id ? (
                    <input
                      autoFocus
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onBlur={() => saveRename(task.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveRename(task.id);
                        if (e.key === "Escape") setRenamingId(null);
                      }}
                      className="min-w-0 flex-1 px-2 py-1 crt-input rounded-sm text-sm"
                      maxLength={80}
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setRenamingId(task.id);
                        setRenameValue(task.name);
                      }}
                      className="group flex min-w-0 flex-1 items-center gap-1.5 text-left"
                      title="Rename"
                    >
                      <span className="truncate text-crt-phosphor-bright">{task.name}</span>
                      <Pencil className="size-3 shrink-0 text-crt-phosphor-dim opacity-0 group-hover:opacity-100" />
                    </button>
                  )}

                  <span className="shrink-0 text-right tabular-nums">
                    {running && store.timer && (
                      <span className="mr-2 text-xs text-crt-phosphor">
                        ● {formatClock(now - store.timer.startedAt)}
                      </span>
                    )}
                    <span className="font-bold text-crt-phosphor-bright">{formatMinutes(mins)}</span>
                  </span>
                </div>

                <div className="mt-2 h-1 w-full overflow-hidden rounded-sm bg-crt-bar-track">
                  <div
                    className="h-full bg-crt-phosphor transition-[width] duration-300"
                    style={{ width: `${(mins / maxToday) * 100}%` }}
                  />
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  {QUICK_ADD.map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => logMinutes(task.id, m)}
                      className="px-2 py-1 crt-btn rounded-sm text-xs tabular-nums"
                    >
                      +{m}
                    </button>
                  ))}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      submitCustom(task.id);
                    }}
                    className="flex items-center gap-1"
                  >
                    <input
                      type="number"
                      inputMode="numeric"
                      value={customMinutes[task.id] ?? ""}
                      onChange={(e) => setCustomMinutes((c) => ({ ...c, [task.id]: e.target.value }))}
                      placeholder="±min"
                      title="Minutes to add (negative to correct)"
                      className="w-16 px-2 py-1 crt-input rounded-sm text-xs"
                    />
                    <button type="submit" className="px-2 py-1 crt-btn rounded-sm text-xs">
                      log
                    </button>
                  </form>
                  <span className="ml-auto text-[11px] text-crt-muted tabular-nums">
                    yday {formatMinutes(yesterday)} · 7d {formatMinutes(week)}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </SectionBox>
  );
}
