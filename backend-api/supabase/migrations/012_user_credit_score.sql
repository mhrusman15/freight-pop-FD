-- Add editable user credit score (default 100).

alter table public.users
  add column if not exists credit_score integer not null default 100;

update public.users
set credit_score = 100
where credit_score is null;
