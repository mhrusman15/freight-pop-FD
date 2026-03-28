-- Per-user daily check-in reward amount shown in the app; updated when admin saves
-- a positive "Amount to add (runtime)" on the user balance form.
alter table public.users
  add column if not exists sign_in_reward_amount numeric(18, 2) not null default 1000;
