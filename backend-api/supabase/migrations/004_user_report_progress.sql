-- Persist per-user report progress so dashboard state survives re-login.

create table if not exists public.user_report_progress (
  user_id uuid primary key references public.users (id) on delete cascade,
  last_task_no integer not null default 0,
  last_amount numeric(18, 2) not null default 0,
  cycle_instant_profit numeric(18, 2) not null default 0,
  last_order_number text,
  updated_at timestamptz not null default now()
);

create index if not exists idx_user_report_progress_updated_at
  on public.user_report_progress (updated_at desc);

alter table public.user_report_progress enable row level security;

drop trigger if exists trg_user_report_progress_updated_at on public.user_report_progress;
create trigger trg_user_report_progress_updated_at
  before update on public.user_report_progress
  for each row
  execute function public.set_updated_at();
