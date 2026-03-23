"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAssetBalance } from "@/lib/use-asset-balance";
import { getAssetBalance, subtractFromAssetBalance } from "@/lib/asset-balance-store";
import { getAuthUser, getToken } from "@/lib/auth-store";

const WITHDRAW_METHODS = ["BANK"] as const;

export default function ProfileWithdrawPage() {
  const router = useRouter();
  const { balance: assetBalance, formatted: assetBalanceFormatted, refetch: refetchBalance } = useAssetBalance();
  const [mounted, setMounted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [method, setMethod] = useState<string>("");
  const [formData, setFormData] = useState({
    bankName: "",
    accountNumber: "",
    cashOutAmount: "",
    withdrawalPassword: "",
  });
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const token = getToken();
    const user = getAuthUser();
    const isUserSession = !!token && !!user && user.role !== "admin" && user.role !== "super_admin";
    if (!isUserSession) {
      router.replace("/login");
      return;
    }
    setMounted(true);
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");
    const amount = parseFloat(formData.cashOutAmount.replace(/,/g, "").trim());
    if (!Number.isFinite(amount) || amount <= 0) {
      setSubmitError("Enter a valid amount.");
      return;
    }
    const token = getToken();
    const current = token ? assetBalance : getAssetBalance();
    if (amount > current) {
      setSubmitError("Insufficient balance.");
      return;
    }
    setSubmitting(true);
    subtractFromAssetBalance(amount);
    if (token) {
      refetchBalance();
    }
    setSubmitting(false);
    setFormData((prev) => ({ ...prev, cashOutAmount: "", withdrawalPassword: "" }));
    router.push("/profile");
  };

  if (!mounted) {
    return (
      <main className="min-h-screen bg-white dark:bg-slate-900">
        <header className="sticky top-0 z-20 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
          <div className="flex min-h-[3rem] items-center justify-center px-4">
            <div className="absolute left-4 h-6 w-6 rounded bg-slate-200 dark:bg-slate-600" />
            <div className="h-5 w-24 rounded bg-slate-200 dark:bg-slate-600" />
          </div>
        </header>
        <div className="fp-container py-8">
          <div className="mx-auto max-w-sm animate-pulse space-y-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-12 rounded-lg bg-slate-200 dark:bg-slate-700" />
            ))}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
      <header className="sticky top-0 z-20 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
        <div className="flex min-h-[3rem] items-center justify-center px-4">
          <button
            type="button"
            onClick={() => (typeof window !== "undefined" && window.history.length > 1 ? router.back() : router.push("/profile"))}
            className="absolute left-4 flex items-center text-slate-900 dark:text-slate-100 hover:text-slate-600 dark:hover:text-slate-300"
            aria-label="Back to profile"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">User Withdraw</h1>
        </div>
      </header>

      <div className="fp-container py-6">
        <div className="mx-auto max-w-sm space-y-5">
          {/* Asset Balance */}
          <div className="flex items-center justify-between rounded-lg bg-slate-100 dark:bg-slate-700/50 px-4 py-3">
            <span className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
              <svg
                className="h-5 w-5 text-slate-500 dark:text-slate-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
              Asset Balance
            </span>
            <span className="font-semibold text-slate-900 dark:text-slate-100">
              {assetBalanceFormatted}
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Withdraw Method */}
            <div>
              <label
                htmlFor="withdrawMethod"
                className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                Withdraw Method
              </label>
              <div className="relative">
                <select
                  id="withdrawMethod"
                  value={method}
                  onChange={(e) => setMethod(e.target.value)}
                  className="w-full appearance-none rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-3 pr-10 text-slate-900 dark:text-slate-100 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Select method</option>
                  {WITHDRAW_METHODS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
                <svg
                  className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {method === "BANK" && (
              <>
                <div>
                  <label
                    htmlFor="bankName"
                    className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300"
                  >
                    Bank name
                  </label>
                  <input
                    id="bankName"
                    name="bankName"
                    type="text"
                    value={formData.bankName}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-3 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label
                    htmlFor="accountNumber"
                    className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300"
                  >
                    Account Number
                  </label>
                  <input
                    id="accountNumber"
                    name="accountNumber"
                    type="text"
                    inputMode="numeric"
                    value={formData.accountNumber}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-3 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 min-h-[2.75rem]"
                  />
                </div>
              </>
            )}

            {/* Cash out amount */}
            <div>
              <label
                htmlFor="cashOutAmount"
                className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                Cash out amount
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 font-medium">
                  Rs
                </span>
                <input
                  id="cashOutAmount"
                  name="cashOutAmount"
                  type="text"
                  inputMode="decimal"
                  value={formData.cashOutAmount}
                  onChange={handleChange}
                  placeholder=""
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 pl-12 pr-4 py-3 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Withdrawal password */}
            <div>
              <label
                htmlFor="withdrawalPassword"
                className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                Withdrawal password
              </label>
              <div className="relative">
                <input
                  id="withdrawalPassword"
                  name="withdrawalPassword"
                  type={showPassword ? "text" : "password"}
                  value={formData.withdrawalPassword}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-3 pr-12 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                      />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {submitError && (
              <p className="text-sm text-red-600 dark:text-red-400">{submitError}</p>
            )}
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-blue-600 py-3.5 text-base font-semibold text-white shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 disabled:opacity-70"
            >
              {submitting ? "Processing…" : "Confirm"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
