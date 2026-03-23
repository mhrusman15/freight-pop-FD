/**
 * Single source of truth for user Asset Balance.
 * Stored in localStorage so Profile, Withdraw, Deposit, and User Report
 * all show the same value. When balance changes (e.g. after withdraw/deposit),
 * any page that reads from this store will get the updated value on next load/mount.
 */

const STORAGE_KEY = "fp_asset_balance";
const DEFAULT_BALANCE = 20341.15;

/** Custom event name so components can re-render when balance changes in the same session */
export const ASSET_BALANCE_UPDATED = "fp_asset_balance_updated";

function read(): number {
  if (typeof window === "undefined") return DEFAULT_BALANCE;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw == null) return DEFAULT_BALANCE;
    const n = parseFloat(raw);
    return Number.isFinite(n) && n >= 0 ? n : DEFAULT_BALANCE;
  } catch {
    return DEFAULT_BALANCE;
  }
}

function write(value: number) {
  if (typeof window === "undefined") return;
  const safe = Number.isFinite(value) && value >= 0 ? value : 0;
  window.localStorage.setItem(STORAGE_KEY, String(safe));
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

/** Format balance for display (e.g. "Rs 20,341.15"). */
export function formatAssetBalance(value?: number): string {
  const n = value ?? read();
  const fixed = n.toFixed(2);
  const [int, dec] = fixed.split(".");
  const withCommas = int.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `Rs ${withCommas}.${dec}`;
}
