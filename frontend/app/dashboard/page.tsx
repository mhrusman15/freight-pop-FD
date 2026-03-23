import Image from "next/image";
import Link from "next/link";
import { DashboardHeroWithAccountSlider } from "@/components/DashboardHeroWithAccountSlider";

export const metadata = { title: "User Dashboard | freightPOP" };

// Dashboard section images – place your files in: frontend/public/images/dashboard/
const SECTION_IMAGES = {
  automation: "/images/dashboard/automation.jpg",
  energyTransition: "/images/dashboard/energy-transition.jpg",
  aviation: "/images/dashboard/aviation.jpg",
} as const;

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      <DashboardHeroWithAccountSlider />

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
