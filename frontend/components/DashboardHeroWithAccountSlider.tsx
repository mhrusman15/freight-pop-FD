"use client";

import { useState } from "react";
import Link from "next/link";
import { AccountSliderMenu } from "./AccountSliderMenu";

export function DashboardHeroWithAccountSlider() {
  const [sliderOpen, setSliderOpen] = useState(false);

  return (
    <>
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
          <header className="flex items-center justify-end px-4 pt-4">
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
              <button
                type="button"
                onClick={() => setSliderOpen(true)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-black/30 backdrop-blur-sm ring-2 ring-white/50 text-white transition-opacity hover:bg-black/40"
                aria-label="Account menu"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path fillRule="evenodd" d="M12 2C9.79 2 8 3.79 8 6s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0 6c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </header>

          <div className="mt-auto px-4 pb-10">
            <h1 className="mt-1 text-2xl font-bold leading-snug text-white">
              User Dashboard
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

      <AccountSliderMenu isOpen={sliderOpen} onClose={() => setSliderOpen(false)} />
    </>
  );
}
