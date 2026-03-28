"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";
import { clearAuth, getUserData, getUserToken } from "@/lib/auth-store";

function HamburgerIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 6h16M4 12h16M4 18h16"
      />
    </svg>
  );
}

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const token = getUserToken();
    const user = getUserData();
    const userLoggedIn = !!token && !!user && user.role !== "admin" && user.role !== "super_admin";
    setIsLoggedIn(userLoggedIn);
  }, [pathname]);

  const isProfileActive = pathname === "/profile";

  if (!isLoggedIn) {
    return null;
  }

  return (
    <header className="z-40 border-b border-white/10 bg-[#020b2f] text-white">
      <div className="fp-container flex h-16 items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {isLoggedIn && (
            <button
              type="button"
              onClick={() => setIsProfileOpen(true)}
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-white transition-colors hover:bg-white/10 ${
                isProfileActive || isProfileOpen ? "bg-white/10" : ""
              }`}
              aria-label="Open profile"
            >
              <HamburgerIcon className="h-6 w-6" />
            </button>
          )}
          <Link
            href={isLoggedIn ? "/dashboard" : "/"}
            className="flex items-center gap-2"
          >
            <Image
              src="/images/freightpop-logo.png"
              alt="FreightPOP"
              width={140}
              height={32}
              className="h-8 w-auto"
              priority
            />
          </Link>
        </div>

        <div className="flex items-center gap-3" />
      </div>
      {isLoggedIn && isProfileOpen && (
        <div
          className="fixed inset-0 z-50 flex bg-black/40"
          onClick={() => setIsProfileOpen(false)}
        >
          <aside
            className="relative flex h-full w-72 max-w-[85vw] flex-col bg-[#020b2f] shadow-xl transition-transform duration-200 ease-out"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex shrink-0 items-center justify-between border-b border-white/10 p-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded bg-white text-xs font-semibold text-[#020b2f]">
                  FP
                </div>
                <span className="text-sm font-semibold text-white">Menu</span>
              </div>
              <button
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded-full text-sky-100 hover:bg-white/10"
                onClick={() => setIsProfileOpen(false)}
                aria-label="Close menu"
              >
                ✕
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto p-4 text-sm text-sky-100/90">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-sky-200/70">
                Account
              </p>
              <ul className="space-y-0.5">
                <li>
                  <Link
                    href="/profile"
                    className="block rounded-md px-3 py-2.5 hover:bg-white/5"
                    onClick={() => setIsProfileOpen(false)}
                  >
                    View profile
                  </Link>
                </li>
                <li>
                  <Link
                    href="/profile/wallet"
                    className="block rounded-md px-3 py-2.5 hover:bg-white/5"
                    onClick={() => setIsProfileOpen(false)}
                  >
                    Wallet
                  </Link>
                </li>
                <li>
                  <Link
                    href="/dashboard"
                    className="block rounded-md px-3 py-2.5 hover:bg-white/5"
                    onClick={() => setIsProfileOpen(false)}
                  >
                    Dashboard
                  </Link>
                </li>
                <li>
                  <Link
                    href="/profile/level"
                    className="block rounded-md px-3 py-2.5 hover:bg-white/5"
                    onClick={() => setIsProfileOpen(false)}
                  >
                    Level
                  </Link>
                </li>
                <li>
                  <Link
                    href="/profile/theme"
                    className="block rounded-md px-3 py-2.5 hover:bg-white/5"
                    onClick={() => setIsProfileOpen(false)}
                  >
                    Appearance (Dark / Light)
                  </Link>
                </li>
                <li>
                  <Link
                    href="/profile/security"
                    className="block rounded-md px-3 py-2.5 hover:bg-white/5"
                    onClick={() => setIsProfileOpen(false)}
                  >
                    Security Center
                  </Link>
                </li>
              </ul>
              <div className="mt-6 pt-4 border-t border-white/10">
                <button
                  type="button"
                  className="w-full rounded-lg bg-[#2563eb] py-2.5 text-sm font-medium text-white hover:bg-[#1d4ed8]"
                  onClick={() => {
                    clearAuth("user");
                    setIsProfileOpen(false);
                    router.replace("/login");
                  }}
                >
                  Logout
                </button>
              </div>
            </nav>
          </aside>
        </div>
      )}
    </header>
  );
}

