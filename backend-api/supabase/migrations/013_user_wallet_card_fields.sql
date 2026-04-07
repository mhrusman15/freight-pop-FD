-- Store per-user wallet/card display details.

alter table public.users
  add column if not exists wallet_mobile_phone text,
  add column if not exists wallet_account_holder_name text,
  add column if not exists wallet_account_number text,
  add column if not exists wallet_bank_name text,
  add column if not exists wallet_branch text,
  add column if not exists wallet_routing_number text,
  add column if not exists wallet_card_updated_at timestamptz;

