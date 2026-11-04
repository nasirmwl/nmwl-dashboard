"use client";

import { Archive, ArchiveRestore, Pause, Pencil, Play, Plus, Trash2, Undo2 } from "lucide-react";
import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  dateKey,
  fetchTaskLogger,
  importLegacyLocalStorage,
  insertEntry,
  insertTask,
  newId,
  removeTask,
  renameTask,
  setTaskArchived,
  shiftDays,
  toggleTimer as toggleTimerRemote,
  type TaskLoggerData,
} from "@/lib/task-logger";
import { createClient } from "@/utils/supabase/client";

import SectionBox from "./SectionBox";

/**
 * Daily task logger, stored in Supabase (RLS: only the signed-in user's rows).
 *
 * Deleting a task with history archives it (restorable); unused tasks are removed for good. Minutes are an append-only ledger keyed
 * by local calendar day, so "today" starts from zero every midnight while past
 * days stay as history (used for the yesterday / 7-day hints). The running
 * timer lives in the database too, so it can be started on one device and
 * stopped on another; Realtime keeps every open tab in sync.
 */

const QUICK_ADD = [5, 15, 25, 45] as const;
/** How long the per-task "undo" stays visible after logging. */
const UNDO_MS = 8000;
const EMPTY: TaskLoggerData = { tasks: [], log: {}, timer: null };

type Supabase = ReturnType<typeof createClient>;

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

export default function TaskLoggerSection() {
  const sbRef = useRef<Supabase | null>(null);
  const getSb = useCallback(() => (sbRef.current ??= createClient()), []);

  const [data, setData] = useState<TaskLoggerData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const ready = data !== null;
  const store = data ?? EMPTY;
  const [now, setNow] = useState(() => Date.now());
  const [newTaskName, setNewTaskName] = useState("");
  const [customMinutes, setCustomMinutes] = useState<Record<string, string>>({});
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  /** Recent manual logs on one task (taps in a row add up), so a mis-tap can be undone in one click. */
  const [undo, setUndo] = useState<{ taskId: string; day: string; minutes: number } | null>(null);

  const today = dateKey(new Date(now));
  const fromDay = dateKey(shiftDays(new Date(now), -7));

  // Latest fetch wins; older responses that land late are dropped.
  const fetchSeq = useRef(0);
  const refresh = useCallback(async () => {
    const seq = ++fetchSeq.current;
    try {
      const next = await fetchTaskLogger(getSb(), fromDay);
      if (seq === fetchSeq.current) {
        setData(next);
        setError(null);
      }
    } catch (e) {
      if (seq === fetchSeq.current) setError(e instanceof Error ? e.message : "Failed to load");
    }
  }, [getSb, fromDay]);

  // Initial load (+ one-time import of the old localStorage log), and again whenever the day rolls over.
  const imported = useRef(false);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!imported.current) {
        imported.current = true;
        try {
          await importLegacyLocalStorage(getSb());
        } catch (e) {
          if (!cancelled) setError(`Import from this browser failed: ${e instanceof Error ? e.message : e}`);
        }
      }
      if (!cancelled) await refresh();
    })();
    return () => {
      cancelled = true;
    };
  }, [getSb, refresh]);

  // Realtime: any change from another tab/device triggers a (debounced) refetch.
  useEffect(() => {
    const sb = getSb();
    let timeout: number | undefined;
    const schedule = () => {
      window.clearTimeout(timeout);
      timeout = window.setTimeout(() => void refresh(), 250);
    };
    const channel = sb.channel("task-logger");
    for (const table of ["task_logger_tasks", "task_logger_entries", "task_logger_timers"]) {
      channel.on("postgres_changes", { event: "*", schema: "public", table }, schedule);
    }
    channel.subscribe();
    const onVisible = () => {
      if (document.visibilityState === "visible") schedule();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearTimeout(timeout);
      document.removeEventListener("visibilitychange", onVisible);
      void sb.removeChannel(channel);
    };
  }, [getSb, refresh]);

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

  useEffect(() => {
    if (!undo) return;
    const id = window.setTimeout(() => setUndo(null), UNDO_MS);
    return () => window.clearTimeout(id);
  }, [undo]);

  useEffect(() => {
    if (!notice) return;
    const id = window.setTimeout(() => setNotice(null), 4000);
    return () => window.clearTimeout(id);
  }, [notice]);

  /** Optimistic local change, then persist; on failure show the error and reload the truth. */
  const mutate = (local: (d: TaskLoggerData) => TaskLoggerData, remote: () => Promise<void>) => {
    setData((d) => (d ? local(d) : d));
    remote()
      .then(() => refresh())
      .catch((e) => {
        setError(e instanceof Error ? e.message : "Save failed");
        void refresh();
      });
  };

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
      ? Math.max(0, Math.floor((now - Math.max(store.timer.startedAt, new Date(now).setHours(0, 0, 0, 0))) / 60000))
      : 0;

  const todayTotal =
    Object.values(todayLog).reduce((a, b) => a + b, 0) +
    (store.timer ? liveMinutes(store.timer.taskId) : 0);

  const activeTasks = useMemo(() => store.tasks.filter((t) => !t.archivedAt), [store.tasks]);
  const archivedTasks = useMemo(() => store.tasks.filter((t) => t.archivedAt), [store.tasks]);

  // Today's active tasks float to the top; the rest keep creation order.
  const orderedTasks = useMemo(() => {
    return [...activeTasks].sort((a, b) => {
      const am = (todayLog[a.id] ?? 0) + (store.timer?.taskId === a.id ? 1 : 0);
      const bm = (todayLog[b.id] ?? 0) + (store.timer?.taskId === b.id ? 1 : 0);
      if ((am > 0) !== (bm > 0)) return am > 0 ? -1 : 1;
      return a.createdAt.localeCompare(b.createdAt);
    });
  }, [activeTasks, todayLog, store.timer]);

  const handleAddTask = (e: FormEvent) => {
    e.preventDefault();
    const name = newTaskName.trim();
    if (!name) return;
    setNewTaskName("");
    const existing = store.tasks.find((t) => t.name.toLowerCase() === name.toLowerCase());
    if (existing) {
      // Re-adding an archived task brings it (and its history) back.
      if (existing.archivedAt) restoreTask(existing.id);
      return;
    }
    const task = { id: newId(), name, createdAt: new Date().toISOString(), archivedAt: null };
    mutate(
      (d) => ({ ...d, tasks: [...d.tasks, task] }),
      () => insertTask(getSb(), task),
    );
  };

  const logMinutes = (taskId: string, delta: number, { isUndo = false } = {}) => {
    if (!Number.isFinite(delta) || delta === 0) return;
    const day = dateKey(new Date());
    const current = store.log[day]?.[taskId] ?? 0;
    // Never let a correction take the day below zero.
    const applied = Math.max(-current, Math.max(-1440, Math.min(1440, Math.round(delta))));
    if (applied === 0) return;
    if (isUndo) {
      setUndo(null);
    } else {
      setUndo((u) =>
        u && u.taskId === taskId && u.day === day
          ? { ...u, minutes: u.minutes + applied }
          : { taskId, day, minutes: applied },
      );
    }
    mutate(
      (d) => ({
        ...d,
        log: { ...d.log, [day]: { ...(d.log[day] ?? {}), [taskId]: current + applied } },
      }),
      () => insertEntry(getSb(), taskId, day, applied),
    );
  };

  const submitCustom = (taskId: string) => {
    const value = Number(customMinutes[taskId]);
    if (!value) return;
    logMinutes(taskId, value);
    setCustomMinutes((c) => ({ ...c, [taskId]: "" }));
  };

  const toggleTimer = (taskId: string) => {
    const stoppingSame = store.timer?.taskId === taskId;
    // Optimistic: flip the timer now; the server credits minutes (split at midnight) and the refetch shows them.
    mutate(
      (d) => ({ ...d, timer: stoppingSame ? null : { taskId, startedAt: Date.now() } }),
      () => toggleTimerRemote(getSb(), taskId),
    );
  };

  const deleteTask = (taskId: string) => {
    const task = store.tasks.find((t) => t.id === taskId);
    if (!task || store.timer?.taskId === taskId) return;
    setData((d) =>
      d
        ? { ...d, tasks: d.tasks.map((t) => (t.id === taskId ? { ...t, archivedAt: new Date().toISOString() } : t)) }
        : d,
    );
    removeTask(getSb(), taskId)
      .then((result) => {
        setNotice(result === "deleted" ? `Deleted "${task.name}"` : `Archived "${task.name}" — history kept`);
        return refresh();
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : "Delete failed");
        void refresh();
      });
  };

  function restoreTask(taskId: string) {
    setNotice(null);
    mutate(
      (d) => ({ ...d, tasks: d.tasks.map((t) => (t.id === taskId ? { ...t, archivedAt: null } : t)) }),
      () => setTaskArchived(getSb(), taskId, false),
    );
  }

  const saveRename = (taskId: string) => {
    const name = renameValue.trim();
    setRenamingId(null);
    const task = store.tasks.find((t) => t.id === taskId);
    if (!name || !task || task.name === name) return;
    mutate(
      (d) => ({ ...d, tasks: d.tasks.map((t) => (t.id === taskId ? { ...t, name } : t)) }),
      () => renameTask(getSb(), taskId, name),
    );
  };

  if (!ready) {
    return (
      <SectionBox title="Today's log">
        {error ? (
          <p className="py-6 text-center text-sm text-crt-muted crt-text-plain">
            Couldn&apos;t load: {error}{" "}
            <button type="button" onClick={() => void refresh()} className="underline">
              retry
            </button>
          </p>
        ) : (
          <div className="animate-pulse h-32 bg-crt-bar-track/40 rounded-sm" />
        )}
      </SectionBox>
    );
  }

  const maxToday = Math.max(1, ...activeTasks.map((t) => (todayLog[t.id] ?? 0) + liveMinutes(t.id)));

  return (
    <SectionBox title="Today's log">
      <div className="mb-4 flex items-baseline justify-between gap-3 crt-text-plain">
        <span className="text-sm text-crt-muted">
          {new Date(now).toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "short" })}
          <span className="ml-2 text-xs text-crt-phosphor-dim">resets at midnight · synced</span>
        </span>
        <span className="text-lg font-bold text-crt-phosphor-bright tabular-nums">
          {formatMinutes(todayTotal)}
        </span>
      </div>

      {error && (
        <p className="mb-3 text-xs text-crt-muted crt-text-plain" role="alert">
          ⚠ {error}
        </p>
      )}

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

      {notice && (
        <p className="mb-3 text-xs text-crt-phosphor crt-text-plain" role="status">
          {notice}
        </p>
      )}

      {activeTasks.length === 0 ? (
        <p className="py-8 text-center text-sm text-crt-muted crt-text-plain">
          No tasks yet. Add one above — minutes reset daily.
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

                  {!running && (
                    <button
                      type="button"
                      onClick={() => deleteTask(task.id)}
                      aria-label={`Delete ${task.name}`}
                      title={week > 0 || yesterday > 0 ? "Archive (history kept)" : "Delete"}
                      className="inline-flex size-7 shrink-0 items-center justify-center rounded-sm text-crt-phosphor-dim transition-colors hover:text-crt-phosphor-bright"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  )}
                </div>

                <div className="mt-2 h-1 w-full overflow-hidden rounded-sm bg-crt-bar-track">
                  <div
                    className="h-full bg-crt-phosphor transition-[width] duration-300"
                    style={{ width: `${(mins / maxToday) * 100}%` }}
                  />
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  {undo?.taskId === task.id && undo.day === today && undo.minutes !== 0 && (
                    <button
                      type="button"
                      onClick={() => logMinutes(task.id, -undo.minutes, { isUndo: true })}
                      className="flex items-center gap-1 px-2 py-1 crt-btn crt-btn-primary rounded-sm text-xs tabular-nums"
                      title="Undo the last log on this task"
                    >
                      <Undo2 className="size-3.5" />
                      undo {undo.minutes > 0 ? "+" : "−"}
                      {Math.abs(undo.minutes)}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => logMinutes(task.id, -5)}
                    disabled={(todayLog[task.id] ?? 0) === 0}
                    className="px-2 py-1 crt-btn rounded-sm text-xs tabular-nums disabled:opacity-40"
                    title="Remove 5 minutes"
                  >
                    −5
                  </button>
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

      {archivedTasks.length > 0 && (
        <div className="mt-4 crt-text-plain">
          <button
            type="button"
            onClick={() => setShowArchived((v) => !v)}
            className="flex items-center gap-1.5 text-xs text-crt-muted hover:text-crt-phosphor"
            aria-expanded={showArchived}
          >
            <Archive className="size-3.5" />
            Archived ({archivedTasks.length})
          </button>
          {showArchived && (
            <ul className="mt-2 space-y-1">
              {archivedTasks.map((task) => (
                <li
                  key={task.id}
                  className="flex items-center gap-2 rounded-sm border border-crt-border/60 px-3 py-1.5 text-sm opacity-70"
                >
                  <span className="min-w-0 flex-1 truncate text-crt-phosphor">{task.name}</span>
                  <span className="text-[11px] text-crt-muted tabular-nums">
                    7d {formatMinutes(weekTotals[task.id] ?? 0)}
                  </span>
                  <button
                    type="button"
                    onClick={() => restoreTask(task.id)}
                    className="flex items-center gap-1 px-2 py-0.5 crt-btn rounded-sm text-xs"
                  >
                    <ArchiveRestore className="size-3.5" />
                    Restore
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </SectionBox>
  );
}
