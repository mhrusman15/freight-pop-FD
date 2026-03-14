const highlights = [
  {
    title: "Execution stays aligned across teams",
    body: "Sales, operations, warehouse, and transportation teams operate from the same real-time data—eliminating rework and miscommunication.",
  },
  {
    title: "Fewer exceptions. Faster throughput.",
    body: "Reduce missed pickups, staging delays, inventory mismatches, and shipment errors by keeping every step coordinated.",
  },
  {
    title: "Performance improves without adding headcount",
    body: "Automation and synchronized workflows reduce manual touchpoints while increasing operational control.",
  },
];

export function ExecutionSection() {
  return (
    <section className="border-b border-slate-100 bg-white py-20">
      <div className="fp-container grid gap-10 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] md:items-center">
        <div className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-300/80">
            Execution without friction
          </p>
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Eliminate the gaps between order and delivery
          </h2>
          <p className="max-w-xl text-sm text-muted-foreground sm:text-base">
            When order flow, warehouse activity, and transportation operate
            inside the same workflow, teams stop reacting to breakdowns and
            start executing with precision.
          </p>

          <div className="mt-6 flex flex-wrap gap-2 text-[11px]">
            <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">
              Order Flow
            </span>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">
              Warehouse Execution
            </span>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">
              Transportation Control
            </span>
          </div>
        </div>

        <div className="space-y-4">
          {highlights.map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <p className="text-sm font-semibold">{item.title}</p>
              <p className="mt-2 text-xs text-muted-foreground">{item.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

