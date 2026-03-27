-- Strict user approval + first-time task system

alter table public.users
  add column if not exists has_received_first_tasks boolean not null default false,
  add column if not exists first_tasks_completed integer not null default 0;

alter table public.user_tasks
  add column if not exists is_first_time boolean not null default false;

create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  message text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_activity_logs_user_created_at
  on public.activity_logs (user_id, created_at desc);

alter table public.activity_logs enable row level security;
