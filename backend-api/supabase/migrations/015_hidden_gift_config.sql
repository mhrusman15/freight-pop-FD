-- Per-cycle hidden gift (random box) configuration: which task triggers the modal and optional prime-catalog product.
-- null task = legacy default (28); 0 = disabled; 1–30 = explicit.
ALTER TABLE users ADD COLUMN IF NOT EXISTS hidden_gift_task_no integer;
ALTER TABLE users ADD COLUMN IF NOT EXISTS hidden_gift_product_key text;

COMMENT ON COLUMN users.hidden_gift_task_no IS 'Task number (1–30) when gift modal shows after that task completes; NULL = default 28; 0 = disabled';
COMMENT ON COLUMN users.hidden_gift_product_key IS 'Prime catalog key for fixed gift; NULL = random non-prime product, no 15x boost label';
