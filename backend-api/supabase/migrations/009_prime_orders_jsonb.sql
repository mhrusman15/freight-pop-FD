-- Prime tasks: per-task negative amounts in JSONB. Run in Supabase SQL Editor.
-- Migrates from prime_order_slots + prime_negative_amount, then drops old columns.

alter table public.users
  add column if not exists prime_orders jsonb not null default '[]'::jsonb;

-- Backfill prime_orders from legacy columns (same negative_amount for every slot, as before).
update public.users u
set prime_orders = (
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'task_no', s.slot,
        'negative_amount', -abs(coalesce(u.prime_negative_amount, 0)),
        'is_completed', false
      )
      order by s.slot
    ),
    '[]'::jsonb
  )
  from unnest(coalesce(u.prime_order_slots, array[]::integer[])) as s(slot)
)
where cardinality(coalesce(u.prime_order_slots, '{}')) > 0;

alter table public.users drop column if exists prime_negative_amount;
alter table public.users drop column if exists prime_show_negative;
alter table public.users drop column if exists prime_order_slots;

comment on column public.users.prime_orders is
  'Array of { task_no: 1-30, negative_amount: number, is_completed: boolean } for prime order rules.';
