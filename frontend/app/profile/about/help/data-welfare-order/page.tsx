"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function ProfileAboutHelpDataWelfareOrderPage() {
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
            <div className="h-5 w-48 rounded bg-slate-200 dark:bg-slate-600" />
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
            About Data Welfare Order
          </h1>
        </div>
      </header>

      <div className="fp-container py-5">
        <div className="mx-auto max-w-md bg-white px-4 py-4 text-[20px] leading-tight text-black dark:bg-slate-800 dark:text-slate-100">
          <p>
            <strong>What is Luxury Order?</strong>
          </p>
          <p>
            Luxury Order is a strategic tool created by suppliers and merchants
            to increase the global visibility of their products and attract
            more agents to help boost sales.
          </p>
          <p>
            By offering Luxury Order, suppliers allow members to earn{" "}
            <strong>higher commissions</strong>, helping everyone increase their
            potential income.
          </p>
          <p>
            With Luxury Order, members can earn up to{" "}
            <strong>5x the regular commission</strong>. However,{" "}
            <strong>Luxury Order</strong> opportunities are rare - members
            usually encounter <strong>1 to 2 Luxury Order tasks</strong> per
            round.
          </p>
          <p>
            <strong>Important Reminder: Prestige Well Order</strong>
          </p>
          <p>
            When a welfare order appears, all members are{" "}
            <strong>required to complete the related tasks</strong>.
          </p>
          <p>
            Once completed, the <strong>pending amount will be returned</strong>{" "}
            to your balance. The amount shown in the Prestige Well Order is a{" "}
            <strong>temporary deposit</strong>, needed to proceed - it is not a
            fee or payment.
          </p>
        </div>
      </div>
    </main>
  );
}
