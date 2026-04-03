import { getFirstIncompletePrime } from "./primeOrders.js";

/**
 * Prime-adjusted report totals. Does not mutate DB balance.
 * Liability applies only when the user is on the admin-selected prime task (currentTaskNo === first incomplete prime task_no).
 * @param {number} balance - users.balance
 * @param {unknown} primeOrdersRaw - users.prime_orders JSON
 * @param {unknown} cycleInstantProfit - report_progress.cycle_instant_profit
 * @param {number} [currentTaskNo] - resolved current cycle task (0 if unknown)
 */
export function computeUserFinancialSummary(balance, primeOrdersRaw, cycleInstantProfit, currentTaskNo = 0) {
  const userBalance = Number(balance);
  const bal = Number.isFinite(userBalance) ? userBalance : 0;
  const firstIncomplete = getFirstIncompletePrime(primeOrdersRaw);
  const ct = Number(currentTaskNo);
  const onPrimeTask =
    firstIncomplete &&
    Number.isFinite(ct) &&
    ct > 0 &&
    ct === Number(firstIncomplete.task_no);
  let totalCapital = bal;
  if (onPrimeTask && firstIncomplete) {
    const primeAmount = Math.abs(Number(firstIncomplete.negative_amount) || 0);
    totalCapital -= primeAmount;
  }
  const ipRaw = Number(cycleInstantProfit);
  const instantProfit = Number.isFinite(ipRaw) ? ipRaw : 0;
  const protectedReserve = 0;
  const netValue = totalCapital + instantProfit;
  let campaignWallet = 0;
  if (netValue < 0) {
    campaignWallet = Number(Math.abs(netValue).toFixed(2));
  }
  return {
    total_capital: Number(totalCapital.toFixed(2)),
    instant_profit: Number(instantProfit.toFixed(2)),
    protected_reserve: protectedReserve,
    campaign_wallet: campaignWallet,
  };
}

/** Snake_case + camelCase for API responses. */
export function financialSummaryForApi(balance, primeOrdersRaw, cycleInstantProfit, currentTaskNo = 0) {
  const f = computeUserFinancialSummary(balance, primeOrdersRaw, cycleInstantProfit, currentTaskNo);
  return {
    ...f,
    totalCapital: f.total_capital,
    instantProfit: f.instant_profit,
    protectedReserve: f.protected_reserve,
    campaignWallet: f.campaign_wallet,
  };
}
