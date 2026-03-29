/**
 * Session-scoped cache for asset balance (not persisted across browser restarts).
 * Authoritative value always comes from GET /api/user/balance via `useAssetBalance`.
 */

/** sessionStorage key — same-tab updates + custom event for React subscribers. */
export const ASSET_BALANCE_STORAGE_KEY = "fp_asset_balance";
const DEFAULT_BALANCE = 0;

/** Custom event name so components can re-render when balance changes in the same session */
export const ASSET_BALANCE_UPDATED = "fp_asset_balance_updated";

function read(): number {
  if (typeof window === "undefined") return DEFAULT_BALANCE;
  try {
    const raw = window.sessionStorage.getItem(ASSET_BALANCE_STORAGE_KEY);
    if (raw == null) return DEFAULT_BALANCE;
    const n = parseFloat(raw);
    return Number.isFinite(n) ? n : DEFAULT_BALANCE;
  } catch {
    return DEFAULT_BALANCE;
  }
}

function write(value: number) {
  if (typeof window === "undefined") return;
  const safe = Number.isFinite(value) ? value : DEFAULT_BALANCE;
  window.sessionStorage.setItem(ASSET_BALANCE_STORAGE_KEY, String(safe));
  window.dispatchEvent(new CustomEvent(ASSET_BALANCE_UPDATED, { detail: safe }));
}

/** Get current asset balance (number). */
export function getAssetBalance(): number {
  return read();
}

/** Set asset balance to an absolute value. */
export function setAssetBalance(value: number): void {
  write(value);
}

/** Add amount (e.g. after deposit). */
export function addToAssetBalance(amount: number): void {
  write(read() + amount);
}

/** Subtract amount (e.g. after withdraw). Returns new balance. */
export function subtractFromAssetBalance(amount: number): number {
  const current = read();
  const next = Math.max(0, current - amount);
  write(next);
  return next;
}

/** Format balance for display (e.g. "Rs 20,341.15" or "-Rs 20,341.15"). */
export function formatAssetBalance(value?: number): string {
  const n = value ?? read();
  const sign = n < 0 ? "-" : "";
  const abs = Math.abs(n);
  const fixed = abs.toFixed(2);
  const [int, dec] = fixed.split(".");
  const withCommas = int.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${sign}Rs ${withCommas}.${dec}`;
}
