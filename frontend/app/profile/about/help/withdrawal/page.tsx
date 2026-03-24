"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function ProfileAboutHelpWithdrawalPage() {
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
            About Withdrawal
          </h1>
        </div>
      </header>

      <div className="fp-container py-5">
        <div className="mx-auto max-w-md bg-white px-4 py-4 text-[20px] leading-tight text-black dark:bg-slate-800 dark:text-slate-100">
          <p>
            You can withdraw your balance{" "}
            <strong>after completing each set of tasks.</strong>
          </p>
          <p>
            Before withdrawing, make sure you already{" "}
            <strong>linked your bank account</strong> in your profile.
          </p>
          <p>
            <strong>Steps to withdraw:</strong>
          </p>
          <p>
            Enter the <strong>amount</strong> you want to withdraw
          </p>
          <p>
            Enter your <strong>withdrawal password</strong>
          </p>
          <p>Click the "Withdraw" button</p>
          <p>
            Wait for the bank to process your funds (arrival time may vary
            depending on your bank)
          </p>
          <p>
            <strong>⏰ Withdrawal Time:</strong>
          </p>
          <p>Your can only make withdrawals between 10:00 and 22:00 daily.</p>
          <p>
            <strong>💡 Please Note:</strong>
          </p>
          <p>
            After submitting your withdrawal, your remaining balance{" "}
            <strong>must be less than 1 Lakh.</strong>
          </p>
          <p>
            If you are withdrawing more than{" "}
            <strong>
              3 Lakh for the first time, a security fee of 50% of the
              withdrawal amount
            </strong>{" "}
            must be paid in advance to ensure account safety.
          </p>
          <p>
            This is a one-time verification process. Once the security fee is
            paid, your withdrawal will be reviewed and approved within 1 hour,
            and then sent to your bank account.
          </p>
          <p>
            If you have any questions, feel free to contact{" "}
            <strong>Honeywell Support</strong> for help.
          </p>
        </div>
      </div>
    </main>
  );
}
