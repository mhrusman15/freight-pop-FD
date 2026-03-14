"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

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

const primaryNav = [
  { label: "Home", href: "#", active: true },
  { label: "FreightPOP Intelligence", href: "#" },
  { label: "Solutions", href: "#" },
  { label: "Resources", href: "#" },
  { label: "Pricing", href: "#" },
  { label: "Partners", href: "#" },
  { label: "About Us", href: "/profile/about" },
];

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const remembered = window.localStorage.getItem("adminRemember") === "true";
    const hasEmail = !!window.localStorage.getItem("adminEmail");
    setIsLoggedIn(remembered || hasEmail);
  }, [pathname]);

  const isProfileActive = pathname === "/profile";

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
            <div className="flex h-8 w-8 items-center justify-center rounded bg-white text-xs font-semibold text-[#020b2f]">
              FP
            </div>
            <span className="text-sm font-semibold tracking-wide text-white">
              FreightPOP
            </span>
          </Link>
        </div>

        <nav className="hidden items-center gap-6 text-xs md:flex">
          {primaryNav.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={`pb-1 transition-colors ${
                item.active
                  ? "border-b-2 border-white font-semibold text-white"
                  : "text-sky-100/80 hover:text-white"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {!isLoggedIn && (
            <Link
              href="/login"
              className="hidden h-9 items-center justify-center rounded-full border border-white/30 px-3 text-xs font-medium text-sky-100 hover:border-white md:inline-flex"
            >
              Login
            </Link>
          )}
          <Link
            href="/demo"
            className="inline-flex h-9 items-center justify-center rounded-full bg-[#3b82f6] px-4 text-xs font-semibold text-white shadow hover:bg-[#2563eb]"
          >
            Get a Demo
          </Link>
        </div>
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
                Navigation
              </p>
              <ul className="space-y-0.5">
                {primaryNav.map((item) => (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      className="block rounded-md px-3 py-2.5 hover:bg-white/5"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
              <p className="mb-2 mt-6 text-xs font-semibold uppercase tracking-wider text-sky-200/70">
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
                    if (typeof window !== "undefined") {
                      window.localStorage.removeItem("adminEmail");
                      window.localStorage.removeItem("adminRemember");
                    }
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

