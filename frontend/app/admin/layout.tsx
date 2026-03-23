"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getToken, getAuthUser, isAdmin, clearAuth, getLastActive, touchLastActive } from "@/lib/auth-store";
import { adminApi } from "@/lib/api";

function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const m = window.matchMedia(query);
    setMatches(m.matches);
    const handler = () => setMatches(m.matches);
    m.addEventListener("change", handler);
    return () => m.removeEventListener("change", handler);
  }, [query]);
  return matches;
}

type NavItem = {
  href: string;
  label: string;
  icon: keyof typeof iconPaths;
  badge?: "pending";
};

const navItems: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: "dashboard" },
  { href: "/admin/users", label: "Users", icon: "users" },
  { href: "/admin/approvals", label: "Pending Approvals", icon: "approvals", badge: "pending" },
  { href: "/admin/admins", label: "Admins", icon: "admins" },
  { href: "/admin/settings", label: "Settings", icon: "settings" },
];

const iconPaths: Record<string, React.ReactNode> = {
  dashboard: (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
  ),
  users: (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  ),
  approvals: (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  ),
  admins: (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  ),
  settings: (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
  ),
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const MAX_IDLE_MS = 60 * 60 * 1000; // 1 hour
  const isAdminLoginRoute = pathname === "/admin/login";

  // Close mobile sidebar when switching to desktop or on route change
  useEffect(() => {
    if (isDesktop) setSidebarOpen(false);
  }, [isDesktop, pathname]);

  useEffect(() => {
    if (isAdminLoginRoute) {
      setAllowed(true);
      return;
    }
    if (typeof window === "undefined") return;
    const token = getToken();
    const admin = isAdmin();
    const lastActive = getLastActive();
    const now = Date.now();
    const expired = !!lastActive && now - lastActive > MAX_IDLE_MS;
    if (!token || !admin || expired) {
      clearAuth("admin");
      const redirect = encodeURIComponent(pathname || "/admin");
      const sessionParam = expired ? "&session=expired" : "";
      router.replace(`/admin/login?redirect=${redirect}${sessionParam}`);
      return;
    }
    touchLastActive();
    setAllowed(true);
  }, [pathname, router, isAdminLoginRoute]);

  // Idle timeout: keep session for 1 hour of inactivity.
  useEffect(() => {
    if (isAdminLoginRoute) return;
    if (!allowed) return;
    if (typeof window === "undefined") return;

    const activityHandler = () => {
      touchLastActive();
    };

    const events: (keyof WindowEventMap)[] = ["click", "keydown", "mousemove", "scroll", "focus"];
    events.forEach((evt) => window.addEventListener(evt, activityHandler));

    const interval = window.setInterval(() => {
      const lastActive = getLastActive();
      if (!lastActive) return;
      const now = Date.now();
      if (now - lastActive > MAX_IDLE_MS) {
        clearAuth("admin");
        const redirect = encodeURIComponent(pathname || "/admin");
        router.replace(`/admin/login?redirect=${redirect}&session=expired`);
      }
    }, 60 * 1000);

    return () => {
      events.forEach((evt) => window.removeEventListener(evt, activityHandler));
      window.clearInterval(interval);
    };
  }, [allowed, pathname, router, MAX_IDLE_MS, isAdminLoginRoute]);

  useEffect(() => {
    if (isAdminLoginRoute) return;
    if (!allowed) return;
    adminApi.getPending({ page: 1, limit: 1 }).then((res) => {
      if (res.data) setPendingCount(res.data.total);
    });
    const interval = setInterval(() => {
      adminApi.getPending({ page: 1, limit: 1 }).then((res) => {
        if (res.data) setPendingCount(res.data.total);
      });
    }, 30000);
    return () => clearInterval(interval);
  }, [allowed, isAdminLoginRoute]);

  const user = typeof window !== "undefined" ? getAuthUser() : null;

  if (isAdminLoginRoute) {
    return <>{children}</>;
  }

  if (allowed !== true) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 dark:bg-slate-900">
        <p className="text-slate-500 dark:text-slate-400">Checking access...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-100 dark:bg-slate-900">
      {/* Mobile overlay when sidebar is open */}
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close menu"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-30 flex w-64 max-w-[85vw] flex-col border-r border-slate-200 bg-slate-900 dark:border-slate-700 transition-transform duration-200 ease-out lg:translate-x-0 lg:max-w-none ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-14 min-h-[3.5rem] items-center justify-between gap-2 border-b border-slate-700 px-4 lg:h-16">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-500">
              <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6z" />
              </svg>
            </div>
            <span className="text-base font-semibold tracking-tight text-white lg:text-lg">
              Admin
            </span>
          </div>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close menu"
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white lg:hidden"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
          <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Overview
          </p>
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
            const showBadge = item.badge === "pending" && pendingCount > 0;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-emerald-500/20 text-emerald-400"
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <svg className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {iconPaths[item.icon]}
                </svg>
                <span className="flex-1 truncate">{item.label}</span>
                {showBadge && (
                  <span className="min-w-[1.25rem] flex-shrink-0 rounded-full bg-red-500 px-1.5 py-0.5 text-center text-xs font-semibold text-white">
                    {pendingCount > 99 ? "99+" : pendingCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-slate-700 p-3">
          <div className="flex items-center gap-3 rounded-lg px-3 py-2 text-slate-400">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-slate-700 text-sm font-medium text-white">
              {user?.full_name?.charAt(0)?.toUpperCase() || "A"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">{user?.full_name || "Admin"}</p>
              <p className="truncate text-xs text-slate-500">
                {user?.role === "super_admin"
                  ? "Super Admin"
                  : user?.admin_permissions
                  ? `Admin • ${user.admin_permissions}`
                  : "Admin"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              clearAuth("admin");
              router.push("/admin/login");
            }}
            className="mt-2 w-full rounded-lg px-3 py-2 text-left text-xs font-medium text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            Sign out
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col lg:pl-64">
        <header className="sticky top-0 z-10 flex h-14 min-h-[3.5rem] flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-white/95 px-3 backdrop-blur dark:border-slate-700 dark:bg-slate-900/95 sm:px-4 lg:h-16 lg:px-6">
          <div className="flex flex-1 items-center gap-2 min-w-0">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white lg:hidden"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <label className="relative flex flex-1 min-w-0 max-w-full lg:max-w-md">
              <span className="sr-only">Search</span>
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input
                type="search"
                placeholder="Search..."
                className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-600 dark:bg-slate-800 dark:placeholder:text-slate-500 sm:pl-10 sm:pr-4"
              />
            </label>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              type="button"
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-300"
              aria-label="Notifications"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </button>
            <button
              type="button"
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-300"
              aria-label="Settings"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              </svg>
            </button>
          </div>
        </header>
        <main className="min-w-0 flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
