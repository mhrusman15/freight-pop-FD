"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const HELP_ITEMS = [
  { label: "About Withdrawal", href: "/profile/about/help/withdrawal" },
  { label: "About Agent Mode", href: "/profile/about/help/agent-mode" },
  { label: "About Recharge", href: "/profile/about/help/recharge" },
  { label: "About Data Welfare Order", href: "/profile/about/help/data-welfare-order" },
  { label: "About Spinning Wheel", href: "/profile/about/help/spinning-wheel" },
  { label: "About Freeze", href: "/profile/about/help/freeze" },
  { label: "About Us", href: "/profile/about/help/about-us" },
  { label: "Company Profile", href: "/profile/about/help/company-profile" },
  { label: "VIP Benefit", href: "/profile/about/help/vip-benefit" },
];

export default function ProfileAboutHelpPage() {
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
            <div className="h-5 w-16 rounded bg-slate-200 dark:bg-slate-600" />
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
                : router.push("/profile/about")
            }
            className="absolute left-4 flex items-center text-slate-900 dark:text-slate-100 hover:text-slate-600 dark:hover:text-slate-300"
            aria-label="Back to about page"
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
            Help
          </h1>
        </div>
      </header>

      <div className="fp-container py-6">
        <div className="mx-auto max-w-sm rounded-xl bg-slate-200 p-3 dark:bg-slate-800">
          <ul className="divide-y divide-slate-300 dark:divide-slate-700">
            {HELP_ITEMS.map((item) => (
              <li key={item.label}>
                {item.href ? (
                  <Link
                    href={item.href}
                    className="flex w-full items-center justify-between py-4 text-left text-slate-900 dark:text-slate-100"
                  >
                    <span>{item.label}</span>
                    <span className="text-2xl leading-none text-slate-500 dark:text-slate-400">
                      ›
                    </span>
                  </Link>
                ) : (
                  <button
                    type="button"
                    className="flex w-full items-center justify-between py-4 text-left text-slate-900 dark:text-slate-100"
                  >
                    <span>{item.label}</span>
                    <span className="text-2xl leading-none text-slate-500 dark:text-slate-400">
                      ›
                    </span>
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </main>
  );
}
