alter table public.users
  add column if not exists x5_profit_enabled boolean not null default false;

