"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function ProfileAboutHelpAgentModePage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

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
      <main className="min-h-screen bg-slate-100 dark:bg-slate-900">
        <header className="sticky top-0 z-20 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
          <div className="flex min-h-[3rem] items-center justify-center px-4">
            <div className="absolute left-4 h-6 w-6 rounded bg-slate-200 dark:bg-slate-600" />
            <div className="h-5 w-40 rounded bg-slate-200 dark:bg-slate-600" />
          </div>
        </header>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 dark:bg-slate-900">
      <header className="sticky top-0 z-20 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
        <div className="flex min-h-[3rem] items-center justify-center px-4">
          <button
            type="button"
            onClick={() =>
              typeof window !== "undefined" && window.history.length > 1
                ? router.back()
                : router.push("/profile/about/help")
            }
            className="absolute left-4 flex items-center text-slate-900 dark:text-slate-100 hover:text-slate-600 dark:hover:text-slate-300"
            aria-label="Back to help page"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            About Agent Mode
          </h1>
        </div>
      </header>

      <div className="fp-container py-5">
        <div className="mx-auto max-w-md bg-white px-4 py-4 text-[20px] leading-tight text-black dark:bg-slate-800 dark:text-slate-100">
          <p>
            <strong>
              Team Commission Explanation - How You Earn from Your Team
            </strong>
          </p>
          <p>
            As a platform user, you can invite others to join as agents using
            your <strong>invitation code</strong>. Once they register, they
            become your <strong>downline</strong>, and you become their{" "}
            <strong>upline</strong>.
          </p>
          <p>
            As an upline, you'll earn a{" "}
            <strong>percentage of commission</strong> from the orders your
            downlines complete - this is paid directly to your platform account
            as a <strong>team reward</strong>. You can track all your earnings
            and team activity in the <strong>Team Report</strong> section.
          </p>
          <p>Here's how the commission is distributed:</p>
          <p>
            ✅ 10% commission from your <strong>Tier 1</strong> agents (people
            you directly invited)
          </p>
          <p>
            ✅ 5% commission from your <strong>Tier 2</strong> agents (invited
            by your Tier 1 agents)
          </p>
          <p>
            ✅ 3% commission from your <strong>Tier 3</strong> agents (invited
            by your Tier 2 agents)
          </p>
          <p>
            <strong>🟦 Important Note:</strong>
          </p>
          <p>
            All agents on the platform enjoy the{" "}
            <strong>same commission rate and rewards</strong> for their
            personal tasks. Building a team does not reduce your downline's
            earnings - it simply <strong>adds extra income</strong> for you as
            the upline.
          </p>
        </div>
      </div>
    </main>
  );
}
