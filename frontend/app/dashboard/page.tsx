import Image from "next/image";
import Link from "next/link";

// Dashboard section images – place your files in: frontend/public/images/dashboard/
const SECTION_IMAGES = {
  automation: "/images/dashboard/automation.jpg",
  energyTransition: "/images/dashboard/energy-transition.jpg",
  aviation: "/images/dashboard/aviation.jpg",
} as const;

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      {/* Top hero with background video */}
      <section className="relative h-[520px] w-full overflow-hidden">
        <video
          className="absolute inset-0 h-full w-full object-cover"
          src="/videos/intro.mp4"
          autoPlay
          loop
          muted
          playsInline
        />

        <div className="relative z-10 flex h-full flex-col">
          {/* Top bar */}
          <header className="flex items-center justify-between px-4 pt-4">
            <div className="text-lg font-semibold tracking-tight text-white">
              freightPOP
            </div>
            <div className="flex items-center gap-3 text-white">
              <Link
                href="/dashboard/credit-score"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-black/30 backdrop-blur-sm text-white transition-opacity hover:bg-black/40"
                aria-label="Credit score"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </Link>
              <Link
                href="/dashboard/menu"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-black/30 backdrop-blur-sm overflow-hidden ring-2 ring-white/50 text-white transition-opacity hover:bg-black/40"
                aria-label="Profile menu"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path fillRule="evenodd" d="M12 2C9.79 2 8 3.79 8 6s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0 6c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" clipRule="evenodd" />
                </svg>
              </Link>
            </div>
          </header>

          {/* Hero copy */}
          <div className="mt-auto px-4 pb-10">
            <p className="text-xs font-semibold tracking-[0.2em] text-red-400">
            freightPOP IOT CYBERSECURITY
            </p>
            <h1 className="mt-1 text-2xl font-bold leading-snug text-white">
              2025 THREAT REPORT
            </h1>
            <p className="mt-3 max-w-xs text-xs leading-relaxed text-slate-100">
              Our 2025 report found ransomware attacks targeting industrial
              operators surged 46% in one quarter. Discover the latest OT
              security threats, vulnerabilities and how we can help.
            </p>
            <Link
              href="/dashboard/report"
              className="mt-4 inline-flex items-center rounded-sm bg-sky-500 px-5 py-2 text-xs font-semibold uppercase tracking-wide text-white shadow-md"
            >
              Download report
            </Link>
          </div>
        </div>

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/50" />
      </section>

      {/* Main content */}
      <section className="fp-container space-y-10 pb-16 pt-10">
        {/* Mega trends copy */}
        <div className="space-y-4">
          <h2 className="max-w-xs text-3xl font-semibold leading-tight">
            Delivering Mega Results On Mega Trends
          </h2>
          <p className="max-w-md text-sm leading-relaxed text-slate-700">
            freightPOP has been at the center of logistics innovation for over
            a decade. Now, we&apos;re bringing a digital-first, outcome-based
            approach to the next generation of megatrends.
          </p>
        </div>

        {/* Three vertical cards – square image left, text right */}
        <div className="space-y-6">
          <article className="flex gap-4">
            <div className="relative h-32 w-32 flex-shrink-0 overflow-hidden rounded-sm bg-slate-200">
              <Image
                src={SECTION_IMAGES.automation}
                alt="Automation – next generation automation tech"
                fill
                className="object-cover"
                sizes="128px"
              />
            </div>
            <div className="space-y-1">
              <p className="text-[11px] font-semibold tracking-[0.2em] text-slate-500 uppercase">
                Automation
              </p>
              <p className="text-sm font-semibold leading-snug">
                We&apos;re ushering in the next generation in automation tech.
              </p>
            </div>
          </article>

          <article className="flex gap-4">
            <div className="relative h-32 w-32 flex-shrink-0 overflow-hidden rounded-sm bg-slate-200">
              <Image
                src={SECTION_IMAGES.energyTransition}
                alt="Energy Transition – cleaner, smarter energy"
                fill
                className="object-cover"
                sizes="128px"
              />
            </div>
            <div className="space-y-1">
              <p className="text-[11px] font-semibold tracking-[0.2em] text-slate-500 uppercase">
                Energy Transition
              </p>
              <p className="text-sm font-semibold leading-snug">
                Stay ahead of global demand for cleaner, smarter, more available
                energy.
              </p>
            </div>
          </article>

          <article className="flex gap-4">
            <div className="relative h-32 w-32 flex-shrink-0 overflow-hidden rounded-sm bg-slate-200">
              <Image
                src={SECTION_IMAGES.aviation}
                alt="Aviation – digital solutions revolutionizing aviation"
                fill
                className="object-cover"
                sizes="128px"
              />
            </div>
            <div className="space-y-1">
              <p className="text-[11px] font-semibold tracking-[0.2em] text-slate-500 uppercase">
                Aviation
              </p>
              <p className="text-sm font-semibold leading-snug">
                From airports to outer space, we&apos;re using digital solutions
                to revolutionize aviation.
              </p>
            </div>
          </article>
        </div>

        {/* What we do list */}
        <section className="space-y-5">
          <h3 className="text-xl font-semibold">What We Do</h3>
          <ul className="divide-y divide-slate-200 rounded-md border border-slate-200 bg-white">
            {[
              'Aerospace',
              'Commercial Buildings',
              'Data Centers',
              'Healthcare',
              'Life Sciences',
              'Manufacturing',
              'Oil & Gas',
              'Retail',
              'Utilities',
              'Warehouse and Logistics',
            ].map((item) => (
              <li
                key={item}
                className="flex items-center justify-between px-4 py-3 text-sm"
              >
                <span>{item}</span>
                <span className="h-5 w-5 rounded-full border border-slate-300" />
              </li>
            ))}
          </ul>
        </section>
      </section>

      {/* Bottom section with background video and translucent text card */}
      <section className="relative mt-4 h-[420px] w-full overflow-hidden">
        <video
          className="absolute inset-0 h-full w-full object-cover"
          src="/videos/intro2.mp4"
          autoPlay
          loop
          muted
          playsInline
        />

        <div className="absolute inset-0 bg-black/50" />

        <div className="relative z-10 flex h-full items-center justify-center px-6">
          <div className="max-w-sm rounded-xl bg-white/85 px-6 py-6 text-center shadow-xl backdrop-blur-md">
            <h3 className="text-lg font-semibold leading-snug text-slate-900">
              Purpose-Built. Future-Focused.
            </h3>
            <p className="mt-3 text-xs leading-relaxed text-slate-700">
              freightPOP is a future-ready logistics platform delivering
              AI-enabled applications and services for intelligent, efficient
              and more secure transportation operations.
            </p>
            <Link
              href="/dashboard/report"
              className="mt-5 inline-flex items-center rounded-sm bg-sky-500 px-6 py-2 text-xs font-semibold uppercase tracking-wide text-white shadow-md"
            >
              Grab order
            </Link>
          </div>
        </div>

        <footer className="relative z-10 mx-auto max-w-md px-4 pb-6 pt-4 text-[11px] text-slate-200">
          <p className="text-[10px] text-slate-300">
            Copyright © 2025 freightPOP.
          </p>
          <div className="mt-1 flex gap-4 text-[10px]">
            <button type="button" className="underline underline-offset-2">
              Terms &amp; Conditions
            </button>
            <button type="button" className="underline underline-offset-2">
              Privacy Statement
            </button>
          </div>
        </footer>
      </section>
    </main>
  );
}
