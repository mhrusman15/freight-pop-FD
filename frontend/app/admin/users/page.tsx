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
  const slots = user.prime_order_slots ?? [];
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

  const [assignConfirmUser, setAssignConfirmUser] = useState<AdminUserRow | null>(null);
  const [primeModalUser, setPrimeModalUser] = useState<AdminUserRow | null>(null);
  const [primeSlots, setPrimeSlots] = useState<number[]>([]);
  const [savingPrime, setSavingPrime] = useState(false);
  const [primeRequireRecharge, setPrimeRequireRecharge] = useState(false);
  const [primeRechargeRs, setPrimeRechargeRs] = useState("");

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

  const confirmAssignTasks = async () => {
    if (!assignConfirmUser) return;
    setAssigningId(assignConfirmUser.id);
    setError("");
    const res = await adminApi.assignUserTasks(assignConfirmUser.id);
    setAssigningId(null);
    setAssignConfirmUser(null);
    if (res.error) {
      setError(res.error);
      showToast("error", res.error);
      return;
    }
    setSuccess("");
    showToast("success", "30 tasks assigned successfully.");
    load(page);
  };

  const togglePrimeSlot = (slot: number) => {
    setPrimeSlots((prev) =>
      prev.includes(slot) ? prev.filter((x) => x !== slot) : [...prev, slot].sort((a, b) => a - b),
    );
  };

  const submitPrimeOrders = async () => {
    if (!primeModalUser) return;
    if (primeSlots.length === 0) {
      await clearPrimeSlots();
      return;
    }
    const noNegative = !primeRequireRecharge;
    const negRaw = primeRechargeRs.trim() === "" ? 0 : Number(primeRechargeRs);
    if (primeRequireRecharge && (!Number.isFinite(negRaw) || negRaw <= 0)) {
      setError("Enter a valid recharge amount (Rs) when “Require Recharge” is on.");
      showToast("error", "Enter a valid recharge amount.");
      return;
    }
    setSavingPrime(true);
    setError("");
    const res = await adminApi.assignPrimeOrders(primeModalUser.id, primeSlots, {
      noNegative,
      negativeAmount: noNegative ? 0 : negRaw,
    });
    setSavingPrime(false);
    if (res.error) {
      setError(res.error);
      showToast("error", res.error);
      return;
    }
    setPrimeModalUser(null);
    setPrimeSlots([]);
    setPrimeRequireRecharge(false);
    setPrimeRechargeRs("");
    showToast("success", "Prime order configuration saved.");
    load(page);
  };

  const clearPrimeSlots = async () => {
    if (!primeModalUser) return;
    setSavingPrime(true);
    setError("");
    const res = await adminApi.assignPrimeOrders(primeModalUser.id, [], {
      noNegative: true,
      negativeAmount: 0,
    });
    setSavingPrime(false);
    if (res.error) {
      setError(res.error);
      showToast("error", res.error);
      return;
    }
    setPrimeModalUser(null);
    setPrimeSlots([]);
    setPrimeRequireRecharge(false);
    setPrimeRechargeRs("");
    showToast("success", "Prime configuration cleared.");
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
        Manage users. Task assignment, prime orders, and balance updates are separate actions.
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
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200 sm:px-4 sm:py-3">
          {error}
        </div>
      )}
      {success && (
        <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-100 sm:px-4 sm:py-3">
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
        open={assignConfirmUser != null}
        title="Assign 30 tasks"
        onClose={() => setAssignConfirmUser(null)}
      >
        <p className="text-sm text-slate-600 dark:text-slate-300">
          This will reset current tasks and assign a new 30-task cycle for{" "}
          <strong>{assignConfirmUser?.full_name}</strong>.
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setAssignConfirmUser(null)}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={assigningId === assignConfirmUser?.id}
            onClick={confirmAssignTasks}
            className="rounded-md bg-sky-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-sky-700 disabled:opacity-60"
          >
            {assigningId === assignConfirmUser?.id ? "Assigning…" : "Confirm"}
          </button>
        </div>
      </ModalBackdrop>

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

      {primeModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-3">
          <div className="w-full max-w-xl rounded-xl border border-slate-200 bg-white p-4 shadow-lg dark:border-slate-700 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Prime Order Configuration</h3>
              <button
                type="button"
                onClick={() => setPrimeModalUser(null)}
                className="rounded-md px-2 py-1 text-xs text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Close
              </button>
            </div>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              Select task numbers (1–{TASK_ASSIGN_LIMIT}) for prime orders. This does not assign the 30-task cycle.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-3 border-b border-slate-200 pb-3 dark:border-slate-600">
              <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-slate-800 dark:text-slate-200">
                <input
                  type="checkbox"
                  checked={primeRequireRecharge}
                  onChange={(e) => setPrimeRequireRecharge(e.target.checked)}
                  className="rounded border-slate-300"
                />
                Require Recharge for Prime Tasks
              </label>
              <label className="flex flex-col gap-1 text-xs font-medium text-slate-700 dark:text-slate-300">
                Recharge Amount (Rs)
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  disabled={!primeRequireRecharge}
                  value={primeRechargeRs}
                  onChange={(e) => setPrimeRechargeRs(e.target.value)}
                  className="w-40 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-900 placeholder:text-slate-500 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-400"
                />
              </label>
            </div>
            <div className="mt-3 grid grid-cols-6 gap-2 sm:grid-cols-10">
              {Array.from({ length: TASK_ASSIGN_LIMIT }, (_, i) => i + 1).map((n) => {
                const checked = primeSlots.includes(n);
                return (
                  <button
                    key={n}
                    type="button"
                    onClick={() => togglePrimeSlot(n)}
                    className={`rounded border px-2 py-1 text-xs font-medium ${
                      checked
                        ? "border-violet-500 bg-violet-50 text-violet-800 dark:border-violet-500 dark:bg-violet-900/30 dark:text-violet-200"
                        : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
                    }`}
                  >
                    {n}
                  </button>
                );
              })}
            </div>
            <div className="mt-4 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => void clearPrimeSlots()}
                disabled={savingPrime}
                className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Clear prime slots
              </button>
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
                onClick={submitPrimeOrders}
                className="rounded-md bg-violet-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-violet-700 disabled:opacity-60"
              >
                {savingPrime ? "Saving…" : "Assign Prime Orders"}
              </button>
            </div>
          </div>
        </div>
      )}

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
                      Task control
                    </th>
                    <th className="px-2 py-2 text-left text-xs font-semibold uppercase text-slate-600 dark:text-slate-300 sm:px-3">
                      Prime orders
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
                          onClick={() => setAssignConfirmUser(user)}
                          className="rounded-md bg-sky-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-sky-700 disabled:opacity-50"
                        >
                          {assigningId === user.id ? "…" : `Assign ${TASK_ASSIGN_LIMIT} tasks`}
                        </button>
                      </td>
                      <td className="px-2 py-2 align-top sm:px-3">
                        <button
                          type="button"
                          disabled={!canBalance}
                          onClick={() => {
                            setPrimeModalUser(user);
                            const slots = [...(user.prime_order_slots ?? [])].sort((a, b) => a - b);
                            setPrimeSlots(slots);
                            const pn = Math.max(0, Number(user.prime_negative_amount ?? 0) || 0);
                            setPrimeRequireRecharge(pn > 0);
                            setPrimeRechargeRs(pn > 0 ? String(pn) : "");
                          }}
                          className="rounded-md bg-violet-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-violet-700 disabled:opacity-50"
                        >
                          Configure
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
