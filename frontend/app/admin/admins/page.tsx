 "use client";

import { useEffect, useState } from "react";
import { adminApi, type AdminAdminRow } from "@/lib/api";
import { getAuthUser } from "@/lib/auth-store";

const PERMISSION_LABELS: Record<string, string> = {
  view_only: "View only",
  balance_only: "Change amount only",
  approve_only: "Approve users only",
  full: "Full access",
};

const PERMISSION_OPTIONS = Object.entries(PERMISSION_LABELS).map(([value, label]) => ({
  value,
  label,
}));

export default function AdminAdminsPage() {
  const [admins, setAdmins] = useState<AdminAdminRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<"admin" | "super_admin">("admin");
  const [newPermissions, setNewPermissions] = useState("view_only");

  const [savingId, setSavingId] = useState<string | null>(null);
  const [actionId, setActionId] = useState<string | null>(null);

  const currentUser = typeof window !== "undefined" ? getAuthUser() : null;
  const isSuperAdmin = currentUser?.role === "super_admin";

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError("");
      const res = await adminApi.getAdmins();
      if (cancelled) return;
      setLoading(false);
      if (res.error) {
        setError(res.error);
        setAdmins([]);
        return;
      }
      setAdmins(res.data?.admins ?? []);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim() || !newPhone.trim() || !newPassword) {
      setError("Please fill all fields for the new admin.");
      return;
    }
    setCreating(true);
    setError("");
    const res = await adminApi.createAdmin({
      fullName: newName.trim(),
      email: newEmail.trim().toLowerCase(),
      phone: newPhone.trim(),
      password: newPassword,
      role: newRole,
      permissions: newPermissions,
    });
    setCreating(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    if (res.data?.admin) {
      setAdmins((prev) => [...prev, res.data!.admin]);
      setNewName("");
      setNewEmail("");
      setNewPhone("");
      setNewPassword("");
      setNewRole("admin");
      setNewPermissions("view_only");
    }
  };

  const handleChangePermissions = async (
    admin: AdminAdminRow,
    role: "admin" | "super_admin",
    permissions: string
  ) => {
    setSavingId(admin.id);
    setError("");
    const res = await adminApi.updateAdmin(admin.id, { role, permissions });
    setSavingId(null);
    if (res.error) {
      setError(res.error);
      return;
    }
    if (res.data?.admin) {
      setAdmins((prev) => prev.map((a) => (a.id === admin.id ? res.data!.admin : a)));
    }
  };

  const handleApprovePending = async (admin: AdminAdminRow) => {
    setActionId(admin.id);
    setError("");
    const res = await adminApi.approve(admin.id);
    setActionId(null);
    if (res.error) {
      setError(res.error);
      return;
    }
    setAdmins((prev) =>
      prev.map((a) => (a.id === admin.id ? { ...a, status: "approved" } : a))
    );
  };

  const handleRejectPending = async (admin: AdminAdminRow) => {
    setActionId(admin.id);
    setError("");
    const res = await adminApi.reject(admin.id);
    setActionId(null);
    if (res.error) {
      setError(res.error);
      return;
    }
    setAdmins((prev) =>
      prev.map((a) => (a.id === admin.id ? { ...a, status: "rejected" } : a))
    );
  };

  if (!isSuperAdmin) {
    return (
      <div className="min-w-0">
        <h1 className="text-xl font-bold text-slate-900 dark:text-white sm:text-2xl">Admins</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Only super admin can manage admin accounts and roles.
        </p>
      </div>
    );
  }

  return (
    <div className="min-w-0">
      <h1 className="text-xl font-bold text-slate-900 dark:text-white sm:text-2xl">Admins</h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Manage admin accounts, roles, and permissions.
      </p>

      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-700 dark:bg-red-900/40 dark:text-red-100 sm:px-4 sm:py-3">
          {error}
        </div>
      )}

      <section className="mt-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800 sm:mt-6 sm:p-6">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
          Add new admin
        </h2>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Super admin can create more admins and control what they can do in the system.
        </p>
        <form
          onSubmit={handleCreate}
          className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
        >
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
              Full name
            </label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-50"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
              Email
            </label>
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-50"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
              Phone
            </label>
            <input
              type="text"
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
              className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-50"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
              Password
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-50"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
              Role
            </label>
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value as "admin" | "super_admin")}
              className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-50"
            >
              <option value="admin">Admin</option>
              <option value="super_admin">Super admin</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-600 dark:text-slate-300">
              Permissions
            </label>
            <select
              value={newPermissions}
              onChange={(e) => setNewPermissions(e.target.value)}
              className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-50"
            >
              {PERMISSION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={creating}
              className="inline-flex w-full items-center justify-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-60"
            >
              {creating ? "Creating…" : "Create admin"}
            </button>
          </div>
        </form>
      </section>

      <section className="mt-6 rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
        <div className="border-b border-slate-200 px-4 py-3 dark:border-slate-700 sm:px-6">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">Admin list</h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Adjust what each admin can do: view only, edit, approve requests, or full access.
          </p>
        </div>
        {loading ? (
          <div className="p-6 text-sm text-slate-500 dark:text-slate-400">Loading…</div>
        ) : admins.length === 0 ? (
          <div className="p-6 text-sm text-slate-500 dark:text-slate-400">
            No admins found. Use the form above to create one.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-700">
              <thead className="bg-slate-50 dark:bg-slate-700/60">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-200">
                    Name
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-200">
                    Email
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-200">
                    Role
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-200">
                    Permissions
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-200">
                    Status
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-200">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {admins.map((admin) => {
                  const currentPerm = admin.admin_permissions || "full";
                  const canEdit = admin.id !== currentUser?.id;
                  return (
                    <tr key={admin.id} className="bg-white dark:bg-slate-800">
                      <td className="px-3 py-2 text-slate-900 dark:text-slate-50">
                        {admin.full_name}
                      </td>
                      <td className="px-3 py-2 text-slate-700 dark:text-slate-200">
                        {admin.email}
                      </td>
                      <td className="px-3 py-2 text-slate-700 dark:text-slate-200">
                        <select
                          value={admin.role}
                          disabled={!canEdit || savingId === admin.id}
                          onChange={(e) =>
                            handleChangePermissions(
                              admin,
                              e.target.value as "admin" | "super_admin",
                              currentPerm
                            )
                          }
                          className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-50"
                        >
                          <option value="admin">Admin</option>
                          <option value="super_admin">Super admin</option>
                        </select>
                      </td>
                      <td className="px-3 py-2 text-slate-700 dark:text-slate-200">
                        <select
                          value={currentPerm}
                          disabled={!canEdit || savingId === admin.id}
                          onChange={(e) =>
                            handleChangePermissions(
                              admin,
                              admin.role,
                              e.target.value
                            )
                          }
                          className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-50"
                        >
                          {PERMISSION_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-2 text-slate-700 dark:text-slate-200">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs ${
                          admin.status === "approved"
                            ? "bg-emerald-100 text-emerald-700"
                            : admin.status === "pending"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-red-100 text-red-700"
                        }`}>
                          {admin.status}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-slate-700 dark:text-slate-200">
                        {admin.status === "pending" ? (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              disabled={actionId === admin.id}
                              onClick={() => handleApprovePending(admin)}
                              className="rounded-md bg-emerald-600 px-2 py-1 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                            >
                              Approve
                            </button>
                            <button
                              type="button"
                              disabled={actionId === admin.id}
                              onClick={() => handleRejectPending(admin)}
                              className="rounded-md border border-slate-300 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
