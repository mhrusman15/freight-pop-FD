const integrationPoints = [
  "ERPs",
  "Carriers",
  "Marketplaces",
  "Custom integrations",
];

export function IntegrationsSection() {
  return (
    <section className="border-b border-slate-100 bg-white py-20">
      <div className="fp-container grid gap-10 md:grid-cols-2 md:items-center">
        <div className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-300/80">
            Smart integrations
          </p>
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            The industry&apos;s largest logistics ecosystem
          </h2>
          <p className="max-w-xl text-sm text-muted-foreground sm:text-base">
            Access over 1,500 pre-built integrations so you can plug into the
            ERPs, carriers, and marketplaces you already use—without lengthy
            custom projects or disruptive replatforming.
          </p>

          <div className="mt-4 flex flex-wrap gap-3 text-xs">
            {integrationPoints.map((point) => (
              <span
                key={point}
                className="rounded-full bg-slate-100 px-3 py-1 text-slate-700"
              >
                {point}
              </span>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap gap-3 text-xs">
            <button
              type="button"
              className="inline-flex h-10 items-center justify-center rounded-full bg-primary px-5 font-semibold text-white hover:bg-primary-soft"
            >
              See integrations
            </button>
            <button
              type="button"
              className="inline-flex h-10 items-center justify-center rounded-full border border-white/20 px-5 font-semibold text-sky-100 hover:border-white/40"
            >
              Get the full list
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold text-slate-900">
              1,500+ ERP, carriers, and marketplace integrations
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              Connect your supply chain systems with minimal change. The goal
              isn&apos;t more software—it&apos;s coordinating what you already
              use into one workflow.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

