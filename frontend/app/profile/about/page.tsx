"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const APP_VERSION = "2.1.8";

export default function ProfileAboutPage() {
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
      <main className="min-h-screen bg-white dark:bg-slate-900">
        <header className="sticky top-0 z-20 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
          <div className="flex min-h-[3rem] items-center justify-center px-4">
            <div className="absolute left-4 h-6 w-6 rounded bg-slate-200 dark:bg-slate-600" />
            <div className="h-5 w-24 rounded bg-slate-200 dark:bg-slate-600" />
          </div>
        </header>
        <div className="fp-container py-12">
          <div className="mx-auto max-w-sm animate-pulse space-y-6">
            <div className="h-12 rounded bg-slate-200 dark:bg-slate-700" />
            <div className="h-24 rounded bg-slate-200 dark:bg-slate-700" />
            <div className="h-24 rounded bg-slate-200 dark:bg-slate-700" />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white dark:bg-slate-900">
      <header className="sticky top-0 z-20 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
        <div className="flex min-h-[3rem] items-center justify-center px-4">
          <button
            type="button"
            onClick={() => (typeof window !== "undefined" && window.history.length > 1 ? router.back() : router.push("/profile"))}
            className="absolute left-4 flex items-center text-slate-900 dark:text-slate-100 hover:text-slate-600 dark:hover:text-slate-300"
            aria-label="Back to profile"
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
            About Us
          </h1>
        </div>
      </header>

      <div className="fp-container py-8">
        <div className="mx-auto flex max-w-sm flex-col items-center">
          {/* Logo / Brand */}
          <div className="mb-8 mt-4">
            <span className="font-semibold tracking-tight text-[#dc2626] text-2xl sm:text-3xl">
              FreightPOP
            </span>
          </div>

          {/* Terms & Conditions, User Agreement & Privacy Policy */}
          <div className="w-full space-y-3">
            <Link
              href="/profile/about/terms-and-conditions"
              className="block w-full rounded-xl bg-slate-100 dark:bg-slate-800 px-4 py-3.5 text-center text-sm font-medium text-slate-900 dark:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              Terms & Conditions
            </Link>
            <Link
              href="/profile/about/user-agreement"
              className="block w-full rounded-xl bg-slate-100 dark:bg-slate-800 px-4 py-3.5 text-center text-sm font-medium text-slate-900 dark:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              User Agreement
            </Link>
            <Link
              href="/profile/about/privacy-policy"
              className="block w-full rounded-xl bg-slate-100 dark:bg-slate-800 px-4 py-3.5 text-center text-sm font-medium text-slate-900 dark:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              Privacy Policy
            </Link>
          </div>

          {/* Version */}
          <Link
            href="/profile/about/help"
            className="mt-8 inline-flex items-center gap-1 text-center text-sm text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
          >
            Check version{" "}
            <span className="font-semibold text-slate-900 dark:text-slate-100">
              {APP_VERSION}
            </span>
          </Link>
        </div>
      </div>
    </main>
  );
}
