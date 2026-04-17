alter table public.daily_checks
  drop column if exists honesty_repair,
  add column if not exists communicated_friend boolean not null default false,
  add column if not exists family_one_hour boolean not null default false;
