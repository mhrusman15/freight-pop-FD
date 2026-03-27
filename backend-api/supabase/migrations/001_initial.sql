-- Run this in the Supabase SQL editor (or via supabase db push) before starting the API.
-- Requires: Supabase project with Auth enabled.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- public.users — profile linked to auth.users (same id as auth.users.id)
-- ---------------------------------------------------------------------------
create table if not exists public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  full_name text not null default '',
  phone text not null default '',
  role text not null default 'user' check (role in ('user', 'admin', 'super_admin')),
  is_approved boolean not null default false,

  -- NEW: first-time task system
  has_received_first_tasks boolean not null default false,
  first_tasks_completed integer not null default 0,

  rejected boolean not null default false,
  balance numeric(18, 2) not null default 0,
  admin_permissions text,
  task_quota_total integer not null default 30,
  task_quota_used integer not null default 0,
  task_assignment_required boolean not null default false,
  task_assignment_requested_at timestamptz,
  task_assignment_granted_at timestamptz,
  prime_order_slots integer[] not null default '{}',

  -- Prime order negative display (admin-configurable)
  prime_show_negative boolean not null default true,
  prime_negative_amount numeric(18, 2) not null default 0,

  image_cycle_state jsonb,
  sessions_invalidated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Important for existing DBs (table already created earlier):
alter table public.users
  add column if not exists prime_show_negative boolean not null default true;

alter table public.users
  add column if not exists prime_negative_amount numeric(18, 2) not null default 0;

-- NEW: backfill-safe columns
alter table public.users
  add column if not exists has_received_first_tasks boolean not null default false;

alter table public.users
  add column if not exists first_tasks_completed integer not null default 0;

create index if not exists idx_users_email_lower on public.users (lower(trim(email)));
create index if not exists idx_users_role on public.users (role);
create index if not exists idx_users_approval on public.users (is_approved, rejected);

-- ---------------------------------------------------------------------------
-- tasks — catalog rows (optional FK from user_tasks)
-- ---------------------------------------------------------------------------
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  reward numeric(18, 2) not null default 0,
  status text not null default 'active',
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- user_tasks — per-user task instances (open = in progress, completed = done)
-- ---------------------------------------------------------------------------
create table if not exists public.user_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  task_id uuid references public.tasks (id) on delete set null,
  status text not null check (status in ('open', 'completed')),
  payload jsonb,
  task_no integer,
  is_prime boolean not null default false,

  -- NEW: identify first-time bonus tasks
  is_first_time boolean not null default false,

  created_at timestamptz not null default now(),
  completed_at timestamptz
);

-- NEW: add for existing DB
alter table public.user_tasks
  add column if not exists is_first_time boolean not null default false;

create index if not exists idx_user_tasks_user on public.user_tasks (user_id);
create index if not exists idx_user_tasks_user_status on public.user_tasks (user_id, status);

-- ---------------------------------------------------------------------------
-- activity_logs — track first bonus/admin assignment/history messages
-- ---------------------------------------------------------------------------
create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  message text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_activity_logs_user_created_at
  on public.activity_logs (user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- transactions
-- ---------------------------------------------------------------------------
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  type text not null check (type in ('deposit', 'withdraw', 'task_reward')),
  amount numeric(18, 2) not null,
  status text not null check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

create index if not exists idx_transactions_user on public.transactions (user_id);

-- ---------------------------------------------------------------------------
-- updated_at
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_users_updated_at on public.users;
create trigger trg_users_updated_at
  before update on public.users
  for each row
  execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Optional: seed placeholder tasks (FK optional; app also allows null task_id)
-- ---------------------------------------------------------------------------
insert into public.tasks (id, title, reward, status)
values
  ('00000000-0000-4000-8000-000000000001', 'Luxury Order', 0, 'active'),
  ('00000000-0000-4000-8000-000000000002', 'Brand Vault', 0, 'active'),
  ('00000000-0000-4000-8000-000000000003', 'Elite Choice', 0, 'active')
on conflict (id) do nothing;

alter table public.users enable row level security;
alter table public.tasks enable row level security;
alter table public.user_tasks enable row level security;
alter table public.transactions enable row level security;
alter table public.activity_logs enable row level security;

-- Service role bypasses RLS; API uses service role only.
