"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";

export default function CreditScorePage() {
  const router = useRouter();
  return (
    <main className="min-h-screen bg-white text-slate-900">
      {/* Full-page background */}
      <div className="fixed inset-0 z-0">
        <Image
          src="/images/login-hero.jpeg"
          alt=""
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-white/90 backdrop-blur-sm" />
      </div>

      <div className="relative z-10 flex min-h-screen flex-col">
        {/* Header with back arrow and title */}
        <header className="flex items-center gap-3 px-4 py-4">
          <button
            type="button"
            onClick={() => (typeof window !== "undefined" && window.history.length > 1 ? router.back() : router.push("/dashboard"))}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-slate-700 transition-colors hover:bg-slate-200/80"
            aria-label="Back to dashboard"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="flex-1 text-center text-xl font-bold text-slate-900 pr-10">
            User Credit Score
          </h1>
        </header>

        {/* Credit score circular display */}
        <section className="flex flex-1 flex-col items-center px-6 pt-6">
          <div className="relative flex flex-col items-center">
            <div className="flex h-44 w-44 items-center justify-center rounded-full border-4 border-blue-500 bg-white/95 shadow-lg">
              <div className="flex flex-col items-center">
                <span className="text-4xl font-bold text-green-600">100</span>
                <span className="mt-1 text-sm font-medium text-slate-800">credit score</span>
              </div>
            </div>
          </div>

          {/* Credit Score Rules */}
          <div className="mt-10 w-full max-w-2xl space-y-6 pb-12">
            <h2 className="text-lg font-bold text-slate-900">Credit Score Rules</h2>

            <div className="space-y-4 text-sm leading-relaxed text-slate-700">
              <p>
                <strong>Maintenance:</strong> You must log in and stay active to maintain your credit score. Inactivity or failing to meet activity requirements may result in score deductions or limits on certain features.
              </p>
              <p>
                <strong>Restrictions:</strong> If your credit score falls below the required level, you may be restricted from receiving tasks or requesting withdrawals until your score is restored.
              </p>
              <p>
                <strong>Restoration:</strong> Complete tasks on time and avoid cancellations to restore your score. Positive activity and consistent performance will help recover lost points.
              </p>
              <p>
                <strong>Notifications:</strong> The system will notify you if your credit score is at risk, giving you the opportunity to take corrective action before restrictions apply.
              </p>
              <p>
                <strong>Misuse:</strong> Misusing the system or claiming rewards dishonestly will result in account suspension or permanent ban. Always follow platform guidelines.
              </p>
              <p>
                <strong>Withdrawals &amp; Benefits:</strong> Withdrawals are only permitted when your credit score is 100 points. A perfect score grants you full access to all platform benefits.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
