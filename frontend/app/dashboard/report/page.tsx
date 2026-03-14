import Image from "next/image";

export default function DashboardReportPage() {
  return (
    <main className="min-h-screen bg-slate-100 flex flex-col items-center py-8 px-4">
      {/* Background image header using login-hero.jpeg */}
      <section className="w-full max-w-md overflow-hidden rounded-md bg-white shadow-md relative h-56">
        <Image
          src="/images/login-hero.jpeg"
          alt="freightPOP report background"
          fill
          className="object-cover"
          sizes="(max-width: 448px) 100vw, 448px"
          priority
        />
      </section>

      {/* Report summary card */}
      <section className="w-full max-w-md -mt-10 rounded-2xl bg-white shadow-md border border-slate-200 px-6 pb-8 pt-10 space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-xl font-semibold text-slate-900">
            freightPOP Report Access
          </h1>
          <p className="text-xs text-slate-500">
            Review your latest performance overview before downloading detailed
            reports.
          </p>
        </div>

        {/* Stats block similar to the screenshot */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-4 space-y-4">
          <div className="flex flex-col items-center gap-1">
            <span className="text-xs text-slate-500">Total Capital</span>
            <span className="text-xl font-semibold text-slate-900">
              Rs20341.15
            </span>
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-xs text-slate-800">
            <div className="space-y-1">
              <p className="flex items-center gap-1.5 font-medium">
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 text-[10px]">
                  ₹
                </span>
                Instant Profit
              </p>
              <p className="text-sm font-semibold">Rs0</p>
            </div>
            <div className="space-y-1">
              <p className="flex items-center gap-1.5 font-medium">
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 text-[10px]">
                  ⏱
                </span>
                Pursuit
              </p>
              <p className="text-sm font-semibold">7/30</p>
            </div>
            <div className="space-y-1">
              <p className="flex items-center gap-1.5 font-medium">
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 text-[10px]">
                  🛡
                </span>
                Protected Reserve
              </p>
              <p className="text-sm font-semibold">Rs0.00</p>
            </div>
            <div className="space-y-1">
              <p className="flex items-center gap-1.5 font-medium">
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 text-[10px]">
                  💼
                </span>
                Campaign Wallet
              </p>
              <p className="text-sm font-semibold">Rs0</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            type="button"
            className="w-full rounded-md bg-sky-600 py-2.5 text-sm font-semibold text-white shadow hover:bg-sky-700"
          >
            Enter Access
          </button>
          <button
            type="button"
            className="w-full rounded-md border border-slate-300 py-2.5 text-sm font-medium text-slate-800 hover:bg-slate-50"
          >
            Activity Track
          </button>
        </div>
      </section>
    </main>
  );
}

