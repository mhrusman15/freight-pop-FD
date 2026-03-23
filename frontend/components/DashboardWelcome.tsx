"use client";

import Link from "next/link";
import { getAuthUser, clearAuth } from "@/lib/auth-store";
import { useRouter } from "next/navigation";

export function DashboardWelcome() {
  const router = useRouter();
  const user = typeof window !== "undefined" ? getAuthUser() : null;

  if (!user) return null;

  const handleLogout = () => {
    clearAuth();
    router.push("/login");
  };

  return (
    <section className="fp-container pt-6 pb-4">
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800/50">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
          Welcome, {user.full_name}
        </h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Signed in as <span className="font-medium">{user.email}</span>
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <Link
            href="/dashboard/menu"
            className="rounded-lg bg-sky-600 px-3 py-2 text-sm font-medium text-white hover:bg-sky-700"
          >
            Profile &amp; Menu
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200"
          >
            Sign out
          </button>
        </div>
        <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-slate-500 dark:text-slate-400">Phone</dt>
            <dd className="font-medium text-slate-900 dark:text-white">{user.phone}</dd>
          </div>
          <div>
            <dt className="text-slate-500 dark:text-slate-400">Email</dt>
            <dd className="font-medium text-slate-900 dark:text-white">{user.email}</dd>
          </div>
        </dl>
      </div>
    </section>
  );
}
