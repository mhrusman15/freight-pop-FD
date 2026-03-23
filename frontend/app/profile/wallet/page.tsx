"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAuthUser, getToken } from "@/lib/auth-store";

export default function ProfileWalletPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [formData, setFormData] = useState({
    mobilePhone: "",
    accountHolderName: "",
    accountNumber: "",
    bankName: "",
    branch: "",
    routingNumber: "",
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const token = getToken();
    const user = getAuthUser();
    const isUserSession = !!token && !!user && user.role !== "admin" && user.role !== "super_admin";
    if (!isUserSession) {
      router.replace("/login");
      return;
    }
    setMounted(true);
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Form submission logic can be added here
  };

  if (!mounted) {
    return (
      <main className="min-h-screen bg-white dark:bg-slate-900">
        <header className="sticky top-0 z-20 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
          <div className="flex min-h-[3rem] items-center justify-center px-4">
            <div className="absolute left-4 h-6 w-6 rounded bg-slate-200 dark:bg-slate-600" />
            <div className="h-5 w-20 rounded bg-slate-200 dark:bg-slate-600" />
          </div>
        </header>
        <div className="fp-container py-8">
          <div className="mx-auto max-w-sm animate-pulse space-y-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-12 rounded-lg bg-slate-200 dark:bg-slate-700" />
            ))}
            <div className="h-12 rounded-lg bg-slate-200 dark:bg-slate-700" />
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
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-lg font-bold uppercase tracking-wide text-slate-900 dark:text-slate-100">
            User Wallet
          </h1>
        </div>
      </header>

      <div className="fp-container py-8">
        <form onSubmit={handleSubmit} className="mx-auto max-w-sm space-y-5">
          <div>
            <label
              htmlFor="mobilePhone"
              className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              Mobile phone number
            </label>
            <input
              id="mobilePhone"
              name="mobilePhone"
              type="tel"
              value={formData.mobilePhone}
              onChange={handleChange}
              placeholder=""
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-3 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label
              htmlFor="accountHolderName"
              className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              Account Holder Name
            </label>
            <input
              id="accountHolderName"
              name="accountHolderName"
              type="text"
              value={formData.accountHolderName}
              onChange={handleChange}
              placeholder=""
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-3 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label
              htmlFor="accountNumber"
              className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              Account Number
            </label>
            <input
              id="accountNumber"
              name="accountNumber"
              type="text"
              inputMode="numeric"
              value={formData.accountNumber}
              onChange={handleChange}
              placeholder=""
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-3 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label
              htmlFor="bankName"
              className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              Bank name
            </label>
            <input
              id="bankName"
              name="bankName"
              type="text"
              value={formData.bankName}
              onChange={handleChange}
              placeholder=""
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-3 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label
              htmlFor="branch"
              className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              Branch
            </label>
            <input
              id="branch"
              name="branch"
              type="text"
              value={formData.branch}
              onChange={handleChange}
              placeholder=""
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-3 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label
              htmlFor="routingNumber"
              className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              Routing Number
            </label>
            <input
              id="routingNumber"
              name="routingNumber"
              type="text"
              inputMode="numeric"
              value={formData.routingNumber}
              onChange={handleChange}
              placeholder=""
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-3 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-lg bg-orange-500 py-3.5 text-base font-semibold text-white shadow hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
          >
            Confirm
          </button>
        </form>
      </div>
    </main>
  );
}
