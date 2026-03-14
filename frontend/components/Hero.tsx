import Link from "next/link";

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
          <div className="mt-8">
            <Link
              href="/demo"
              className="inline-flex h-11 items-center justify-center rounded-full border border-emerald-400/90 bg-transparent px-10 text-sm font-semibold text-emerald-200 shadow-[0_0_0_1px_rgba(16,185,129,0.4)] hover:bg-emerald-400/10"
            >
              GET A DEMO →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

