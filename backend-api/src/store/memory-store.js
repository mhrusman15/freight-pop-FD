import bcrypt from "bcryptjs";
import { config } from "../config.js";

const users = [];
let nextId = 1;

function nowIso() {
  return new Date().toISOString();
}

async function seedAdmin() {
  const email = config.adminEmail.toLowerCase().trim();
  if (users.some((u) => u.email === email)) return;
  const passwordHash = await bcrypt.hash(config.adminPassword, 10);
  const ts = nowIso();
  users.push({
    id: nextId++,
    full_name: "Admin",
    email,
    phone: "+1000000000",
    password_hash: passwordHash,
    status: "approved",
    role: "super_admin",
    admin_permissions: "full",
    asset_balance: 20341.15,
    task_quota_total: 30,
    task_quota_used: 0,
    task_assignment_required: false,
    task_assignment_requested_at: null,
    task_assignment_granted_at: ts,
    created_at: ts,
    updated_at: ts,
  });
  console.log("[memory store] Admin user seeded:", email);
}

export const memoryStore = {
  async create({ fullName, email, phone, password }) {
    const normalizedEmail = email.trim().toLowerCase();
    if (users.some((u) => u.email === normalizedEmail)) {
      const err = new Error("EMAIL_EXISTS");
      err.code = "EMAIL_EXISTS";
      throw err;
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const ts = nowIso();
    const row = {
      id: nextId++,
      full_name: fullName,
      email: normalizedEmail,
      phone,
      password_hash: passwordHash,
      status: "pending",
      role: "user",
      asset_balance: 20341.15,
      task_quota_total: 30,
      task_quota_used: 0,
      task_assignment_required: false,
      task_assignment_requested_at: null,
      task_assignment_granted_at: ts,
      created_at: ts,
      updated_at: ts,
    };
    users.push(row);
    return { ...row };
  },

  async findByEmail(email) {
    const e = email.trim().toLowerCase();
    const u = users.find((x) => x.email === e);
    return u ? { ...u } : null;
  },

  async findById(id) {
    const u = users.find((x) => x.id === id);
    return u ? { id: u.id, full_name: u.full_name, email: u.email, phone: u.phone, status: u.status, role: u.role, admin_permissions: u.admin_permissions || null, asset_balance: u.asset_balance ?? 20341.15, created_at: u.created_at } : null;
  },

  async getBalance(userId) {
    const u = users.find((x) => x.id === userId);
    return u != null ? Number(u.asset_balance ?? 20341.15) : null;
  },

  async setBalance(userId, value) {
    const num = Number(value);
    if (!Number.isFinite(num) || num < 0) throw new Error("Invalid amount");
    const u = users.find((x) => x.id === userId);
    if (!u) return null;
    u.asset_balance = num;
    u.updated_at = nowIso();
    return u.asset_balance;
  },

  async addToBalance(userId, amount) {
    const num = Number(amount);
    if (!Number.isFinite(num) || num < 0) throw new Error("Invalid amount");
    const u = users.find((x) => x.id === userId);
    if (!u) return null;
    u.asset_balance = (Number(u.asset_balance) || 0) + num;
    u.updated_at = nowIso();
    return u.asset_balance;
  },

  async subtractFromBalance(userId, amount) {
    const num = Number(amount);
    if (!Number.isFinite(num) || num < 0) throw new Error("Invalid amount");
    const u = users.find((x) => x.id === userId);
    if (!u) return null;
    const current = Number(u.asset_balance) || 0;
    u.asset_balance = Math.max(0, current - num);
    u.updated_at = nowIso();
    return u.asset_balance;
  },

  async getPendingPaginated({ page = 1, limit = 10 }) {
    const pending = users.filter((u) => u.status === "pending").sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    const total = pending.length;
    const offset = (page - 1) * limit;
    const slice = pending.slice(offset, offset + limit);
    const usersOut = slice.map((u) => ({
      id: u.id,
      full_name: u.full_name,
      email: u.email,
      phone: u.phone,
      status: u.status,
      created_at: u.created_at,
      updated_at: u.updated_at || u.created_at,
    }));
    return { users: usersOut, total, page, limit, totalPages: Math.ceil(total / limit) || 1 };
  },

  async updateStatus(id, status) {
    if (!["approved", "rejected"].includes(status)) throw new Error("Invalid status");
    const u = users.find((x) => x.id === id && x.status === "pending");
    if (!u) return null;
    u.status = status;
    return { id: u.id, full_name: u.full_name, email: u.email, phone: u.phone, status: u.status, created_at: u.created_at };
  },

  async getUsersPaginated({ status = "approved", page = 1, limit = 10 }) {
    const filtered = users
      .filter((u) => u.status === status && u.role === "user")
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    const total = filtered.length;
    const offset = (page - 1) * limit;
    const slice = filtered.slice(offset, offset + limit);
    const usersOut = slice.map((u) => ({
      id: u.id,
      full_name: u.full_name,
      email: u.email,
      phone: u.phone,
      status: u.status,
      asset_balance: u.asset_balance ?? 20341.15,
      task_quota_total: u.task_quota_total ?? 30,
      task_quota_used: u.task_quota_used ?? 0,
      task_assignment_required: Boolean(u.task_assignment_required),
      task_assignment_requested_at: u.task_assignment_requested_at || null,
      task_assignment_granted_at: u.task_assignment_granted_at || null,
      created_at: u.created_at,
      updated_at: u.updated_at || u.created_at,
    }));
    return { users: usersOut, total, page, limit, totalPages: Math.ceil(total / limit) || 1 };
  },

  async updatePassword(userId, oldPasswordPlain, newPasswordPlain) {
    const u = users.find((x) => x.id === userId);
    if (!u) return null;
    const valid = await bcrypt.compare(oldPasswordPlain, u.password_hash);
    if (!valid) return false;
    u.password_hash = await bcrypt.hash(newPasswordPlain, 10);
    u.updated_at = nowIso();
    return true;
  },

  async getStats() {
    const totalUsers = users.filter((u) => u.role === "user").length;
    const pendingApproval = users.filter((u) => u.role === "user" && u.status === "pending").length;
    const activeUsers = users.filter((u) => u.role === "user" && u.status === "approved").length;
    const totalAdmins = users.filter((u) => u.role === "admin" || u.role === "super_admin").length;
    return { totalUsers, activeUsers, pendingApproval, totalAdmins };
  },

  async getAdmins() {
    const admins = users
      .filter((u) => u.role === "admin" || u.role === "super_admin")
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
    return admins.map((u) => ({
      id: u.id,
      full_name: u.full_name,
      email: u.email,
      phone: u.phone,
      role: u.role,
      admin_permissions: u.admin_permissions || "full",
      status: u.status,
      created_at: u.created_at,
      updated_at: u.updated_at || u.created_at,
    }));
  },

  async createAdmin({ fullName, email, phone, password, role = "admin", adminPermissions = "view_only" }) {
    const normalizedEmail = email.trim().toLowerCase();
    if (users.some((u) => u.email === normalizedEmail)) {
      const err = new Error("EMAIL_EXISTS");
      err.code = "EMAIL_EXISTS";
      throw err;
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const ts = nowIso();
    const row = {
      id: nextId++,
      full_name: fullName,
      email: normalizedEmail,
      phone,
      password_hash: passwordHash,
      status: "approved",
      role,
      admin_permissions: adminPermissions,
      asset_balance: 20341.15,
      task_quota_total: 30,
      task_quota_used: 0,
      task_assignment_required: false,
      task_assignment_requested_at: null,
      task_assignment_granted_at: ts,
      created_at: ts,
      updated_at: ts,
    };
    users.push(row);
    return { ...row };
  },

  async createAdminRequest({ fullName, email, phone, password, adminPermissions = "view_only" }) {
    const normalizedEmail = email.trim().toLowerCase();
    if (users.some((u) => u.email === normalizedEmail)) {
      const err = new Error("EMAIL_EXISTS");
      err.code = "EMAIL_EXISTS";
      throw err;
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const ts = nowIso();
    const row = {
      id: nextId++,
      full_name: fullName,
      email: normalizedEmail,
      phone,
      password_hash: passwordHash,
      status: "pending",
      role: "admin",
      admin_permissions: adminPermissions,
      asset_balance: 20341.15,
      task_quota_total: 30,
      task_quota_used: 0,
      task_assignment_required: false,
      task_assignment_requested_at: null,
      task_assignment_granted_at: ts,
      created_at: ts,
      updated_at: ts,
    };
    users.push(row);
    return { ...row };
  },

  async updateAdminPermissions(id, { role, adminPermissions }) {
    const u = users.find((x) => x.id === id && (x.role === "admin" || x.role === "super_admin"));
    if (!u) return null;
    if (role) {
      u.role = role;
    }
    if (adminPermissions) {
      u.admin_permissions = adminPermissions;
    }
    u.updated_at = nowIso();
    return {
      id: u.id,
      full_name: u.full_name,
      email: u.email,
      phone: u.phone,
      role: u.role,
      admin_permissions: u.admin_permissions,
      status: u.status,
      created_at: u.created_at,
      updated_at: u.updated_at,
    };
  },

  verifyPassword(plain, hash) {
    return bcrypt.compare(plain, hash);
  },

  async getTaskAssignmentStatus(userId) {
    const u = users.find((x) => x.id === userId);
    if (!u) return null;
    const total = Number(u.task_quota_total ?? 30);
    const used = Number(u.task_quota_used ?? 0);
    const required = Boolean(u.task_assignment_required);
    const requestedAt = u.task_assignment_requested_at
      ? new Date(u.task_assignment_requested_at)
      : null;
    const now = Date.now();
    const autoMs = 24 * 60 * 60 * 1000;
    if ((required || used >= total) && requestedAt && now - requestedAt.getTime() >= autoMs) {
      u.task_quota_total = 30;
      u.task_quota_used = 0;
      u.task_assignment_required = false;
      u.task_assignment_requested_at = null;
      u.task_assignment_granted_at = nowIso();
      u.updated_at = nowIso();
    }
    const total2 = Number(u.task_quota_total ?? 30);
    const used2 = Number(u.task_quota_used ?? 0);
    const required2 = Boolean(u.task_assignment_required);
    return {
      userId: u.id,
      quotaTotal: total2,
      quotaUsed: used2,
      remaining: Math.max(0, total2 - used2),
      requiresAdminAssignment: required2 || used2 >= total2,
      canPerformTasks: !required2 && used2 < total2,
      nextAutoAssignAt: u.task_assignment_requested_at
        ? new Date(new Date(u.task_assignment_requested_at).getTime() + autoMs).toISOString()
        : null,
      taskAssignmentRequestedAt: u.task_assignment_requested_at || null,
      taskAssignmentGrantedAt: u.task_assignment_granted_at || null,
    };
  },

  async markTaskCompleted(userId) {
    const u = users.find((x) => x.id === userId);
    if (!u) return { error: "User not found", code: "NOT_FOUND" };
    const status = await this.getTaskAssignmentStatus(userId);
    if (!status?.canPerformTasks) {
      return { error: "Task assignment required", code: "TASK_ASSIGNMENT_REQUIRED", status };
    }
    u.task_quota_total = Number(u.task_quota_total ?? 30);
    u.task_quota_used = Number(u.task_quota_used ?? 0) + 1;
    if (u.task_quota_used >= u.task_quota_total) {
      u.task_assignment_required = true;
      if (!u.task_assignment_requested_at) u.task_assignment_requested_at = nowIso();
    }
    u.updated_at = nowIso();
    return this.getTaskAssignmentStatus(userId);
  },

  async adminAssignTasks(userId) {
    const u = users.find((x) => x.id === userId && x.role === "user");
    if (!u) return null;
    u.task_quota_total = 30;
    u.task_quota_used = 0;
    u.task_assignment_required = false;
    u.task_assignment_requested_at = null;
    u.task_assignment_granted_at = nowIso();
    u.updated_at = nowIso();
    return this.getTaskAssignmentStatus(userId);
  },

  async init() {
    await seedAdmin();
  },
};
