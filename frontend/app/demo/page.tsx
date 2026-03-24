"use client";

import { useAssetBalance } from "@/lib/use-asset-balance";

export default function DemoPage() {
  const { formatted: assetBalanceFormatted } = useAssetBalance();
  return (
    <main className="min-h-screen bg-slate-50 flex flex-col items-center py-10 px-4">
      <section className="w-full max-w-4xl overflow-hidden rounded-md shadow-md bg-white">
        <img
          src="/login-hero.jpeg"
          alt="Login hero"
          className="w-full h-64 object-cover"
        />
      </section>

      <section className="w-full max-w-4xl mt-6 rounded-2xl bg-white shadow-md border border-slate-200 px-8 py-6 space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <p className="text-sm text-slate-500 flex items-center gap-2">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-slate-300">
                💼
              </span>
              Total Capital
            </p>
            <p className="text-2xl font-semibold text-slate-900">{assetBalanceFormatted}</p>
          </div>

          <div className="space-y-1">
            <p className="text-sm text-slate-500 flex items-center gap-2">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-slate-300">
                💰
              </span>
              Instant Profit
            </p>
            <p className="text-xl font-semibold text-slate-900">Rs0</p>
          </div>

          <div className="space-y-1">
            <p className="text-sm text-slate-500 flex items-center gap-2">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-slate-300">
                📈
              </span>
              Pursuit
            </p>
            <p className="text-xl font-semibold text-slate-900">7/29</p>
          </div>

          <div className="space-y-1">
            <p className="text-sm text-slate-500 flex items-center gap-2">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-slate-300">
                🛡️
              </span>
              Protected Reserve
            </p>
            <p className="text-xl font-semibold text-slate-900">Rs0.00</p>
          </div>

          <div className="space-y-1">
            <p className="text-sm text-slate-500 flex items-center gap-2">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-slate-300">
                💳
              </span>
              Campaign Wallet
            </p>
            <p className="text-xl font-semibold text-slate-900">Rs0</p>
          </div>
        </div>

        <div className="pt-4 space-y-3">
          <button
            type="button"
            className="w-full rounded-md bg-sky-600 px-4 py-3 text-center text-sm font-semibold text-white shadow-sm hover:bg-sky-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
            onClick={() => alert('Enter Access clicked')}
          >
            Enter Access
          </button>

          <button
            type="button"
            className="w-full rounded-md border border-sky-500 px-4 py-3 text-center text-sm font-semibold text-sky-700 bg-white hover:bg-sky-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
            onClick={() => alert('Activity Track clicked')}
          >
            Activity Track
          </button>
        </div>
      </section>
    </main>
  );
}

