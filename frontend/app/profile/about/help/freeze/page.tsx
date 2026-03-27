"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function ProfileAboutHelpFreezePage() {
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
            <div className="h-5 w-28 rounded bg-slate-200 dark:bg-slate-600" />
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
            About Freeze
          </h1>
        </div>
      </header>

      <div className="fp-container py-5">
        <div className="mx-auto max-w-md bg-white px-4 py-4 text-[20px] leading-tight text-black dark:bg-slate-800 dark:text-slate-100">
          <p>
            When an order is assigned but not yet completed, its status will
            appear as <strong>"Processing"</strong>.
          </p>
          <p>
            To proceed, simply click the <strong>"Order"</strong> button to
            begin and complete the outstanding task. The order is temporarily
            reserved for you because the system has assigned you a{" "}
            <strong>ZetX</strong>.
          </p>
          <p>
            Once you successfully complete the assigned{" "}
            <strong>Prime order</strong>, the corresponding order will be
            released and marked as completed.
          </p>
          <p>
            <strong>Important Notice:</strong>
          </p>
          <p>
            If you're unable to complete your current task within{" "}
            <strong>24 hours</strong>, and you <strong>don't request an extension</strong>{" "}
            through <strong>Freight-pop Support</strong>, your{" "}
            <strong>reputation score</strong> may be negatively affected. A
            lower reputation score can:
          </p>
          <p>
            Impact your ability to <strong>withdraw earnings</strong>
          </p>
          <p>
            In more serious cases, lead to{" "}
            <strong>temporary or permanent account deactivation</strong>
          </p>
          <p>
            If your reputation score drops <strong>below the healthy threshold</strong>, your{" "}
            <strong>Working Account</strong> may be automatically deactivated.
          </p>
          <p>
            To reactivate your account, a <strong>reinstatement fee</strong>{" "}
            may be required.
          </p>
          <p>
            To ensure uninterrupted access and the ability to withdraw funds,{" "}
            <strong>please maintain a healthy reputation score at all times</strong>.
          </p>
          <p>
            For any delays, concerns, or extensions, please contact{" "}
            <strong>Freight-pop Support</strong> in advance.
          </p>
        </div>
      </div>
    </main>
  );
}
