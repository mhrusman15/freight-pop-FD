import { TASK_DAILY_LIMIT } from "./taskGeneration.js";

const TASK_NO_MAX = TASK_DAILY_LIMIT;

/** @returns {{ task_no: number, negative_amount: number, is_completed: boolean }[]} */
export function normalizePrimeOrders(raw) {
  if (raw == null) return [];
  let arr = raw;
  if (typeof raw === "string") {
    try {
      arr = JSON.parse(raw);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(arr)) return [];
  const out = [];
  const seen = new Set();
  for (const p of arr) {
    const task_no = Math.max(1, Math.min(TASK_NO_MAX, Math.floor(Number(p?.task_no) || 0)));
    if (!task_no || seen.has(task_no)) continue;
    seen.add(task_no);
    const rawNeg = Number(p?.negative_amount ?? 0);
    const negative_amount = Number.isFinite(rawNeg) ? (rawNeg <= 0 ? rawNeg : -Math.abs(rawNeg)) : 0;
    out.push({
      task_no,
      negative_amount,
      is_completed: Boolean(p?.is_completed),
    });
  }
  return out.sort((a, b) => a.task_no - b.task_no);
}

export function primeSlotsFromOrders(orders) {
  return normalizePrimeOrders(orders).map((p) => p.task_no);
}

/** First incomplete prime in ascending task_no order (normalized list). */
export function getFirstIncompletePrime(primeOrders) {
  return normalizePrimeOrders(primeOrders).find((p) => !p.is_completed) ?? null;
}

/**
 * Sequential prime: only the lowest incomplete task_no may be active for the current step.
 * @param {{ task_no: number, negative_amount: number, is_completed: boolean }[]} primeOrders
 * @param {number} currentTaskNo
 */
export function getActivePrime(primeOrders, currentTaskNo) {
  const sorted = normalizePrimeOrders(primeOrders)
    .filter((p) => !p.is_completed)
    .sort((a, b) => a.task_no - b.task_no);
  const firstPending = sorted[0];
  if (firstPending && firstPending.task_no === Number(currentTaskNo)) {
    return firstPending;
  }
  return null;
}

/** Admin assign-with-prime body: [{ task_no, negative_amount }] — amounts may be positive (recharge required). */
export function normalizePrimeOrdersFromAssign(primeOrders) {
  const arr = Array.isArray(primeOrders) ? primeOrders : [];
  const seen = new Set();
  const out = [];
  for (const p of arr) {
    const task_no = Math.max(1, Math.min(TASK_NO_MAX, Math.floor(Number(p?.task_no) || 0)));
    if (!task_no || seen.has(task_no)) continue;
    seen.add(task_no);
    const rawNeg = Number(p?.negative_amount ?? 0);
    const negative_amount = !Number.isFinite(rawNeg) ? 0 : rawNeg <= 0 ? rawNeg : -Math.abs(rawNeg);
    out.push({
      task_no,
      negative_amount,
      is_completed: false,
    });
  }
  return out.sort((a, b) => a.task_no - b.task_no);
}

export function primeRechargeRequiredFromPrime(activePrime) {
  const n = Number(activePrime?.negative_amount ?? 0);
  return Math.max(0, Math.abs(n) || 0);
}
