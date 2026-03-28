"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { adminApi, type AdminUserRow } from "@/lib/api";
import { canAdmin, getAdminPermission, isSuperAdmin } from "@/lib/auth-store";

const PAGE_SIZE = 10;
const TASK_ASSIGN_LIMIT = 30;

/** Matches server `User.adminRuntimeBalanceAdjust`: add positive, then optional negative runtime. */
function computeAdminPreviewBalance(oldBal: number, positiveAdd: number, negativeRuntime: number): number {
  let b = oldBal + positiveAdd;
  if (negativeRuntime > 0) {
    b = -(Math.abs(b) + negativeRuntime);
  }
  return b;
}

function formatRsSignedAmount(n: number): string {
  if (!Number.isFinite(n)) return "Rs 0.00";
  return n < 0 ? `−Rs ${Math.abs(n).toFixed(2)}` : `Rs ${n.toFixed(2)}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminUsersPage() {
  const canView = isSuperAdmin() || canAdmin("view");
  const canBalance = isSuperAdmin() || canAdmin("balance");
  const permissionLabel = isSuperAdmin() ? "super_admin" : getAdminPermission();

  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState<"approved" | "pending" | "rejected">("approved");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState<string>("");
  const [editingNegativeValue, setEditingNegativeValue] = useState<string>("");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [success, setSuccess] = useState("");
  const [primeModalUser, setPrimeModalUser] = useState<AdminUserRow | null>(null);
  const [primeSlots, setPrimeSlots] = useState<number[]>([]);
  const [savingPrime, setSavingPrime] = useState(false);
  const [primeAssignMode, setPrimeAssignMode] = useState<"prime_only" | "assign_with_prime">("prime_only");

  const load = useCallback(
    async (pageNum = 1) => {
      setLoading(true);
      setError("");
      const result = await adminApi.getUsers({
        page: pageNum,
        limit: PAGE_SIZE,
        status: statusFilter,
      });
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
    },
    [statusFilter]
  );

  useEffect(() => {
    load(1);
  }, [load]);

  const handleRefresh = () => {
    load(page);
  };

  const startEdit = (user: AdminUserRow) => {
    if (!canBalance) return;
    setEditingId(user.id);
    setEditingValue("");
    setEditingNegativeValue("");
    setSuccess("");
  };

  const handleAssignTasks = async (user: AdminUserRow) => {
    if (!canBalance) return;
    setPrimeAssignMode("assign_with_prime");
    setPrimeModalUser(user);
    setPrimeSlots([]);
    setError("");
    setSuccess(
      `Select prime order numbers for ${user.full_name}. If no prime order, select 0 and save.`
    );
  };

  const togglePrimeSlot = (slot: number) => {
    setPrimeSlots((prev) => {
      // Slot 0 means "no prime order for all tasks".
      if (slot === 0) return prev.includes(0) ? [] : [0];
      const withoutZero = prev.filter((x) => x !== 0);
      return withoutZero.includes(slot)
        ? withoutZero.filter((x) => x !== slot)
        : [...withoutZero, slot].sort((a, b) => a - b);
    });
  };

  const handleAssignPrimeOrders = async () => {
    if (!primeModalUser) return;
    if (primeSlots.length === 0) {
      setError("Please select prime order numbers, or select 0 for no prime orders.");
      return;
    }
    const normalizedSlots = primeSlots.includes(0) ? [] : primeSlots;
    setSavingPrime(true);
    setError("");
    setSuccess("");
    if (primeAssignMode === "assign_with_prime") {
      setAssigningId(primeModalUser.id);
      const assignRes = await adminApi.assignUserTasks(primeModalUser.id);
      if (assignRes.error) {
        setAssigningId(null);
        setSavingPrime(false);
        setError(assignRes.error);
        return;
      }
      setAssigningId(null);
    }
    const res = await adminApi.assignPrimeOrders(primeModalUser.id, normalizedSlots, {
      noNegative: true,
      negativeAmount: 0,
    });
    setSavingPrime(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    setSuccess("Prime orders assigned successfully.");
    setPrimeModalUser(null);
    setPrimeSlots([]);
    setPrimeAssignMode("prime_only");
    load(page);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingValue("");
    setEditingNegativeValue("");
  };

  const handleSaveBalance = async (user: AdminUserRow) => {
    if (!canBalance) return;
    const posRaw = editingValue.trim() === "" ? 0 : Number(editingValue);
    const negRaw = editingNegativeValue.trim() === "" ? 0 : Number(editingNegativeValue);
    if (!Number.isFinite(posRaw) || posRaw < 0) {
      setError("Please enter a valid non-negative amount in “Amount to add”, or leave it empty for 0.");
      return;
    }
    if (!Number.isFinite(negRaw) || negRaw < 0) {
      setError("Please enter a valid non-negative amount in “Negative amount”, or leave it empty for 0.");
      return;
    }
    if (posRaw === 0 && negRaw === 0) {
      setError("Enter an amount to add and/or a negative runtime amount before saving.");
      return;
    }
    const oldNum = Number(user.asset_balance ?? 0);
    const safeOld = Number.isFinite(oldNum) ? oldNum : 0;
    const newBal = computeAdminPreviewBalance(safeOld, posRaw, negRaw);
    const oldDisplay = formatRsSignedAmount(safeOld);
    const addDisplay = posRaw > 0 ? `Rs ${posRaw.toFixed(2)}` : "Rs 0.00";
    const negDisplay = negRaw > 0 ? `Rs ${negRaw.toFixed(2)} (applied as negative total)` : "—";
    const totalDisplay = formatRsSignedAmount(newBal);
    const sumLine =
      posRaw > 0 && negRaw === 0
        ? `\nSum (current + add): ${oldDisplay} + ${addDisplay} = ${totalDisplay}`
        : "";
    if (typeof window !== "undefined") {
      const confirmed = window.confirm(
        `Update balance for ${user.full_name} (${user.email})?\nCurrent: ${oldDisplay}\nAmount to add: ${addDisplay}\nNegative runtime: ${negDisplay}\nNew total: ${totalDisplay}${sumLine}`
      );
      if (!confirmed) return;
    }
    setSavingId(user.id);
    setError("");
    const res = await adminApi.updateUserBalance(user.id, posRaw, negRaw);
    setSavingId(null);
    if (res.error) {
      setError(res.error);
      return;
    }
    setEditingId(null);
    setEditingValue("");
    setEditingNegativeValue("");
    load(page);
  };

  const handleDeleteUser = async (user: AdminUserRow) => {
    if (!canBalance) return;
    if (typeof window !== "undefined") {
      const confirmed = window.confirm(
        `Delete user ${user.full_name} (${user.email})? This will permanently remove this user and related data from Supabase.`
      );
      if (!confirmed) return;
    }
    setDeletingId(user.id);
    setError("");
    setSuccess("");
    const res = await adminApi.deleteUser(user.id);
    setDeletingId(null);
    if (res.error) {
      setError(res.error);
      return;
    }
    if (editingId === user.id) {
      setEditingId(null);
      setEditingValue("");
      setEditingNegativeValue("");
    }
    setSuccess(`User ${user.full_name} deleted successfully.`);
    load(1);
  };

  const goToPage = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    setPage(newPage);
    load(newPage);
  };

  if (!canView) {
    return (
      <div className="min-w-0">
        <h1 className="text-xl font-bold text-slate-900 dark:text-white sm:text-2xl">Users</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">You do not have permission to view users.</p>
      </div>
    );
  }

  return (
    <div className="min-w-0">
      <h1 className="text-xl font-bold text-slate-900 dark:text-white sm:text-2xl">Users</h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Manage all users. Active users are approved and can access the dashboard.
      </p>
      {!canBalance && (
        <div className="mt-3 rounded-md border border-sky-200 bg-sky-50 px-3 py-2 text-xs text-sky-900">
          Access mode: <strong>{permissionLabel}</strong>. You can view users only.
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-2 sm:gap-3">
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Status</label>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as "approved" | "pending" | "rejected")}
          className="w-full min-w-0 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white sm:w-auto"
        >
          <option value="approved">Active (approved)</option>
          <option value="pending">Pending</option>
          <option value="rejected">Rejected</option>
        </select>
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
      {success && (
        <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-100 sm:px-4 sm:py-3">
          {success}
        </div>
      )}

      {editingId !== null && (
        <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm text-slate-900 shadow-sm dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-slate-100 sm:px-4 sm:py-4">
          <h2 className="text-sm font-semibold text-emerald-900 dark:text-emerald-200">
            Edit user (ID {editingId})
          </h2>
          <p className="mt-1 text-xs text-emerald-800/80 dark:text-emerald-200/80">
            Adjust asset balance and task assignment.
          </p>
          {(() => {
            const u = users.find((x) => x.id === editingId);
            const prevNum = u?.asset_balance != null ? Number(u.asset_balance) : NaN;
            const safePrev = Number.isFinite(prevNum) ? prevNum : 0;
            const prevDisplay = Number.isFinite(prevNum)
              ? `${prevNum < 0 ? "-" : ""}Rs ${Math.abs(prevNum).toFixed(2)}`
              : "Rs 0.00";
            const posNum = editingValue.trim() === "" ? 0 : Number(editingValue);
            const negNum = editingNegativeValue.trim() === "" ? 0 : Number(editingNegativeValue);
            const posOk = Number.isFinite(posNum) && posNum >= 0;
            const negOk = Number.isFinite(negNum) && negNum >= 0;
            const addDisplay = posOk && posNum > 0 ? `Rs ${posNum.toFixed(2)}` : posOk ? "Rs 0.00" : "—";
            const negLine =
              negOk && negNum > 0 ? (
                <span className="font-semibold text-rose-700 dark:text-rose-300">
                  Negative runtime: −Rs {negNum.toFixed(2)}
                </span>
              ) : (
                <span className="font-semibold">Negative runtime:</span>
              );
            const negSuffix = negOk && negNum > 0 ? ` (user sees total as negative)` : null;
            let totalDisplay: ReactNode = "—";
            let totalNum: number | null = null;
            if (posOk && negOk) {
              totalNum = computeAdminPreviewBalance(safePrev, posNum, negNum);
              totalDisplay =
                totalNum < 0 ? (
                  <span className="font-semibold text-rose-700 dark:text-rose-300">
                    −Rs {Math.abs(totalNum).toFixed(2)}
                  </span>
                ) : (
                  <span className="font-semibold text-emerald-800 dark:text-emerald-200">
                    Rs {totalNum.toFixed(2)}
                  </span>
                );
            }
            const sumRow =
              posOk && negOk && posNum > 0 && negNum === 0 && totalNum !== null ? (
                <div className="rounded-md border border-emerald-200/80 bg-white/60 px-2 py-1.5 dark:border-emerald-800/50 dark:bg-emerald-950/20">
                  <span className="font-semibold text-emerald-900 dark:text-emerald-100">Sum: </span>
                  <span>{prevDisplay}</span>
                  <span className="mx-1 text-emerald-700 dark:text-emerald-300">+</span>
                  <span className="text-emerald-800 dark:text-emerald-200">{addDisplay}</span>
                  <span className="mx-1 text-emerald-700 dark:text-emerald-300">=</span>
                  {totalNum < 0 ? (
                    <span className="font-semibold text-rose-700 dark:text-rose-300">
                      −Rs {Math.abs(totalNum).toFixed(2)}
                    </span>
                  ) : (
                    <span className="font-semibold text-emerald-800 dark:text-emerald-200">
                      Rs {totalNum.toFixed(2)}
                    </span>
                  )}
                  <span className="ml-1 block text-[11px] font-normal text-emerald-800/80 dark:text-emerald-200/80 sm:inline sm:ml-2">
                    (current balance + amount to add; negative runtime field not used)
                  </span>
                </div>
              ) : null;
            return (
              <div className="mt-2 space-y-1 text-xs text-emerald-900/90 dark:text-emerald-100/90">
                <div>
                  <span className="font-semibold">Current balance:</span> {prevDisplay}
                </div>
                <div>
                  <span className="mx-1 text-emerald-700 dark:text-emerald-300">→</span>
                  <span className="font-semibold text-emerald-800 dark:text-emerald-200">Add amount:</span>{" "}
                  <span className="text-emerald-800 dark:text-emerald-200">{addDisplay}</span>
                </div>
                <div>
                  <span className="mx-1 text-emerald-700 dark:text-emerald-300">→</span>
                  {negLine}
                  {negSuffix}
                </div>
                {sumRow}
                <div>
                  <span className="mx-1 text-emerald-700 dark:text-emerald-300">→</span>
                  <span className="font-semibold">New total (user account):</span> {totalDisplay}
                </div>
              </div>
            );
          })()}
          <div className="mt-3 grid gap-3 sm:grid-cols-1">
            <label className="flex flex-col gap-1 text-xs font-medium text-slate-800 dark:text-slate-200">
              Amount to add (runtime)
              <input
                type="number"
                min={0}
                step="0.01"
                value={editingValue}
                onChange={(e) => setEditingValue(e.target.value)}
                className="rounded-lg border border-emerald-300 bg-white px-3 py-1.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-emerald-700 dark:bg-slate-900 dark:text-slate-50"
                placeholder="Enter amount to add (positive)"
              />
              <span className="text-[11px] font-normal text-slate-600 dark:text-slate-400">
                Added to the user&apos;s current balance (algebraic sum). If they are negative, this tops them up;
                the new total shows in green when it is zero or positive.
              </span>
            </label>
            <label className="flex flex-col gap-1 text-xs font-medium text-slate-800 dark:text-slate-200">
              Negative amount (runtime)
              <input
                type="number"
                min={0}
                step="0.01"
                value={editingNegativeValue}
                onChange={(e) => setEditingNegativeValue(e.target.value)}
                className="rounded-lg border border-rose-300 bg-white px-3 py-1.5 text-sm text-slate-900 placeholder:text-rose-400/70 focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500 dark:border-rose-800 dark:bg-slate-900 dark:text-slate-50"
                placeholder="Only if setting debt: −(|balance after add| + this)"
              />
            </label>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={savingId === editingId}
              onClick={() => {
                const user = users.find((u) => u.id === editingId);
                if (user) handleSaveBalance(user);
              }}
              className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {savingId === editingId ? "Saving…" : "Save changes"}
            </button>
            <button
              type="button"
              disabled={assigningId === editingId}
              onClick={() => {
                const user = users.find((u) => u.id === editingId);
                if (user) handleAssignTasks(user);
              }}
              className="inline-flex items-center justify-center rounded-lg bg-sky-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-sky-700 disabled:opacity-50"
            >
              {assigningId === editingId ? "Assigning…" : `Assign ${TASK_ASSIGN_LIMIT} tasks`}
            </button>
            <button
              type="button"
              onClick={() => {
                const user = users.find((u) => u.id === editingId);
                if (!user) return;
                setPrimeModalUser(user);
                setPrimeSlots([]);
                setPrimeAssignMode("prime_only");
              }}
              className="inline-flex items-center justify-center rounded-lg bg-violet-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-violet-700"
            >
              Prime order assign
            </button>
            <button
              type="button"
              disabled={savingId === editingId}
              onClick={cancelEdit}
              className="inline-flex items-center justify-center rounded-lg border border-emerald-300 px-4 py-1.5 text-sm font-medium text-emerald-900 hover:bg-emerald-100 dark:border-emerald-700 dark:text-emerald-100 dark:hover:bg-emerald-900/40"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {primeModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-3">
          <div className="w-full max-w-xl rounded-xl border border-slate-200 bg-white p-4 shadow-lg dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Prime Order Assign ({primeModalUser.full_name})
              </h3>
              <button
                type="button"
                onClick={() => setPrimeModalUser(null)}
                className="rounded-md px-2 py-1 text-xs text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Close
              </button>
            </div>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              {primeAssignMode === "assign_with_prime"
                ? `Select prime order numbers before assigning ${TASK_ASSIGN_LIMIT} tasks. If no prime order, select 0 and save.`
                : `Select task numbers (1-${TASK_ASSIGN_LIMIT}) to mark as prime orders for this user.`}
            </p>
            <p className="mt-1 text-xs text-red-600 dark:text-red-300">
              Prime order blocks task continuation on user side and shows a recharge warning until balance is topped up.
            </p>
            <div className="mt-3">
              <button
                type="button"
                onClick={() => togglePrimeSlot(0)}
                className={`rounded border px-3 py-1.5 text-xs font-medium ${
                  primeSlots.includes(0)
                    ? "border-violet-500 bg-violet-50 text-violet-700 dark:border-violet-500 dark:bg-violet-900/30 dark:text-violet-200"
                    : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                0 - No prime order (all normal)
              </button>
            </div>
            <div className="mt-3 grid grid-cols-6 gap-2 sm:grid-cols-10">
              {Array.from({ length: TASK_ASSIGN_LIMIT }, (_, i) => i + 1).map((n) => {
                const checked = primeSlots.includes(n);
                return (
                  <label
                    key={n}
                    className={`flex cursor-pointer items-center justify-center rounded border px-2 py-1 text-xs ${
                      checked
                        ? "border-violet-500 bg-violet-50 text-violet-700 dark:border-violet-500 dark:bg-violet-900/30 dark:text-violet-200"
                        : "border-slate-300 bg-white text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={checked}
                      onChange={() => togglePrimeSlot(n)}
                    />
                    {n}
                  </label>
                );
              })}
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPrimeModalUser(null)}
                className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={savingPrime}
                onClick={handleAssignPrimeOrders}
                className="rounded-md bg-violet-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-violet-700 disabled:opacity-60"
              >
                {savingPrime ? "Saving..." : "Save Prime Orders"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mt-4 sm:mt-6 min-w-0 rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500 dark:text-slate-400">
            Loading…
          </div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center text-slate-500 dark:text-slate-400">
            {statusFilter === "approved"
              ? "No active users yet. Approved users will appear here."
              : `No ${statusFilter} users.`}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto -mx-px">
              <table className="min-w-[560px] w-full divide-y divide-slate-200 dark:divide-slate-700">
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
                      Registered
                    </th>
                    <th className="hidden px-2 py-2 text-left text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 xl:table-cell sm:px-4 sm:py-3">
                      Last updated
                    </th>
                    <th className="px-2 py-2 text-left text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 sm:px-4 sm:py-3">
                      Asset balance
                    </th>
                    <th className="px-2 py-2 text-left text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 sm:px-4 sm:py-3">
                      Status
                    </th>
                    <th className="px-2 py-2 text-left text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 sm:px-4 sm:py-3">
                      Task Assign
                    </th>
                    <th className="px-2 py-2 text-left text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300 sm:px-4 sm:py-3">
                      Delete
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
                      <td className="px-2 py-2 text-sm text-slate-600 dark:text-slate-300 sm:px-4 sm:py-3">
                        {editingId === user.id ? (
                          <div className="flex flex-col gap-1.5 min-w-[9rem]">
                            <input
                              type="number"
                              min={0}
                              step="0.01"
                              value={editingValue}
                              onChange={(e) => setEditingValue(e.target.value)}
                              title="Amount to add"
                              className="w-full rounded-md border border-emerald-400/80 bg-white px-2 py-1 text-xs focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-emerald-700 dark:bg-slate-900 dark:text-white"
                              placeholder="Add"
                            />
                            <input
                              type="number"
                              min={0}
                              step="0.01"
                              value={editingNegativeValue}
                              onChange={(e) => setEditingNegativeValue(e.target.value)}
                              title="Negative runtime"
                              className="w-full rounded-md border border-rose-400/80 bg-white px-2 py-1 text-xs focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500 dark:border-rose-800 dark:bg-slate-900 dark:text-white"
                              placeholder="Neg"
                            />
                            <div className="flex flex-wrap gap-1.5">
                              <button
                                type="button"
                                disabled={savingId === user.id}
                                onClick={() => handleSaveBalance(user)}
                                className="rounded-md bg-emerald-600 px-2 py-1 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                              >
                                {savingId === user.id ? "Saving…" : "Save"}
                              </button>
                              <button
                                type="button"
                                disabled={savingId === user.id}
                                onClick={cancelEdit}
                                className="rounded-md border border-slate-300 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span
                              className={
                                user.asset_balance != null &&
                                Number.isFinite(Number(user.asset_balance)) &&
                                Number(user.asset_balance) < 0
                                  ? "font-medium text-rose-700 dark:text-rose-300"
                                  : user.asset_balance != null &&
                                      Number.isFinite(Number(user.asset_balance)) &&
                                      Number(user.asset_balance) > 0
                                    ? "font-medium text-emerald-800 dark:text-emerald-200"
                                    : ""
                              }
                            >
                              {user.asset_balance != null && Number.isFinite(Number(user.asset_balance))
                                ? (() => {
                                    const n = Number(user.asset_balance);
                                    return n < 0
                                      ? `−Rs ${Math.abs(n).toFixed(2)}`
                                      : `Rs ${n.toFixed(2)}`;
                                  })()
                                : "—"}
                            </span>
                            <button
                              type="button"
                              onClick={() => startEdit(user)}
                              disabled={!canBalance}
                              className="rounded-md border border-slate-300 px-2 py-0.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
                            >
                              Edit
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="px-2 py-2 text-sm sm:px-4 sm:py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            user.status === "approved"
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200"
                              : user.status === "pending"
                              ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200"
                              : "bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300"
                          }`}
                        >
                          {user.status}
                        </span>
                      </td>
                      <td className="px-2 py-2 text-sm sm:px-4 sm:py-3">
                        <button
                          type="button"
                          disabled={assigningId === user.id || !canBalance}
                          onClick={() => handleAssignTasks(user)}
                          className="rounded-md bg-sky-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-sky-700 disabled:opacity-50"
                        >
                          {assigningId === user.id ? "Assigning…" : `Assign ${TASK_ASSIGN_LIMIT}`}
                        </button>
                      </td>
                      <td className="px-2 py-2 text-sm sm:px-4 sm:py-3">
                        <button
                          type="button"
                          disabled={deletingId === user.id || !canBalance}
                          onClick={() => handleDeleteUser(user)}
                          className="rounded-md bg-red-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
                        >
                          {deletingId === user.id ? "Deleting..." : "Delete"}
                        </button>
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
                    onClick={() => goToPage(page - 1)}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    disabled={page >= totalPages}
                    onClick={() => goToPage(page + 1)}
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
