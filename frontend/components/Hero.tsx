function Eyebrow() {
  return (
    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-200/80">
      AI Supply Chain Software
    </p>
  );
}

export function Hero() {
  return (
    <section className="border-b border-white/10 pb-24 pt-20 bg-transparent">
      <div className="fp-container flex flex-col items-center text-center">
        <div className="max-w-3xl space-y-6">
          <Eyebrow />
          <h1 className="text-4xl font-semibold leading-tight tracking-tight text-white sm:text-5xl md:text-[52px]">
            AI Supply Chain Software
          </h1>
          <p className="text-base text-sky-100/90 md:text-lg">
            Intelligence that moves your supply chain
          </p>
        </div>
      </div>
    </section>
  );
}

