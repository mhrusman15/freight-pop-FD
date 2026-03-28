"use client";

import Link from "next/link";
import { getUserData, clearAuth } from "@/lib/auth-store";
import { useRouter } from "next/navigation";

type Props = { isOpen: boolean; onClose: () => void };

export function AccountSliderMenu({ isOpen, onClose }: Props) {
  const router = useRouter();
  const user = typeof window !== "undefined" ? getUserData() : null;

  const handleLogout = () => {
    clearAuth("user");
    onClose();
    router.push("/login");
  };

  if (!user) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        role="button"
        tabIndex={0}
        aria-label="Close menu"
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
        onKeyDown={(e) => e.key === "Escape" && onClose()}
      />
      {/* Slider panel */}
      <aside
        className={`fixed top-0 right-0 z-50 h-full w-full max-w-sm bg-white shadow-xl transition-transform duration-300 ease-out dark:bg-slate-900 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col p-5">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4 dark:border-slate-700">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              Account
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-300"
              aria-label="Close menu"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="mt-6 flex-1">
            <p className="text-xl font-semibold text-slate-900 dark:text-white">
              Welcome, {user.full_name}
            </p>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Signed in as <span className="font-medium text-slate-800 dark:text-slate-200">{user.email}</span>
            </p>
            <dl className="mt-6 space-y-4">
              <div>
                <dt className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Phone
                </dt>
                <dd className="mt-1 font-medium text-slate-900 dark:text-white">{user.phone}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Email
                </dt>
                <dd className="mt-1 font-medium text-slate-900 dark:text-white">{user.email}</dd>
              </div>
            </dl>
            <div className="mt-8 flex flex-col gap-3">
              <Link
                href="/dashboard/menu"
                onClick={onClose}
                className="rounded-lg bg-sky-600 px-4 py-3 text-center text-sm font-medium text-white hover:bg-sky-700"
              >
                Profile &amp; Menu
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
