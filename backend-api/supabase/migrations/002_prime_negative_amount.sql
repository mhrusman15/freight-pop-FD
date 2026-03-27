-- Add optional prime negative amount configured by admin.
alter table public.users
  add column if not exists prime_negative_amount numeric(18, 2) not null default 0;

