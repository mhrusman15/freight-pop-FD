const logos = ["Amazon", "eBay", "Porsche", "Schlage", "SouthernCarlson"];

export function TrustedBySection() {
  return (
    <section className="border-b border-slate-100 bg-white py-14">
      <div className="fp-container space-y-6">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-300/80">
          Trusted by operators who move the world
        </p>
        <div className="flex flex-wrap items-center gap-6 text-sm text-slate-700">
          {logos.map((logo) => (
            <div
              key={logo}
              className="flex h-10 items-center rounded-full border border-slate-200 bg-slate-50 px-5 text-xs font-medium tracking-wide"
            >
              {logo}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

