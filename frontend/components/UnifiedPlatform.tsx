function SectionEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-300/80">
      {children}
    </p>
  );
}

function SectionHeading({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <div className="space-y-3">
      <SectionEyebrow>Unified Supply Chain Platform</SectionEyebrow>
      <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
        {title}
      </h2>
      <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
        {subtitle}
      </p>
    </div>
  );
}

const pillars = [
  {
    title: "Transportation Management",
    description: "Optimize how freight moves, costs, and performs.",
    tags: [
      "Carrier management",
      "Rate shopping",
      "Route optimization",
      "Dock scheduling",
      "Tracking",
      "Invoice auditing",
      "Analytics",
    ],
  },
  {
    title: "Warehouse Management",
    description:
      "Control inventory, workflow, and throughput across every facility.",
    tags: [
      "Warehouse control",
      "Inventory management",
      "Multi-warehouse",
      "Yard management",
      "Warehouse analytics",
    ],
  },
  {
    title: "Order Management",
    description:
      "Turn demand into shipment-ready execution faster and with fewer errors.",
    tags: ["Inbound receiving", "Order ingestion", "Order consolidation", "Auto pack"],
  },
];

export function UnifiedPlatform() {
  return (
    <section className="border-b border-slate-100 bg-white py-20">
      <div className="fp-container space-y-10">
        <SectionHeading
          title="Smarter supply chains start here"
          subtitle="FreightPOP unifies order management, warehouse operations, and transportation execution into one connected platform, so teams can operate from a single workflow."
        />

        <div className="rounded-3xl border border-slate-200 bg-surface-elevated p-6 shadow-sm">
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-sky-500/10 px-3 py-1 text-xs font-semibold text-sky-300">
              One AI Platform. Three Pillars of Execution.
            </span>
            <span className="text-xs text-muted-foreground">
              Now highlighting: Transportation Management
            </span>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {pillars.map((pillar) => (
              <div
                key={pillar.title}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <h3 className="text-sm font-semibold">{pillar.title}</h3>
                <p className="mt-2 text-xs text-muted-foreground">
                  {pillar.description}
                </p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {pillar.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] text-slate-700"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

