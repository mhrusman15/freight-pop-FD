-- Commission multiplier that stacks by 5x after each completed prime order.
-- Used for both task price and task commission calculations.
alter table public.users
  add column if not exists commission_multiplier integer not null default 1;

comment on column public.users.commission_multiplier is
  'Current commission/task multiplier. Starts at 1. Multiplies by 5 on each completed prime order.';

