"use client";

import { useCallback, useEffect, useState } from "react";
import { adminApi } from "@/lib/api";
import { canAdmin, getAdminPermission, isSuperAdmin } from "@/lib/auth-store";

const PAGE_SIZE = 10;

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminApprovalsPage() {
  const canApprove = isSuperAdmin() || canAdmin("approve");
  const permissionLabel = isSuperAdmin() ? "super_admin" : getAdminPermission();
  const [users, setUsers] = useState<Array<{ id: number; full_name: string; email: string; phone: string; status: string; created_at: string; updated_at?: string }>>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionId, setActionId] = useState<number | null>(null);

  const load = useCallback(async (pageNum = 1) => {
    setLoading(true);
    setError("");
    const result = await adminApi.getPending({ page: pageNum, limit: PAGE_SIZE });
    setLoading(false);
    if (result.error) {
      setError(result.error);
      setUsers([]);
      return;
    }
    if (result.data) {
      setUsers(result.data.users);
      setTotal(result.data.total);
      setPage(result.data.page);
      setTotalPages(result.data.totalPages);
    }
  }, []);

  useEffect(() => {
    load(page);
  }, [load, page]);

  const handleRefresh = () => {
    load(page);
  };

  const handleApprove = async (id: number) => {
    if (!canApprove) return;
    setActionId(id);
    const result = await adminApi.approve(id);
    setActionId(null);
    if (result.error) {
      setError(result.error);
      return;
    }
    await load(page);
  };

  const handleReject = async (id: number) => {
    if (!canApprove) return;
    if (typeof window !== "undefined" && !window.confirm("Reject this user's registration?")) return;
    setActionId(id);
    const result = await adminApi.reject(id);
    setActionId(null);
    if (result.error) {
      setError(result.error);
      return;
    }
    await load(page);
  };

  return (
    <div className="min-w-0">
      <h1 className="text-xl font-bold text-slate-900 dark:text-white sm:text-2xl">Pending Approvals</h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Review and approve or reject pending user registrations. Approved users can log in and access the User Dashboard.
      </p>
      {!canApprove && (
        <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          Access mode: <strong>{permissionLabel}</strong>. You can view pending requests but cannot approve/reject.
        </div>
      )}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={handleRefresh}
          disabled={loading}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
        >
          Refresh
        </button>
      </div>

      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200 sm:px-4 sm:py-3">
          {error}
        </div>
      )}

      <div className="mt-4 sm:mt-6 min-w-0 rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500 dark:text-slate-400">
            Loading…
          </div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center text-slate-500 dark:text-slate-400">
            No pending registrations. New users will appear here after they register.
          </div>
        ) : (
          <>
            <div className="overflow-x-auto -mx-px">
              <table className="min-w-[640px] w-full divide-y divide-slate-200 dark:divide-slate-700">
                <thead className="bg-slate-50 dark:bg-slate-700/50">
                  <tr>
                    <th className="px-2 py-2 text-left text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 sm:px-4 sm:py-3">
                      Name
                    </th>
                    <th className="px-2 py-2 text-left text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 sm:px-4 sm:py-3">
                      Email
                    </th>
                    <th className="hidden px-2 py-2 text-left text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 md:table-cell sm:px-4 sm:py-3">
                      Phone
                    </th>
                    <th className="hidden px-2 py-2 text-left text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 lg:table-cell sm:px-4 sm:py-3">
                      Signup Date
                    </th>
                    <th className="hidden px-2 py-2 text-left text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 xl:table-cell sm:px-4 sm:py-3">
                      Last updated
                    </th>
                    <th className="px-2 py-2 text-left text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 sm:px-4 sm:py-3">
                      Status
                    </th>
                    <th className="px-2 py-2 text-right text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 sm:px-4 sm:py-3">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {users.map((user) => (
                    <tr key={user.id} className="bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/30">
                      <td className="px-2 py-2 text-sm font-medium text-slate-900 dark:text-white sm:px-4 sm:py-3">
                        {user.full_name}
                      </td>
                      <td className="px-2 py-2 text-sm text-slate-600 dark:text-slate-300 sm:px-4 sm:py-3 truncate max-w-[140px] sm:max-w-none">
                        {user.email}
                      </td>
                      <td className="hidden px-2 py-2 text-sm text-slate-600 dark:text-slate-300 md:table-cell sm:px-4 sm:py-3">
                        {user.phone}
                      </td>
                      <td className="hidden px-2 py-2 text-sm text-slate-500 dark:text-slate-400 lg:table-cell sm:px-4 sm:py-3">
                        {formatDate(user.created_at)}
                      </td>
                      <td className="hidden px-2 py-2 text-sm text-slate-500 dark:text-slate-400 xl:table-cell sm:px-4 sm:py-3">
                        {user.updated_at ? formatDate(user.updated_at) : "—"}
                      </td>
                      <td className="px-2 py-2 text-sm sm:px-4 sm:py-3">
                        <span className="inline-flex rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-200">
                          {user.status}
                        </span>
                      </td>
                      <td className="px-2 py-2 text-right sm:px-4 sm:py-3">
                        <div className="flex items-center justify-end gap-1 sm:gap-2">
                          <button
                            type="button"
                            disabled={actionId === user.id || !canApprove}
                            onClick={() => handleApprove(user.id)}
                            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                          >
                            {actionId === user.id ? "…" : "Approve"}
                          </button>
                          <button
                            type="button"
                            disabled={actionId === user.id || !canApprove}
                            onClick={() => handleReject(user.id)}
                            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600 disabled:opacity-50"
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 bg-slate-50 px-3 py-3 dark:border-slate-700 dark:bg-slate-800/50 sm:px-4">
                <p className="text-xs text-slate-600 dark:text-slate-400 sm:text-sm">
                  Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total}
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
