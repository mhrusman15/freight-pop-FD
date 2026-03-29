-- Ensure columns referenced by admin task / prime / balance flows exist (idempotent).

alter table public.users
  add column if not exists is_approved boolean not null default false;

alter table public.users
  add column if not exists task_quota_total integer not null default 30;

alter table public.users
  add column if not exists task_quota_used integer not null default 0;

alter table public.users
  add column if not exists task_assignment_granted_at timestamptz;

alter table public.users
  add column if not exists prime_order_slots integer[] not null default '{}';

alter table public.users
  add column if not exists prime_negative_amount numeric(18, 2) not null default 0;

alter table public.users
  add column if not exists prime_show_negative boolean not null default true;

alter table public.users
  add column if not exists balance numeric(18, 2) not null default 0;

alter table public.users
  add column if not exists x5_profit_enabled boolean not null default false;

alter table public.users
  add column if not exists admin_deposit_profit_basis numeric(18, 2) not null default 0;
