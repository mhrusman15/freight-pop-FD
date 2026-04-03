"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { adminApi, type AdminUserRow } from "@/lib/api";
import { canAdmin, getAdminPermission, isSuperAdmin } from "@/lib/auth-store";

const PAGE_SIZE = 10;
const TASK_ASSIGN_LIMIT = 30;

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

function UserStatusBadges({ user }: { user: AdminUserRow }) {
  const bal = Number(user.asset_balance ?? 0);
  const slots = user.prime_order_slots ?? user.prime_orders?.map((p) => p.task_no) ?? [];
  const qt = Math.max(1, Number(user.task_quota_total ?? TASK_ASSIGN_LIMIT));
  const qu = Math.max(0, Number(user.task_quota_used ?? 0));
  const req = Boolean(user.task_assignment_required);

  const primary =
    bal < 0
      ? { label: "Blocked", className: "bg-rose-100 text-rose-900 dark:bg-rose-900/30 dark:text-rose-100" }
      : req && qu >= qt
        ? {
            label: "Waiting",
            className: "bg-amber-100 text-amber-900 dark:bg-amber-900/30 dark:text-amber-100",
          }
        : {
            label: "Active",
            className: "bg-emerald-100 text-emerald-900 dark:bg-emerald-900/30 dark:text-emerald-100",
          };

  return (
    <div className="flex flex-wrap gap-1">
      <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${primary.className}`}>
        {primary.label}
      </span>
      {slots.length > 0 ? (
        <span className="inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase bg-violet-100 text-violet-900 dark:bg-violet-900/30 dark:text-violet-100">
          Prime
        </span>
      ) : null}
    </div>
  );
}

function ModalBackdrop({
  open,
  title,
  children,
  onClose,
}: {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-3">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-4 shadow-lg dark:border-slate-700 dark:bg-slate-900"
      >
        <div className="flex items-center justify-between gap-2">
          <h3 id="modal-title" className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            {title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-2 py-1 text-xs text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Close
          </button>
        </div>
        <div className="mt-3">{children}</div>
      </div>
    </div>
  );
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
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [success, setSuccess] = useState("");
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);

  /** Step 1: multi-select task numbers (1–30). Step 2: amount per selected task. Step 3: confirm. */
  const [cycleModalUser, setCycleModalUser] = useState<AdminUserRow | null>(null);
  const [cycleStep, setCycleStep] = useState<1 | 2 | 3>(1);
  const [selectedPrimeTasks, setSelectedPrimeTasks] = useState<number[]>([]);
  const [primeAmounts, setPrimeAmounts] = useState<Record<number, string>>({});

  const [balancePos, setBalancePos] = useState<Record<string, string>>({});
  const [balanceNeg, setBalanceNeg] = useState<Record<string, string>>({});
  const [balanceSavingId, setBalanceSavingId] = useState<string | null>(null);
  const [balanceConfirmUser, setBalanceConfirmUser] = useState<AdminUserRow | null>(null);

  const showToast = useCallback((type: "success" | "error", text: string) => {
    setToast({ type, text });
    window.setTimeout(() => setToast(null), 3200);
  }, []);

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

  const openAssignCycleModal = (user: AdminUserRow) => {
    setSelectedPrimeTasks([]);
    setPrimeAmounts({});
    setCycleStep(1);
    setCycleModalUser(user);
  };

  const togglePrimeTask = (n: number) => {
    setSelectedPrimeTasks((prev) => {
      if (prev.includes(n)) {
        setPrimeAmounts((p) => {
          const next = { ...p };
          delete next[n];
          return next;
        });
        return prev.filter((x) => x !== n);
      }
      return [...prev, n].sort((a, b) => a - b);
    });
  };

  const submitAssignCycleWithPrime = async () => {
    if (!cycleModalUser) return;
    const sorted = [...selectedPrimeTasks].sort((a, b) => a - b);
    const orders: { task_no: number; negative_amount: number }[] = [];
    for (const t of sorted) {
      const raw = (primeAmounts[t] ?? "").trim();
      const n = raw === "" ? NaN : Number(raw);
      if (!Number.isFinite(n) || n <= 0) {
        setError(`Enter a valid recharge amount (Rs) for task #${t}.`);
        showToast("error", `Enter amount for task #${t}`);
        return;
      }
      orders.push({ task_no: t, negative_amount: n });
    }
    setAssigningId(cycleModalUser.id);
    setError("");
    const res = await adminApi.assignTasksWithPrime(cycleModalUser.id, orders);
    setAssigningId(null);
    if (res.error) {
      setError(res.error);
      showToast("error", res.error);
      return;
    }
    setCycleModalUser(null);
    showToast(
      "success",
      orders.length
        ? `30-task cycle assigned with ${orders.length} prime order(s).`
        : "30-task cycle assigned (no prime tasks).",
    );
    load(page);
  };

  const applyBalanceUpdate = async (user: AdminUserRow) => {
    const posRaw = (balancePos[user.id] ?? "").trim() === "" ? 0 : Number(balancePos[user.id]);
    const negRaw = (balanceNeg[user.id] ?? "").trim() === "" ? 0 : Number(balanceNeg[user.id]);
    if (!Number.isFinite(posRaw) || posRaw < 0) {
      setError("Deposit amount must be a non-negative number.");
      showToast("error", "Invalid deposit amount.");
      return;
    }
    if (!Number.isFinite(negRaw) || negRaw < 0) {
      setError("Negative runtime must be a non-negative number.");
      showToast("error", "Invalid negative runtime.");
      return;
    }
    if (posRaw === 0 && negRaw === 0) {
      setError("Enter a deposit amount and/or negative runtime.");
      showToast("error", "Enter at least one non-zero value.");
      return;
    }
    setBalanceSavingId(user.id);
    setError("");
    const res = await adminApi.updateUserBalance(user.id, posRaw, negRaw);
    setBalanceSavingId(null);
    setBalanceConfirmUser(null);
    if (res.error) {
      setError(res.error);
      showToast("error", res.error);
      return;
    }
    setBalancePos((p) => ({ ...p, [user.id]: "" }));
    setBalanceNeg((p) => ({ ...p, [user.id]: "" }));
    showToast("success", "Balance updated.");
    load(page);
  };

  const handleDeleteUser = async (user: AdminUserRow) => {
    if (!canBalance) return;
    if (typeof window !== "undefined") {
      const confirmed = window.confirm(
        `Delete user ${user.full_name} (${user.email})? This will permanently remove this user and related data from Supabase.`,
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
      showToast("error", res.error);
      return;
    }
    setSuccess(`User ${user.full_name} deleted successfully.`);
    showToast("success", "User deleted.");
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
        Use <strong>Assign 30 Task Cycle</strong> to reset the cycle, set prime task numbers (1–30), and set recharge
        amount per prime task. Balance updates are separate.
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
          className="w-full min-w-0 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white sm:w-auto"
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
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-100 sm:px-4 sm:py-3">
          {error}
        </div>
      )}
      {success && (
        <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-100 sm:px-4 sm:py-3">
          {success}
        </div>
      )}
      {toast && (
        <div
          className={`fixed bottom-4 right-4 z-[60] max-w-sm rounded-lg border px-4 py-3 text-sm shadow-lg ${
            toast.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/90 dark:text-emerald-100"
              : "border-red-200 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-950/90 dark:text-red-100"
          }`}
        >
          {toast.text}
        </div>
      )}

      <ModalBackdrop
        open={balanceConfirmUser != null}
        title="Confirm balance update"
        onClose={() => setBalanceConfirmUser(null)}
      >
        <p className="text-sm text-slate-600 dark:text-slate-300">
          You are about to update balance for <strong>{balanceConfirmUser?.full_name}</strong>. This may block tasks or
          reset prime conditions.
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setBalanceConfirmUser(null)}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={balanceConfirmUser != null && balanceSavingId === balanceConfirmUser.id}
            onClick={() => balanceConfirmUser && applyBalanceUpdate(balanceConfirmUser)}
            className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            {balanceConfirmUser != null && balanceSavingId === balanceConfirmUser.id ? "Applying…" : "Confirm"}
          </button>
        </div>
      </ModalBackdrop>

      <ModalBackdrop
        open={cycleModalUser != null}
        title="Assign 30 Task Cycle"
        onClose={() => setCycleModalUser(null)}
      >
        <div className="mb-3 flex items-center gap-2">
          {([1, 2, 3] as const).map((s) => (
            <div
              key={s}
              className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold ${
                cycleStep === s
                  ? "bg-violet-600 text-white"
                  : cycleStep > s
                    ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200"
                    : "bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400"
              }`}
            >
              {cycleStep > s ? "✓" : s}
            </div>
          ))}
          <span className="ml-1 text-[10px] text-slate-500 dark:text-slate-400">
            Step {cycleStep} of 3
          </span>
        </div>

        {cycleStep === 1 && (
          <>
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
              Select prime task numbers (1–30)
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              User: <strong>{cycleModalUser?.full_name}</strong>. You can select none, one, or many. Only one prime is
              active at a time; lower task numbers unlock first.
            </p>
            <div className="mt-3 max-h-48 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-2 dark:border-slate-600 dark:bg-slate-800/50">
              <div className="grid grid-cols-5 gap-1.5 sm:grid-cols-6">
                {Array.from({ length: TASK_ASSIGN_LIMIT }, (_, i) => i + 1).map((n) => {
                  const on = selectedPrimeTasks.includes(n);
                  return (
                    <label
                      key={n}
                      className={`flex cursor-pointer items-center justify-center rounded-md border px-1 py-1.5 text-[11px] font-medium ${
                        on
                          ? "border-violet-500 bg-violet-100 text-violet-900 dark:border-violet-400 dark:bg-violet-900/40 dark:text-violet-100"
                          : "border-slate-200 bg-white text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={on}
                        onChange={() => togglePrimeTask(n)}
                      />
                      {n}
                    </label>
                  );
                })}
              </div>
            </div>
            <p className="mt-2 text-[10px] text-slate-500 dark:text-slate-400">
              Selected: {selectedPrimeTasks.length ? selectedPrimeTasks.join(", ") : "none"}
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setCycleModalUser(null)}
                className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => setCycleStep(2)}
                className="rounded-md bg-violet-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-violet-700"
              >
                Next
              </button>
            </div>
          </>
        )}

        {cycleStep === 2 && (
          <>
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
              Recharge required (Rs) per prime task
            </p>
            {selectedPrimeTasks.length === 0 ? (
              <p className="mt-2 text-xs text-slate-600 dark:text-slate-300">
                No prime tasks selected. The cycle will reset with an empty <code className="text-[10px]">prime_orders</code>{" "}
                list.
              </p>
            ) : (
              <div className="mt-3 space-y-2">
                {[...selectedPrimeTasks].sort((a, b) => a - b).map((t) => (
                  <div key={t} className="flex items-center gap-2">
                    <span className="w-20 shrink-0 text-xs font-medium text-slate-700 dark:text-slate-200">
                      Task {t}
                    </span>
                    <input
                      type="number"
                      min={1}
                      step="0.01"
                      placeholder="Rs"
                      value={primeAmounts[t] ?? ""}
                      onChange={(e) =>
                        setPrimeAmounts((p) => ({
                          ...p,
                          [t]: e.target.value,
                        }))
                      }
                      className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                ))}
              </div>
            )}
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setCycleStep(1)}
                className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setCycleStep(3)}
                className="rounded-md bg-violet-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-violet-700"
              >
                Next
              </button>
            </div>
          </>
        )}

        {cycleStep === 3 && (
          <>
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">Confirm</p>
            <div className="mt-3 space-y-2">
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Resets the 30-task cycle, clears progress, stores <code className="text-[10px]">prime_orders</code>, and opens task 1.
              </p>
              {selectedPrimeTasks.length === 0 ? (
                <p className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-200">
                  No prime orders in this assignment.
                </p>
              ) : (
                [...selectedPrimeTasks]
                  .sort((a, b) => a - b)
                  .map((t) => (
                    <div
                      key={t}
                      className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/50"
                    >
                      <p className="text-sm text-slate-700 dark:text-slate-300">
                        Task <strong>#{t}</strong> — recharge required{" "}
                        <strong className="text-rose-700 dark:text-rose-400">
                          Rs{" "}
                          {Number(primeAmounts[t] || 0).toLocaleString("en-IN", {
                            minimumFractionDigits: 2,
                          })}
                        </strong>
                      </p>
                    </div>
                  ))
              )}
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setCycleStep(2)}
                className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Back
              </button>
              <button
                type="button"
                disabled={assigningId === cycleModalUser?.id}
                onClick={() => void submitAssignCycleWithPrime()}
                className="rounded-md bg-sky-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-sky-700 disabled:opacity-60"
              >
                {assigningId === cycleModalUser?.id ? "Saving…" : "Confirm & Save"}
              </button>
            </div>
          </>
        )}
      </ModalBackdrop>

      <div className="mt-4 sm:mt-6 min-w-0 rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500 dark:text-slate-400">Loading…</div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center text-slate-500 dark:text-slate-400">
            {statusFilter === "approved"
              ? "No active users yet. Approved users will appear here."
              : `No ${statusFilter} users.`}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto -mx-px">
              <table className="min-w-[900px] w-full divide-y divide-slate-200 dark:divide-slate-700">
                <thead className="bg-slate-50 dark:bg-slate-700/50">
                  <tr>
                    <th className="px-2 py-2 text-left text-xs font-semibold uppercase text-slate-600 dark:text-slate-300 sm:px-3">
                      User
                    </th>
                    <th className="px-2 py-2 text-left text-xs font-semibold uppercase text-slate-600 dark:text-slate-300 sm:px-3">
                      Balance
                    </th>
                    <th className="px-2 py-2 text-left text-xs font-semibold uppercase text-slate-600 dark:text-slate-300 sm:px-3">
                      Status
                    </th>
                    <th className="px-2 py-2 text-left text-xs font-semibold uppercase text-slate-600 dark:text-slate-300 sm:px-3">
                      30-task cycle
                    </th>
                    <th className="px-2 py-2 text-left text-xs font-semibold uppercase text-slate-600 dark:text-slate-300 sm:px-3">
                      Balance control
                    </th>
                    <th className="px-2 py-2 text-left text-xs font-semibold uppercase text-slate-600 dark:text-slate-300 sm:px-3">
                      Delete
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {users.map((user) => (
                    <tr key={user.id} className="bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/30">
                      <td className="px-2 py-2 align-top text-sm sm:px-3">
                        <div className="font-medium text-slate-900 dark:text-white">{user.full_name}</div>
                        <div className="text-xs text-slate-500 truncate max-w-[200px]">{user.email}</div>
                      </td>
                      <td className="px-2 py-2 align-top text-sm text-slate-700 dark:text-slate-300 sm:px-3">
                        {user.asset_balance != null && Number.isFinite(Number(user.asset_balance))
                          ? formatRsSignedAmount(Number(user.asset_balance))
                          : "—"}
                      </td>
                      <td className="px-2 py-2 align-top sm:px-3">
                        <UserStatusBadges user={user} />
                      </td>
                      <td className="px-2 py-2 align-top sm:px-3">
                        <button
                          type="button"
                          disabled={assigningId === user.id || !canBalance}
                          onClick={() => openAssignCycleModal(user)}
                          className="rounded-md bg-sky-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-sky-700 disabled:opacity-50"
                        >
                          {assigningId === user.id ? "…" : "Assign 30 Task Cycle"}
                        </button>
                      </td>
                      <td className="px-2 py-2 align-top sm:px-3">
                        <div className="flex max-w-[220px] flex-col gap-1.5">
                          <input
                            type="number"
                            min={0}
                            step="0.01"
                            placeholder="Deposit (positiveAdd)"
                            disabled={!canBalance}
                            value={balancePos[user.id] ?? ""}
                            onChange={(e) => setBalancePos((p) => ({ ...p, [user.id]: e.target.value }))}
                            className="w-full rounded-md border border-emerald-300 bg-white px-2 py-1 text-xs text-slate-900 placeholder:text-slate-500 caret-slate-900 disabled:opacity-60 dark:border-emerald-700 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-400 dark:caret-white"
                          />
                          <input
                            type="number"
                            min={0}
                            step="0.01"
                            placeholder="Negative runtime"
                            disabled={!canBalance}
                            value={balanceNeg[user.id] ?? ""}
                            onChange={(e) => setBalanceNeg((p) => ({ ...p, [user.id]: e.target.value }))}
                            className="w-full rounded-md border border-rose-300 bg-white px-2 py-1 text-xs text-slate-900 placeholder:text-slate-500 caret-slate-900 disabled:opacity-60 dark:border-rose-800 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-400 dark:caret-white"
                          />
                          <button
                            type="button"
                            disabled={!canBalance || balanceSavingId === user.id}
                            onClick={() => setBalanceConfirmUser(user)}
                            className="rounded-md bg-emerald-600 px-2 py-1 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                          >
                            Apply balance update
                          </button>
                        </div>
                      </td>
                      <td className="px-2 py-2 align-top sm:px-3">
                        <button
                          type="button"
                          disabled={deletingId === user.id || !canBalance}
                          onClick={() => handleDeleteUser(user)}
                          className="rounded-md bg-red-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
                        >
                          {deletingId === user.id ? "…" : "Delete"}
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
