-- Task logger: archive replaced by plain delete (entries/timer cascade).
alter table public.task_logger_tasks
  drop column if exists archived_at;
