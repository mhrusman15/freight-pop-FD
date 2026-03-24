"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function ProfileAboutHelpSpinningWheelPage() {
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
            About Spinning Wheel
          </h1>
        </div>
      </header>

      <div className="fp-container py-5">
        <div className="mx-auto max-w-md bg-white px-4 py-4 text-[20px] leading-tight text-black dark:bg-slate-800 dark:text-slate-100">
          <p>
            <strong>Prestige Well X15 Reminder</strong>
          </p>
          <p>
            When a Power Prestige Well appears, members may have the
            opportunity to claim a <strong>RevBoost X15 bonus</strong>, which
            can significantly multiply their rewards.
          </p>
          <p>
            To activate the RevBoost X15, simply click the{" "}
            <strong>Spinning Wheel icon</strong> when it appears during the
            order process. This is your key to unlocking the bonus.
          </p>
          <p>
            If the Spinning Wheel is not clicked and the bonus is missed, don't
            worry members can contact <strong>Honeywell Support</strong> for
            assistance. Our team can help manually apply the Prestige Well X15
            benefit and allow you to continue without the wheel.
          </p>
          <p>
            <strong>Important Reminder: Prestige Well</strong>
          </p>
          <p>
            When a welfare order appears, <strong>all members are required to
            complete the tasks</strong> linked to it. These tasks must be
            finished in order to proceed.
          </p>
          <p>
            Once the task is completed, the{" "}
            <strong>pending amount will be returned</strong> to your balance.
            Please note: the amount shown in the welfare order is a{" "}
            <strong>temporary deposit</strong>, not a fee - it's required to
            begin the process.
          </p>
        </div>
      </div>
    </main>
  );
}
