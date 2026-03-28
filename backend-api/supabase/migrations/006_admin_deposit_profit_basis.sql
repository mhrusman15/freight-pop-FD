-- Tracks last admin credit used to scale task commissions (profit boost).
alter table public.users
  add column if not exists admin_deposit_profit_basis numeric(18, 2) not null default 0;
