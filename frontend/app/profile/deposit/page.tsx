"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAssetBalance } from "@/lib/use-asset-balance";
import { getAuthUser, getToken } from "@/lib/auth-store";

export default function ProfileDepositPage() {
  const router = useRouter();
  const { formatted: assetBalanceFormatted } = useAssetBalance();
  const [mounted, setMounted] = useState(false);

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
            <div className="h-14 rounded-lg bg-slate-200 dark:bg-slate-700" />
            <div className="h-48 rounded-lg bg-slate-200 dark:bg-slate-700" />
            <div className="h-32 rounded-lg bg-slate-200 dark:bg-slate-700" />
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
          <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">User Deposit</h1>
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
            <span className="font-semibold text-slate-900 dark:text-slate-100">{assetBalanceFormatted}</span>
          </div>

          {/* Faded background image */}
          <div className="relative min-h-[220px] w-full overflow-hidden rounded-xl bg-slate-300 dark:bg-slate-700">
            <img
              src="/images/login-hero.jpg"
              alt=""
              className="absolute inset-0 h-full w-full object-cover opacity-50"
            />
            <div className="absolute inset-0 bg-black/30" aria-hidden />
          </div>

          {/* Customer Live Chat */}
          <div className="rounded-xl bg-white dark:bg-slate-800 p-5 shadow-sm border border-slate-200 dark:border-slate-700">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Customer Live Chat
            </h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              Need to get in touch with us? Click button below link to our customer live chat
            </p>
            <button
              type="button"
              onClick={() => {}}
              aria-disabled="true"
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3.5 text-base font-semibold text-white shadow focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
            >
              <svg
                className="h-5 w-5 shrink-0"
                fill="currentColor"
                viewBox="0 0 24 24"
                aria-hidden
              >
                <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
              </svg>
              Telegram
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
