"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

const PROFIT_RATES: Record<number, string> = {
  0: "0.65%",
  1: "0.65%",
  2: "0.68%",
  3: "0.70%",
  4: "0.75%",
  5: "0.85%",
  6: "1.00%",
};

const BANNER_COLORS: Record<number, string> = {
  0: "bg-[#8b5a2b]",   // dark brown
  1: "bg-slate-600",   // dark grey
  2: "bg-amber-600",   // gold
  3: "bg-red-800",     // dark red
  4: "bg-amber-800",   // brown-gold
  5: "bg-emerald-800", // olive/green
  6: "bg-emerald-600", // green
};

const STAR_COLORS: Record<number, string> = {
  0: "text-amber-500",
  1: "text-slate-300",
  2: "text-amber-400",
  3: "text-rose-400",
  4: "text-amber-300",
  5: "text-lime-400",
  6: "text-emerald-400",
};

const LEVEL_6_DETAILS =
  "For every member once unlock VIP 6, withdrawal limit will be increase to maximum ৳15,00,000. If member withdrawal is more than ৳15,00,000. Member need to activate for a private own VIP Channel for withdrawing huge withdrawal for safety security reason.";

function LevelCard({
  level,
  showMoreDetails,
  onToggleMoreDetails,
}: {
  level: number;
  showMoreDetails: boolean;
  onToggleMoreDetails: () => void;
}) {
  const isLevel6 = level === 6;
  const bannerColor = BANNER_COLORS[level] ?? BANNER_COLORS[0];
  const starColor = STAR_COLORS[level] ?? STAR_COLORS[0];

  return (
    <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      {/* VIP Channel label - Level 6 only */}
      {isLevel6 && (
        <div className="absolute right-4 top-4 z-10 rounded border-2 border-red-500 bg-white px-2 py-1 text-xs font-semibold uppercase tracking-wide text-red-600">
          VIP Channel
        </div>
      )}

      {/* Ribbon banner with star */}
      <div
        className={`relative flex flex-col items-center pt-4 pb-6 ${bannerColor}`}
        style={{
          clipPath: "polygon(0 0, 100% 0, 100% 85%, 50% 100%, 0 85%)",
        }}
      >
        <div className="relative h-20 w-20 shrink-0">
          <Image
            src={`/images/level-${level}.png`}
            alt={`Level ${level}`}
            fill
            className="object-contain"
            sizes="80px"
            onError={(e) => {
              const target = e.currentTarget;
              target.style.display = "none";
              const fallback = target.nextElementSibling;
              if (fallback) (fallback as HTMLElement).style.display = "flex";
            }}
          />
          <div
            className={`absolute inset-0 hidden items-center justify-center ${starColor}`}
            aria-hidden
          >
            <svg className="h-16 w-16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-2xl font-bold text-white">
              {level}
            </span>
          </div>
        </div>
        <span className="mt-1 text-sm font-medium text-white">lvl{level}</span>
      </div>

      {/* Card body */}
      <div className="p-5">
        <p className="font-bold text-slate-900">
          Premium users receive general-purpose data collection access
        </p>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-slate-700">
          <li>Deposit in accordance with our renewal event</li>
          <li>Profit rate: {PROFIT_RATES[level]}</li>
          <li>Number of assignments: 29</li>
          <li>Better profit and permission</li>
          {isLevel6 && <li>Maximum withdrawal ৳15,00,000</li>}
        </ul>

        {/* Expandable details - Level 6 only */}
        {isLevel6 && (
          <>
            {showMoreDetails && (
              <p className="mt-4 rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
                {LEVEL_6_DETAILS}
              </p>
            )}
            <button
              type="button"
              onClick={onToggleMoreDetails}
              className="mt-4 w-full rounded-lg bg-emerald-600 px-4 py-3 font-semibold text-white transition hover:bg-emerald-700"
            >
              {showMoreDetails ? "Show less" : "More details"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function ProfileLevelPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [level6DetailsOpen, setLevel6DetailsOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem("adminEmail");
    const remembered = window.localStorage.getItem("adminRemember");
    if (!saved && remembered !== "true") {
      router.replace("/login");
      return;
    }
    setMounted(true);
  }, [router]);

  if (!mounted) {
    return (
      <main className="min-h-screen bg-slate-100">
        <header className="sticky top-0 z-20 bg-white">
          <div className="flex min-h-[3rem] items-center justify-center px-4">
            <div className="absolute left-4 h-6 w-6 rounded bg-slate-200" />
            <div className="h-5 w-24 rounded bg-slate-200" />
          </div>
          <div className="h-px bg-slate-200" />
        </header>
        <div className="fp-container py-6">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 rounded-xl bg-white" />
            ))}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100">
      {/* Top header: back + centered "Level" + divider */}
      <header className="sticky top-0 z-20 bg-white">
        <div className="flex min-h-[3rem] items-center justify-center px-4">
          <button
            type="button"
            onClick={() => (typeof window !== "undefined" && window.history.length > 1 ? router.back() : router.push("/profile"))}
            className="absolute left-4 flex items-center text-slate-900 hover:text-slate-600"
            aria-label="Back to profile"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-lg font-bold text-slate-900">User Level</h1>
        </div>
        <div className="h-px bg-slate-200" aria-hidden />
      </header>
      <div className="fp-container py-6">
        <div className="mx-auto max-w-xl space-y-6">
          {[0, 1, 2, 3, 4, 5, 6].map((level) => (
            <LevelCard
              key={level}
              level={level}
              showMoreDetails={level6DetailsOpen}
              onToggleMoreDetails={() => setLevel6DetailsOpen((v) => !v)}
            />
          ))}
        </div>
      </div>
    </main>
  );
}
