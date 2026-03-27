"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function ProfileAboutHelpRechargePage() {
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
            <div className="h-5 w-32 rounded bg-slate-200 dark:bg-slate-600" />
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
            About Recharge
          </h1>
        </div>
      </header>

      <div className="fp-container py-5">
        <div className="mx-auto max-w-md bg-white px-4 py-4 text-[20px] leading-tight text-black dark:bg-slate-800 dark:text-slate-100">
          <p>
            <strong>Recharge Instructions</strong>
          </p>
          <p>
            To recharge your account, please visit the <strong>"Personal"</strong>{" "}
            page and click on the <strong>"Recharge"</strong> button. You will
            be redirected to <strong>Freight-pop Support</strong>, where the
            latest payment instructions and designated account details are
            provided.
          </p>
          <p>
            After completing the transfer, please{" "}
            <strong>upload a screenshot of the successful transaction</strong>{" "}
            to the system.
          </p>
          <p>
            Make sure that the <strong>recipient name and transferred amount</strong>{" "}
            exactly match the information shown on the{" "}
            <strong>Zetes Prime Support</strong> page.
          </p>
          <p>
            <strong>⚠️ Important Notes:</strong>
          </p>
          <p>
            Always verify the recharge account number before transferring, as
            account details may occasionally change for security reasons.
          </p>
          <p>
            <strong>
              If you have any questions, please confirm with Freight-pop Prime
              Support first.
            </strong>
          </p>
          <p>
            You may use a third-party bank account to transfer funds, but
            please ensure the screenshot clearly shows the transaction details
            and the source of payment. This helps us verify and protect your
            account.
          </p>
          <p>
            For your account's safety, transactions with incomplete or
            inconsistent information may be delayed or rejected.
          </p>
          <p>
            If you experience any difficulties during the recharge process, our{" "}
            <strong>Freight-pop Support</strong> team is available to assist you
            in real time.
          </p>
        </div>
      </div>
    </main>
  );
}
