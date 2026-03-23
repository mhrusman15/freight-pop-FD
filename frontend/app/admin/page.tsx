"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { adminApi, type AdminUserRow } from "@/lib/api";
import { isSuperAdmin } from "@/lib/auth-store";

// Types
type ActivityType = "approved" | "rejected" | "registered";

interface Admin {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface Activity {
  id: string;
  type: ActivityType;
  message: string;
  timestamp: string;
  adminName?: string;
}

const INITIAL_ADMINS: Admin[] = [];
const PAGE_SIZE = 10;

// Stat card
function StatCard({
  title,
  value,
  description,
  icon,
  trend,
}: {
  title: string;
  value: number | string;
  description: string;
  icon: React.ReactNode;
  trend?: { value: string; positive: boolean };
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md dark:border-slate-700 dark:bg-slate-800 sm:p-5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 sm:text-sm">{title}</p>
          <p className="mt-1 text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl">
            {typeof value === "number" ? value.toLocaleString() : value}
          </p>
          {trend && (
            <p className={`mt-1 text-xs font-medium ${trend.positive ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
              {trend.value}
            </p>
          )}
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{description}</p>
        </div>
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300 sm:h-12 sm:w-12">
          {icon}
        </div>
      </div>
    </div>
  );
}

// Format date for display
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function AdminDashboardPage() {
  const [search, setSearch] = useState("");
  const [stats, setStats] = useState({ totalUsers: 0, activeUsers: 0, pendingApproval: 0, totalAdmins: 0 });
  const [pendingUsers, setPendingUsers] = useState<AdminUserRow[]>([]);
  const [pendingPage, setPendingPage] = useState(1);
  const [pendingTotal, setPendingTotal] = useState(0);
  const [pendingTotalPages, setPendingTotalPages] = useState(0);
  const [recentActiveUsers, setRecentActiveUsers] = useState<AdminUserRow[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<number | null>(null);

  const loadStats = useCallback(async () => {
    const res = await adminApi.getStats();
    if (res.data) setStats(res.data);
  }, []);

  const loadPending = useCallback(async (page = 1) => {
    const res = await adminApi.getPending({ page, limit: PAGE_SIZE });
    if (res.data) {
      setPendingUsers(Array.isArray(res.data.users) ? res.data.users : []);
      setPendingTotal(Number.isFinite(res.data.total) ? res.data.total : 0);
      setPendingPage(Number.isFinite(res.data.page) ? res.data.page : 1);
      setPendingTotalPages(Number.isFinite(res.data.totalPages) ? res.data.totalPages : 0);
    }
  }, []);

  const loadRecentActive = useCallback(async () => {
    const res = await adminApi.getUsers({ page: 1, limit: 10, status: "approved" });
    if (res.data) setRecentActiveUsers(Array.isArray(res.data.users) ? res.data.users : []);
  }, []);

  useEffect(() => {
    let done = false;
    async function load() {
      setLoading(true);
      await Promise.all([loadStats(), loadPending(1), loadRecentActive()]);
      if (!done) setLoading(false);
    }
    load();
    return () => { done = true; };
  }, [loadStats, loadPending, loadRecentActive]);

  useEffect(() => {
    if (pendingPage === 1) return;
    loadPending(pendingPage);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingPage]);

  // Filtered pending list for table (client-side filter by search)
  const filteredPending = useMemo(() => {
    if (!search.trim()) return pendingUsers;
    const q = search.toLowerCase();
    return pendingUsers.filter(
      (u) =>
        u.full_name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q)
    );
  }, [pendingUsers, search]);

  const addActivity = useCallback((type: ActivityType, message: string) => {
    setActivities((prev) => [
      { id: `act-${Date.now()}`, type, message, timestamp: new Date().toLocaleString() },
      ...prev.slice(0, 49),
    ]);
  }, []);

  const handleApprove = useCallback(async (id: number) => {
    setActionId(id);
    const result = await adminApi.approve(id);
    setActionId(null);
    if (result.error) return;
    const user = pendingUsers.find((u) => u.id === id);
    if (user) addActivity("approved", `${user.full_name} (${user.email}) was approved and is now an active user.`);
    await Promise.all([loadStats(), loadPending(pendingPage), loadRecentActive()]);
  }, [pendingUsers, pendingPage, loadStats, loadPending, loadRecentActive, addActivity]);

  const handleReject = useCallback(async (id: number) => {
    if (typeof window !== "undefined" && !window.confirm("Reject this user's registration?")) return;
    setActionId(id);
    const result = await adminApi.reject(id);
    setActionId(null);
    if (result.error) return;
    const user = pendingUsers.find((u) => u.id === id);
    if (user) addActivity("rejected", `${user.full_name} (${user.email}) was rejected.`);
    await Promise.all([loadStats(), loadPending(pendingPage)]);
  }, [pendingUsers, pendingPage, loadStats, loadPending, addActivity]);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white sm:text-2xl">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Overview of users and admin activity
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Users"
          value={stats.totalUsers}
          description="All registered accounts"
          icon={
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          }
        />
        <StatCard
          title="Active Users"
          value={stats.activeUsers}
          description="Approved users (can access dashboard)"
          icon={
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          title="Pending Approval"
          value={stats.pendingApproval}
          description="Awaiting admin review"
          icon={
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          title="Total Admins"
          value={stats.totalAdmins}
          description="Admin accounts"
          icon={
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          }
        />
      </div>

      {/* Search and filters */}
      <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-800 sm:p-4">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
          Search and filters
        </h2>
        <div className="mt-3 flex flex-wrap items-center gap-2 sm:gap-3">
          <label className="w-full min-w-0 flex-1 sm:min-w-[200px]">
            <span className="sr-only">Search by name or email</span>
            <input
              type="search"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPendingPage(1);
              }}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-600 dark:bg-slate-700 dark:placeholder:text-slate-500"
            />
          </label>
        </div>
      </div>

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
        {/* Pending user approvals - 2 cols */}
        <div className="min-w-0 rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800 lg:col-span-2">
          <div className="flex flex-col gap-2 border-b border-slate-200 px-3 py-3 dark:border-slate-700 sm:flex-row sm:items-center sm:justify-between sm:px-4">
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white sm:text-base">
                Pending user approvals
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Review and approve or reject registration requests
              </p>
            </div>
            <Link
              href="/admin/approvals"
              className="w-fit rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700 sm:px-4"
            >
              View all ({stats.pendingApproval})
            </Link>
          </div>
          <div className="overflow-x-auto -mx-px">
            <table className="min-w-[600px] w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-700/50">
                  <th className="px-2 py-2 font-medium text-slate-700 dark:text-slate-300 sm:px-4 sm:py-3">Name</th>
                  <th className="px-2 py-2 font-medium text-slate-700 dark:text-slate-300 sm:px-4 sm:py-3">Email</th>
                  <th className="px-2 py-2 font-medium text-slate-700 dark:text-slate-300 sm:px-4 sm:py-3 hidden md:table-cell">Phone</th>
                  <th className="px-2 py-2 font-medium text-slate-700 dark:text-slate-300 sm:px-4 sm:py-3 hidden lg:table-cell">Registration date</th>
                  <th className="px-2 py-2 font-medium text-slate-700 dark:text-slate-300 sm:px-4 sm:py-3">Status</th>
                  <th className="px-2 py-2 font-medium text-slate-700 dark:text-slate-300 text-right sm:px-4 sm:py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                      Loading…
                    </td>
                  </tr>
                ) : filteredPending.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                      No pending approvals. New users will appear here after they register.
                    </td>
                  </tr>
                ) : (
                  filteredPending.map((user) => (
                    <tr
                      key={user.id}
                      className="border-b border-slate-100 dark:border-slate-700"
                    >
                      <td className="px-2 py-2 font-medium text-slate-900 dark:text-white sm:px-4 sm:py-3">
                        {user.full_name}
                      </td>
                      <td className="px-2 py-2 text-slate-600 dark:text-slate-300 sm:px-4 sm:py-3 truncate max-w-[120px] sm:max-w-none">
                        {user.email}
                      </td>
                      <td className="hidden px-2 py-2 text-slate-600 dark:text-slate-300 md:table-cell sm:px-4 sm:py-3">
                        {user.phone}
                      </td>
                      <td className="hidden px-2 py-2 text-slate-600 dark:text-slate-300 lg:table-cell sm:px-4 sm:py-3">
                        {formatDate(user.created_at)}
                      </td>
                      <td className="px-2 py-2 sm:px-4 sm:py-3">
                        <span className="inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                          {user.status}
                        </span>
                      </td>
                      <td className="px-2 py-2 text-right sm:px-4 sm:py-3">
                        <div className="flex justify-end gap-1 sm:gap-2">
                          <button
                            type="button"
                            disabled={actionId === user.id}
                            onClick={() => handleApprove(user.id)}
                            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                          >
                            {actionId === user.id ? "…" : "Approve"}
                          </button>
                          <button
                            type="button"
                            disabled={actionId === user.id}
                            onClick={() => handleReject(user.id)}
                            className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {pendingTotalPages > 1 && (
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 px-3 py-3 dark:border-slate-700 sm:px-4">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Page {pendingPage} of {pendingTotalPages} ({pendingTotal} total)
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPendingPage((p) => Math.max(1, p - 1))}
                  disabled={pendingPage <= 1}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 disabled:opacity-50 dark:border-slate-600 dark:text-slate-300"
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() => setPendingPage((p) => Math.min(pendingTotalPages, p + 1))}
                  disabled={pendingPage >= pendingTotalPages}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 disabled:opacity-50 dark:border-slate-600 dark:text-slate-300"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Activity log - 1 col */}
        <div className="min-w-0 rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="border-b border-slate-200 px-3 py-3 dark:border-slate-700 sm:px-4">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white sm:text-base">
              Activity log
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Recent admin and system actions
            </p>
          </div>
          <ul className="divide-y divide-slate-100 dark:divide-slate-700">
            {activities.length === 0 ? (
              <li className="px-3 py-6 text-center text-sm text-slate-500 dark:text-slate-400 sm:px-4 sm:py-8">
                No activity yet. When you approve or reject users, it will appear here.
              </li>
            ) : (
              activities.map((a) => (
                <li key={a.id} className="px-3 py-2 sm:px-4 sm:py-3">
                  <p className="text-sm text-slate-900 dark:text-white">
                    {a.message}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                    {a.timestamp}
                    {a.adminName && ` · ${a.adminName}`}
                  </p>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
        {/* Active users */}
        <div className="min-w-0 rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="border-b border-slate-200 px-3 py-3 dark:border-slate-700 sm:px-4">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white sm:text-base">
              Active users
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Approved users (last 10)
            </p>
          </div>
          <div className="overflow-x-auto -mx-px">
            <table className="min-w-[400px] w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-700/50">
                  <th className="px-2 py-2 font-medium text-slate-700 dark:text-slate-300 sm:px-4 sm:py-3">Name</th>
                  <th className="px-2 py-2 font-medium text-slate-700 dark:text-slate-300 sm:px-4 sm:py-3">Email</th>
                  <th className="hidden px-2 py-2 font-medium text-slate-700 dark:text-slate-300 sm:table-cell sm:px-4 sm:py-3">Date</th>
                  <th className="px-2 py-2 font-medium text-slate-700 dark:text-slate-300 sm:px-4 sm:py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentActiveUsers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-3 py-6 text-center text-sm text-slate-500 dark:text-slate-400 sm:px-4 sm:py-8">
                      No active users yet. Approved users will appear here.
                    </td>
                  </tr>
                ) : (
                  recentActiveUsers.map((user) => (
                    <tr
                      key={user.id}
                      className="border-b border-slate-100 dark:border-slate-700"
                    >
                      <td className="px-2 py-2 font-medium text-slate-900 dark:text-white sm:px-4 sm:py-3">
                        {user.full_name}
                      </td>
                      <td className="px-2 py-2 text-slate-600 dark:text-slate-300 sm:px-4 sm:py-3 truncate max-w-[140px] sm:max-w-none">
                        {user.email}
                      </td>
                      <td className="hidden px-2 py-2 text-slate-600 dark:text-slate-300 sm:table-cell sm:px-4 sm:py-3">
                        {formatDate(user.created_at)}
                      </td>
                      <td className="px-2 py-2 sm:px-4 sm:py-3">
                        <span className="inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400">
                          {user.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Admin management */}
        <div className="min-w-0 rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="flex flex-col gap-2 border-b border-slate-200 px-3 py-3 dark:border-slate-700 sm:flex-row sm:items-center sm:justify-between sm:px-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white sm:text-base">
                Admin management
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isSuperAdmin() ? "Manage admin accounts" : "Only the super admin can add new admins."}
              </p>
            </div>
            {isSuperAdmin() && (
              <button
                type="button"
                className="w-fit rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700 sm:px-4"
              >
                Add new admin
              </button>
            )}
          </div>
          <ul className="divide-y divide-slate-100 dark:divide-slate-700">
            {INITIAL_ADMINS.length === 0 ? (
              <li className="px-3 py-6 text-center text-sm text-slate-500 dark:text-slate-400 sm:px-4 sm:py-8">
                No other admins. Add admins when you connect your API.
              </li>
            ) : (
              INITIAL_ADMINS.map((admin) => (
                <li
                  key={admin.id}
                  className="flex items-center justify-between gap-2 px-3 py-2 sm:px-4 sm:py-3"
                >
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">
                      {admin.name}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {admin.email} · {admin.role}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
                  >
                    Edit
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
