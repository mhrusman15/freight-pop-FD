-- Simple per-user withdrawal request state (single active request).

alter table public.users
  add column if not exists withdrawal_status text not null default 'none',
  add column if not exists withdrawal_amount numeric(12,2),
  add column if not exists withdrawal_bank_name text,
  add column if not exists withdrawal_account_number text,
  add column if not exists withdrawal_requested_at timestamptz,
  add column if not exists withdrawal_decided_at timestamptz,
  add column if not exists withdrawal_admin_note text;

