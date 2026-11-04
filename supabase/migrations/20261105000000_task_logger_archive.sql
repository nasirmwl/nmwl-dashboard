-- Task logger: archive tasks instead of losing their history.
--
-- A task with logged minutes is archived (hidden from the list, minutes kept
-- in history and restorable). A task with no minutes ever is hard-deleted by
-- the app, which the existing "own tasks" RLS policy already allows.
alter table public.task_logger_tasks
  add column if not exists archived_at timestamptz;
