-- Migration 011: Commission tier system, protected reserve, app settings.

-- Commission tier (bounded tier system replacing stacking multiplier)
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS commission_tier INTEGER NOT NULL DEFAULT 0;

-- Protected reserve columns
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS initial_reserve_consumed BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS protected_reserve NUMERIC(18,2) NOT NULL DEFAULT 20000;

-- Timestamp of last admin positive deposit (drives 24h green color rule)
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS last_positive_deposit_at TIMESTAMPTZ;

-- App-wide configurable settings table
CREATE TABLE IF NOT EXISTS public.app_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Seed defaults
INSERT INTO public.app_settings (key, value) VALUES
  ('max_commission_tier', '5'::jsonb),
  ('default_protected_reserve', '20000'::jsonb),
  ('task_price_ranges', '[
    {"min_capital":0,"max_capital":2000,"min_price":5000,"max_price":14000},
    {"min_capital":2001,"max_capital":19999,"min_price":10000,"max_price":16000},
    {"min_capital":20000,"max_capital":null,"min_price":15000,"max_price":19000}
  ]'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- Backfill commission_tier from existing commission_multiplier
UPDATE public.users
SET commission_tier = CASE
  WHEN commission_multiplier <= 1 THEN 0
  WHEN commission_multiplier <= 5 THEN 1
  WHEN commission_multiplier <= 25 THEN 2
  WHEN commission_multiplier <= 125 THEN 3
  WHEN commission_multiplier <= 625 THEN 4
  ELSE 5
END
WHERE commission_multiplier IS NOT NULL AND commission_multiplier > 1;
