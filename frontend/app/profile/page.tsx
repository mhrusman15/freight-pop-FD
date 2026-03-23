"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAssetBalance } from "@/lib/use-asset-balance";
import { getAuthUser, getToken } from "@/lib/auth-store";

export default function ProfilePage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [mounted, setMounted] = useState(false);
  const { formatted: assetBalanceFormatted } = useAssetBalance();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const token = getToken();
    const user = getAuthUser();
    if (!token || !user) {
      router.replace("/login");
      return;
    }
    setEmail(user.email);
  }, [router]);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <main className="min-h-screen bg-slate-100 dark:bg-slate-900">
      <div className="fp-container py-8">
        <div className="mx-auto max-w-lg overflow-hidden rounded-2xl bg-white dark:bg-slate-800 shadow-md">
          <div className="relative min-h-[220px] overflow-hidden px-6 py-8 text-white">
            <h1 className="sr-only">User Profile</h1>
            <Image
              src="/images/login-hero.jpeg"
              alt=""
              fill
              className="object-cover"
              sizes="(max-width: 512px) 100vw, 512px"
              priority
            />
            <div className="absolute inset-0 bg-black/40" aria-hidden />
            <div className="relative z-10 flex flex-col">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white/20">
                <svg
                  className="h-8 w-8 text-white"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden
                >
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                </svg>
              </div>
              <div>
                <p className="font-semibold">
                  {email ? `${email.slice(0, 3)}***${email.slice(-4)}` : "User"}
                </p>
                <span className="inline-block rounded bg-amber-700/90 px-2 py-0.5 text-xs font-medium">
                  lvl1
                </span>
                <p className="mt-1 text-xs text-white/80">UID: 17181</p>
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <Link
                href="/profile/deposit"
                className="flex-1 rounded-lg bg-white/20 px-4 py-2.5 text-sm font-medium hover:bg-white/30 text-center"
              >
                Deposit
              </Link>
              <Link
                href="/profile/withdraw"
                className="flex-1 rounded-lg bg-[#1d4ed8] px-4 py-2.5 text-sm font-medium hover:bg-[#1e40af] text-center"
              >
                Withdraw
              </Link>
            </div>
            </div>
          </div>
          <div className="space-y-1 border-b border-slate-200 dark:border-slate-700 p-4">
            <div className="flex items-center justify-between py-2">
              <span className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                Asset Balance
              </span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                {mounted ? assetBalanceFormatted : "—"}
              </span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                Daily Profit
              </span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">Rs 0</span>
            </div>
          </div>
          <div className="p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Referral Programme
            </p>
            <ul className="space-y-1">
              <li>
                <Link
                  href="/profile/wallet"
                  className="flex items-center justify-between rounded-lg px-3 py-2.5 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                >
                  Wallet
                  <span className="text-slate-400">›</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/profile/level"
                  className="flex items-center justify-between rounded-lg px-3 py-2.5 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                >
                  Level
                  <span className="text-slate-400">›</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/profile/about"
                  className="flex items-center justify-between rounded-lg px-3 py-2.5 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                >
                  About Us
                  <span className="text-slate-400">›</span>
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="flex items-center justify-between rounded-lg px-3 py-2.5 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                >
                  Contact Us
                  <span className="text-slate-400">›</span>
                </Link>
              </li>
            </ul>
            <p className="mb-2 mt-6 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Settings
            </p>
            <ul className="space-y-1">
              <li>
                <Link
                  href="/profile/theme"
                  className="flex items-center justify-between rounded-lg px-3 py-2.5 text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  User Theme (Dark / Light)
                  <span className="text-slate-400">›</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/profile/security"
                  className="flex items-center justify-between rounded-lg px-3 py-2.5 text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  User Security
                  <span className="text-slate-400">›</span>
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="flex items-center justify-between rounded-lg px-3 py-2.5 text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Account Details
                  <span className="text-slate-400">›</span>
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
}
