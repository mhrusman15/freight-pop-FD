import { config } from "../config.js";
import { pool } from "../db/pool.js";
import { memoryStore } from "../store/memory-store.js";
import bcrypt from "bcryptjs";

const store = config.useMemoryStore ? memoryStore : null;
const TASK_DAILY_LIMIT = 30;
const AUTO_ASSIGN_HOURS = 24;

// In-memory list of users whose sessions should be treated as invalid.
// Used to force logout after sensitive admin actions (e.g. balance change).
const invalidatedUserIds = new Set();
const primeOrderSlotsByUser = new Map(); // userId -> Set(1..30)
const taskActivitiesByUser = new Map(); // userId -> [{...}]
const pendingActivityByUser = new Map(); // userId -> activityId

const TASK_CATALOG = [
  { title: "Luxury Order", image: "/assets/tasks/Girl-bag.jpg", min: 55000, max: 65000, commissionMin: 1800, commissionMax: 2600 },
  { title: "Brand Vault", image: "/assets/tasks/Man-Watch.jpg", min: 42000, max: 58000, commissionMin: 1200, commissionMax: 1900 },
  { title: "Prime Select", image: "/assets/tasks/perfume.png", min: 30000, max: 52000, commissionMin: 950, commissionMax: 1500 },
  { title: "Elite Choice", image: "/assets/tasks/Man-Shoes.jpg", min: 20000, max: 35000, commissionMin: 700, commissionMax: 1200 },
];

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function nowIso() {
  return new Date().toISOString();
}
function buildEmailCandidates(emailRaw) {
  const base = String(emailRaw || "").trim().toLowerCase();
  if (!base) return [];
  const set = new Set([base]);
  // Backward-compatible admin alias support.
  if (base === "admin@gamil.com") set.add("admin@gmail.com");
  if (base === "admin@gmail.com") set.add("admin@gamil.com");
  return [...set];
}
function generateOrderNumber(now = new Date()) {
  const pad2 = (n) => String(n).padStart(2, "0");
  const ymdhms =
    String(now.getFullYear()) +
    pad2(now.getMonth() + 1) +
    pad2(now.getDate()) +
    pad2(now.getHours()) +
    pad2(now.getMinutes()) +
    pad2(now.getSeconds());
  return `02${randomInt(1000, 9999)}${ymdhms}${randomInt(10, 99)}`;
}
function makeActivityTask(taskNo, isPrime) {
  const template = isPrime ? TASK_CATALOG[0] : TASK_CATALOG[randomInt(1, TASK_CATALOG.length - 1)];
  const quantity = randomInt(template.min, template.max);
  const commission = randomInt(template.commissionMin * 100, template.commissionMax * 100) / 100;
  return {
    taskNo,
    title: template.title,
    image: template.image,
    quantityRs: Number(quantity.toFixed ? quantity.toFixed(2) : quantity),
    commissionRs: Number(commission.toFixed(2)),
    rewards: 1,
    isPrime,
  };
}
function buildPendingActivity(taskNo, isPrime) {
  const task = makeActivityTask(taskNo, isPrime);
  const createdAt = nowIso();
  return {
    id: `act-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    title: task.title,
    orderNumber: generateOrderNumber(new Date(createdAt)),
    quantityRs: task.quantityRs,
    commissionRs: task.commissionRs,
    createdAt,
    status: "pending",
    taskNo,
    isPrime,
    task,
  };
}

export const User = {
  async create({ fullName, email, phone, password }) {
    if (store) return store.create({ fullName, email, phone, password });
    const passwordHash = await bcrypt.hash(password, 10);
    const { rows } = await pool.query(
      `INSERT INTO users (full_name, email, phone, password_hash, status, role, task_quota_total, task_quota_used)
       VALUES ($1, $2, $3, $4, 'pending', 'user', $5, 0)
       RETURNING id, full_name, email, phone, status, role, created_at`,
      [fullName, email.trim().toLowerCase(), phone, passwordHash, TASK_DAILY_LIMIT]
    );
    return rows[0];
  },

  async findByEmail(email) {
    if (store) return store.findByEmail(email);
    const candidates = buildEmailCandidates(email);
    if (!candidates.length) return null;
    const { rows } = await pool.query(
      `SELECT id, full_name, email, phone, password_hash, status, role, admin_permissions, created_at, asset_balance
       FROM users
       WHERE LOWER(TRIM(email)) = ANY($1::text[])
       LIMIT 1`,
      [candidates]
    );
    return rows[0] || null;
  },

  async findById(id) {
    if (store) return store.findById(id);
    const { rows } = await pool.query(
      `SELECT id, full_name, email, phone, status, role, admin_permissions, created_at, asset_balance
       FROM users WHERE id = $1`,
      [id]
    );
    return rows[0] || null;
  },

  async getBalance(userId) {
    if (store) return store.getBalance(userId);
    const { rows } = await pool.query(
      `SELECT COALESCE(asset_balance, 0)::float AS balance FROM users WHERE id = $1`,
      [userId]
    );
    return rows[0] ? Number(rows[0].balance) : null;
  },

  async setBalance(userId, value) {
    if (store) return store.setBalance(userId, value);
    const num = Number(value);
    if (!Number.isFinite(num) || num < 0) throw new Error("Invalid amount");
    const { rows } = await pool.query(
      `UPDATE users
       SET asset_balance = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING asset_balance::float AS new_balance`,
      [num, userId]
    );
    return rows[0] ? Number(rows[0].new_balance) : null;
  },

  async addToBalance(userId, amount) {
    if (store) return store.addToBalance(userId, amount);
    const num = Number(amount);
    if (!Number.isFinite(num) || num < 0) throw new Error("Invalid amount");
    const { rows } = await pool.query(
      `UPDATE users SET asset_balance = COALESCE(asset_balance, 0) + $1, updated_at = NOW()
       WHERE id = $2 RETURNING asset_balance::float AS new_balance`,
      [num, userId]
    );
    return rows[0] ? Number(rows[0].new_balance) : null;
  },

  async subtractFromBalance(userId, amount) {
    if (store) return store.subtractFromBalance(userId, amount);
    const num = Number(amount);
    if (!Number.isFinite(num) || num < 0) throw new Error("Invalid amount");
    const { rows } = await pool.query(
      `UPDATE users SET asset_balance = GREATEST(0, COALESCE(asset_balance, 0) - $1), updated_at = NOW()
       WHERE id = $2 RETURNING asset_balance::float AS new_balance`,
      [num, userId]
    );
    return rows[0] ? Number(rows[0].new_balance) : null;
  },

  async getPendingPaginated({ page = 1, limit = 10 }) {
    if (store) return store.getPendingPaginated({ page, limit });
    const offset = (page - 1) * limit;
    const countResult = await pool.query(
      "SELECT COUNT(*)::int AS total FROM users WHERE status = 'pending'"
    );
    const total = countResult.rows[0].total;
    const { rows } = await pool.query(
      `SELECT id, full_name, email, phone, status, created_at, updated_at
       FROM users
       WHERE status = 'pending'
       ORDER BY created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    return { users: rows, total, page, limit, totalPages: Math.ceil(total / limit) };
  },

  async updateStatus(id, status) {
    if (store) return store.updateStatus(id, status);
    if (!["approved", "rejected"].includes(status)) {
      throw new Error("Invalid status");
    }
    const { rows } = await pool.query(
      `UPDATE users SET status = $1, updated_at = NOW()
       WHERE id = $2 AND status = 'pending'
       RETURNING id, full_name, email, phone, status, created_at`,
      [status, id]
    );
    return rows[0] || null;
  },

  async getUsersPaginated({ status = "approved", page = 1, limit = 10 }) {
    if (store) return store.getUsersPaginated({ status, page, limit });
    const offset = (page - 1) * limit;
    const countResult = await pool.query(
      "SELECT COUNT(*)::int AS total FROM users WHERE status = $1 AND role = 'user'",
      [status]
    );
    const total = countResult.rows[0].total;
    try {
      const { rows } = await pool.query(
        `SELECT id, full_name, email, phone, status, created_at, updated_at, asset_balance,
                COALESCE(task_quota_total, $4)::int AS task_quota_total,
                COALESCE(task_quota_used, 0)::int AS task_quota_used,
                task_assignment_required,
                task_assignment_requested_at,
                task_assignment_granted_at
         FROM users
         WHERE status = $1 AND role = 'user'
         ORDER BY created_at DESC
         LIMIT $2 OFFSET $3`,
        [status, limit, offset, TASK_DAILY_LIMIT]
      );
      return { users: rows, total, page, limit, totalPages: Math.ceil(total / limit) || 1 };
    } catch (err) {
      // Backward compatibility: DB may not have new task columns yet.
      if (err?.code !== "42703") throw err;
      const { rows } = await pool.query(
        `SELECT id, full_name, email, phone, status, created_at, updated_at, asset_balance
         FROM users
         WHERE status = $1 AND role = 'user'
         ORDER BY created_at DESC
         LIMIT $2 OFFSET $3`,
        [status, limit, offset]
      );
      return {
        users: rows.map((r) => ({
          ...r,
          task_quota_total: TASK_DAILY_LIMIT,
          task_quota_used: 0,
          task_assignment_required: false,
          task_assignment_requested_at: null,
          task_assignment_granted_at: null,
        })),
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      };
    }
  },

  async updatePassword(userId, oldPasswordPlain, newPasswordPlain) {
    if (store) return store.updatePassword(userId, oldPasswordPlain, newPasswordPlain);
    const userRows = await pool.query(
      `SELECT id, password_hash FROM users WHERE id = $1`,
      [userId]
    );
    const user = userRows.rows[0];
    if (!user) return null;
    const valid = await bcrypt.compare(oldPasswordPlain, user.password_hash);
    if (!valid) return false;
    const newHash = await bcrypt.hash(newPasswordPlain, 10);
    await pool.query(
      `UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2`,
      [newHash, userId]
    );
    return true;
  },

  async getStats() {
    if (store) return store.getStats();
    const totalResult = await pool.query(
      "SELECT COUNT(*)::int AS total FROM users WHERE role = 'user'"
    );
    const pendingResult = await pool.query(
      "SELECT COUNT(*)::int AS total FROM users WHERE status = 'pending' AND role = 'user'"
    );
    const approvedResult = await pool.query(
      "SELECT COUNT(*)::int AS total FROM users WHERE status = 'approved' AND role = 'user'"
    );
    const adminsResult = await pool.query(
      "SELECT COUNT(*)::int AS total FROM users WHERE role IN ('admin','super_admin')"
    );
    return {
      totalUsers: totalResult.rows[0].total,
      activeUsers: approvedResult.rows[0].total,
      pendingApproval: pendingResult.rows[0].total,
      totalAdmins: adminsResult.rows[0].total,
    };
  },
  verifyPassword(plain, hash) {
    return bcrypt.compare(plain, hash);
  },

  async getAdmins() {
    if (store) {
      return store.getAdmins();
    }
    const { rows } = await pool.query(
      `SELECT id, full_name, email, phone, role, admin_permissions, status, created_at, updated_at
       FROM users
       WHERE role IN ('admin', 'super_admin')
       ORDER BY role DESC, created_at ASC`
    );
    return rows;
  },

  async createAdmin({ fullName, email, phone, password, role = "admin", adminPermissions = "view_only" }) {
    if (!["admin", "super_admin"].includes(role)) {
      throw new Error("Invalid admin role");
    }
    if (store) {
      return store.createAdmin({ fullName, email, phone, password, role, adminPermissions });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const { rows } = await pool.query(
      `INSERT INTO users (full_name, email, phone, password_hash, status, role, admin_permissions)
       VALUES ($1, $2, $3, $4, 'approved', $5, $6)
       RETURNING id, full_name, email, phone, role, admin_permissions, status, created_at, updated_at`,
      [fullName, email.trim().toLowerCase(), phone, passwordHash, role, adminPermissions]
    );
    return rows[0];
  },

  async createAdminRequest({ fullName, email, phone, password, adminPermissions = "view_only" }) {
    const allowed = new Set(["view_only", "balance_only", "approve_only", "full"]);
    const permissionValue = allowed.has(adminPermissions) ? adminPermissions : "view_only";
    if (store) {
      return store.createAdminRequest({ fullName, email, phone, password, adminPermissions: permissionValue });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const { rows } = await pool.query(
      `INSERT INTO users (full_name, email, phone, password_hash, status, role, admin_permissions)
       VALUES ($1, $2, $3, $4, 'pending', 'admin', $5)
       RETURNING id, full_name, email, phone, role, admin_permissions, status, created_at, updated_at`,
      [fullName, email.trim().toLowerCase(), phone, passwordHash, permissionValue]
    );
    return rows[0];
  },

  async updateAdminPermissions(id, { role, adminPermissions }) {
    if (store) {
      return store.updateAdminPermissions(id, { role, adminPermissions });
    }
    const updates = [];
    const values = [];
    let idx = 1;

    if (role) {
      if (!["admin", "super_admin"].includes(role)) {
        throw new Error("Invalid admin role");
      }
      updates.push(`role = $${idx++}`);
      values.push(role);
    }
    if (adminPermissions) {
      updates.push(`admin_permissions = $${idx++}`);
      values.push(adminPermissions);
    }
    if (!updates.length) return null;

    values.push(id);
    if (store) {
      // For memory store we only care that call succeeds; skip implementation for brevity.
      return null;
    }
    const { rows } = await pool.query(
      `UPDATE users
       SET ${updates.join(", ")}, updated_at = NOW()
       WHERE id = $${idx} AND role IN ('admin','super_admin')
       RETURNING id, full_name, email, phone, role, admin_permissions, status, created_at, updated_at`,
      values
    );
    return rows[0] || null;
  },

  async getTaskAssignmentStatus(userId) {
    if (store) return store.getTaskAssignmentStatus(userId);
    let row;
    try {
      const { rows } = await pool.query(
        `SELECT id,
                COALESCE(task_quota_total, $2)::int AS task_quota_total,
                COALESCE(task_quota_used, 0)::int AS task_quota_used,
                COALESCE(task_assignment_required, FALSE) AS task_assignment_required,
                task_assignment_requested_at,
                task_assignment_granted_at
         FROM users
         WHERE id = $1`,
        [userId, TASK_DAILY_LIMIT]
      );
      row = rows[0];
    } catch (err) {
      if (err?.code !== "42703") throw err;
      const { rows } = await pool.query(
        `SELECT id FROM users WHERE id = $1`,
        [userId]
      );
      row = rows[0]
        ? {
            id: rows[0].id,
            task_quota_total: TASK_DAILY_LIMIT,
            task_quota_used: 0,
            task_assignment_required: false,
            task_assignment_requested_at: null,
            task_assignment_granted_at: null,
          }
        : null;
    }
    if (!row) return null;

    const total = Number(row.task_quota_total || TASK_DAILY_LIMIT);
    const used = Number(row.task_quota_used || 0);
    const required = Boolean(row.task_assignment_required);
    const requestedAt = row.task_assignment_requested_at
      ? new Date(row.task_assignment_requested_at)
      : null;
    const grantedAt = row.task_assignment_granted_at
      ? new Date(row.task_assignment_granted_at)
      : null;

    const now = Date.now();
    const autoAssignMs = AUTO_ASSIGN_HOURS * 60 * 60 * 1000;
    const needsApproval = required || used >= total;
    const shouldAutoAssign =
      needsApproval && requestedAt && now - requestedAt.getTime() >= autoAssignMs;

    if (shouldAutoAssign) {
      const { rows: updatedRows } = await pool.query(
        `UPDATE users
         SET task_quota_used = 0,
             task_assignment_required = FALSE,
             task_assignment_granted_at = NOW(),
             task_assignment_requested_at = NULL,
             task_quota_total = COALESCE(task_quota_total, $2),
             updated_at = NOW()
         WHERE id = $1
         RETURNING id,
                   COALESCE(task_quota_total, $2)::int AS task_quota_total,
                   COALESCE(task_quota_used, 0)::int AS task_quota_used,
                   COALESCE(task_assignment_required, FALSE) AS task_assignment_required,
                   task_assignment_requested_at,
                   task_assignment_granted_at`,
        [userId, TASK_DAILY_LIMIT]
      );
      const r = updatedRows[0];
      return {
        userId,
        quotaTotal: Number(r.task_quota_total || TASK_DAILY_LIMIT),
        quotaUsed: Number(r.task_quota_used || 0),
        remaining: Math.max(0, Number(r.task_quota_total || TASK_DAILY_LIMIT) - Number(r.task_quota_used || 0)),
        requiresAdminAssignment: Boolean(r.task_assignment_required),
        canPerformTasks: true,
        nextAutoAssignAt: null,
      };
    }

    const remaining = Math.max(0, total - used);
    const nextAutoAssignAt = needsApproval && requestedAt
      ? new Date(requestedAt.getTime() + autoAssignMs).toISOString()
      : null;
    const canPerformTasks = remaining > 0 && !required;
    return {
      userId,
      quotaTotal: total,
      quotaUsed: used,
      remaining,
      requiresAdminAssignment: required || used >= total,
      canPerformTasks,
      nextAutoAssignAt,
      taskAssignmentRequestedAt: requestedAt ? requestedAt.toISOString() : null,
      taskAssignmentGrantedAt: grantedAt ? grantedAt.toISOString() : null,
    };
  },

  async markTaskCompleted(userId, activityId = null) {
    const idNum = Number(userId);
    const activities = taskActivitiesByUser.get(idNum) || [];
    const targetPending = activities.find(
      (a) => a.status === "pending" && (activityId ? a.id === activityId : true)
    );
    if (!targetPending) {
      return { error: "No pending task found", code: "PENDING_TASK_NOT_FOUND" };
    }
    if (targetPending.isPrime) {
      return { error: "check your acitivty task you get prime order", code: "PRIME_ORDER_PENDING" };
    }
    if (store) {
      const status = await store.markTaskCompleted(userId);
      if (status?.code) return status;
      const now = nowIso();
      const nextActivities = activities.map((a) =>
        a.id === targetPending.id ? { ...a, status: "completed", completedAt: now } : a
      );
      taskActivitiesByUser.set(idNum, nextActivities);
      pendingActivityByUser.delete(idNum);
      return { ...(status || {}), activity: nextActivities.find((a) => a.id === targetPending.id) };
    }
    const status = await this.getTaskAssignmentStatus(userId);
    if (!status) return { error: "User not found", code: "NOT_FOUND" };
    if (!status.canPerformTasks) {
      return { error: "Task assignment required", code: "TASK_ASSIGNMENT_REQUIRED", status };
    }

    try {
      const { rows } = await pool.query(
        `UPDATE users
         SET task_quota_used = COALESCE(task_quota_used, 0) + 1,
             task_quota_total = COALESCE(task_quota_total, $2),
             updated_at = NOW()
         WHERE id = $1
         RETURNING COALESCE(task_quota_total, $2)::int AS task_quota_total,
                   COALESCE(task_quota_used, 0)::int AS task_quota_used`,
        [userId, TASK_DAILY_LIMIT]
      );
      if (!rows[0]) return { error: "User not found", code: "NOT_FOUND" };
      const total = Number(rows[0].task_quota_total || TASK_DAILY_LIMIT);
      const used = Number(rows[0].task_quota_used || 0);

      if (used >= total) {
        await pool.query(
          `UPDATE users
           SET task_assignment_required = TRUE,
               task_assignment_requested_at = COALESCE(task_assignment_requested_at, NOW()),
               updated_at = NOW()
           WHERE id = $1`,
          [userId]
        );
      }
    } catch (err) {
      if (err?.code !== "42703") throw err;
      // Legacy DB fallback: allow completion when columns are not present.
    }

    const now = nowIso();
    const nextActivities = activities.map((a) =>
      a.id === targetPending.id ? { ...a, status: "completed", completedAt: now } : a
    );
    taskActivitiesByUser.set(idNum, nextActivities);
    pendingActivityByUser.delete(idNum);
    const nextStatus = await this.getTaskAssignmentStatus(userId);
    return { ...(nextStatus || {}), activity: nextActivities.find((a) => a.id === targetPending.id) };
  },

  async adminAssignTasks(userId) {
    if (store) return store.adminAssignTasks(userId);
    let rows;
    try {
      ({ rows } = await pool.query(
        `UPDATE users
         SET task_quota_total = $2,
             task_quota_used = 0,
             task_assignment_required = FALSE,
             task_assignment_requested_at = NULL,
             task_assignment_granted_at = NOW(),
             updated_at = NOW()
         WHERE id = $1 AND role = 'user'
         RETURNING id`,
        [userId, TASK_DAILY_LIMIT]
      ));
    } catch (err) {
      if (err?.code !== "42703") throw err;
      ({ rows } = await pool.query(
        `UPDATE users
         SET updated_at = NOW()
         WHERE id = $1 AND role = 'user'
         RETURNING id`,
        [userId]
      ));
    }
    if (!rows[0]) return null;
    const idNum = Number(userId);
    const slots = primeOrderSlotsByUser.get(idNum) || new Set();
    const firstTaskPending = buildPendingActivity(1, slots.has(1));
    const existing = taskActivitiesByUser.get(idNum) || [];
    const completedOnly = existing.filter((a) => a.status !== "pending");
    taskActivitiesByUser.set(idNum, [firstTaskPending, ...completedOnly]);
    pendingActivityByUser.set(idNum, firstTaskPending.id);
    return this.getTaskAssignmentStatus(userId);
  },

  async adminAssignPrimeOrders(userId, slots = []) {
    const idNum = Number(userId);
    if (!Number.isFinite(idNum)) return null;
    const user = await this.findById(idNum);
    if (!user || user.role !== "user") return null;
    const cleaned = Array.from(
      new Set(
        (Array.isArray(slots) ? slots : [])
          .map((n) => Number(n))
          .filter((n) => Number.isInteger(n) && n >= 1 && n <= 30)
      )
    ).sort((a, b) => a - b);
    primeOrderSlotsByUser.set(idNum, new Set(cleaned));
    const activities = taskActivitiesByUser.get(idNum) || [];
    const currentPending = activities.find((a) => a.status === "pending") || null;
    const shouldPrimeFirstTask = cleaned.includes(1);
    if (!currentPending) {
      const firstTaskPending = buildPendingActivity(1, shouldPrimeFirstTask);
      taskActivitiesByUser.set(idNum, [firstTaskPending, ...activities]);
      pendingActivityByUser.set(idNum, firstTaskPending.id);
    } else if (Number(currentPending.taskNo) === 1) {
      const replacement = buildPendingActivity(1, shouldPrimeFirstTask);
      const nextActivities = activities.map((a) =>
        a.id === currentPending.id ? replacement : a
      );
      taskActivitiesByUser.set(idNum, nextActivities);
      pendingActivityByUser.set(idNum, replacement.id);
    }
    return { userId: idNum, slots: cleaned };
  },

  async getPrimeOrderSlots(userId) {
    const idNum = Number(userId);
    if (!Number.isFinite(idNum)) return [];
    return Array.from(primeOrderSlotsByUser.get(idNum) || []).sort((a, b) => a - b);
  },

  async getTaskActivities(userId) {
    const idNum = Number(userId);
    if (!Number.isFinite(idNum)) return [];
    return [...(taskActivitiesByUser.get(idNum) || [])];
  },

  async openTask(userId) {
    const idNum = Number(userId);
    if (!Number.isFinite(idNum)) return { error: "User not found", code: "NOT_FOUND" };
    const status = await this.getTaskAssignmentStatus(idNum);
    if (!status) return { error: "User not found", code: "NOT_FOUND" };
    if (!status.canPerformTasks) {
      return { error: "You have unfinished orders, please deal with them in time", code: "TASK_ASSIGNMENT_REQUIRED", status };
    }
    const activities = taskActivitiesByUser.get(idNum) || [];
    const existingPending = activities.find((a) => a.status === "pending");
    if (existingPending) {
      if (existingPending.isPrime) {
        return {
          code: "PRIME_ORDER_PENDING",
          error: "check your acitivty task you get prime order",
          status,
          activity: existingPending,
        };
      }
      return { status, activity: existingPending, task: existingPending.task };
    }
    const taskNo = Number(status.quotaUsed || 0) + 1;
    const isPrime = Boolean(primeOrderSlotsByUser.get(idNum)?.has(taskNo));
    const task = makeActivityTask(taskNo, isPrime);
    const createdAt = nowIso();
    const activity = {
      id: `act-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
      title: task.title,
      orderNumber: generateOrderNumber(new Date(createdAt)),
      quantityRs: task.quantityRs,
      commissionRs: task.commissionRs,
      createdAt,
      status: "pending",
      taskNo,
      isPrime,
      task,
    };
    taskActivitiesByUser.set(idNum, [activity, ...activities]);
    pendingActivityByUser.set(idNum, activity.id);
    if (isPrime) {
      return {
        code: "PRIME_ORDER_PENDING",
        error: "check your acitivty task you get prime order",
        status,
        activity,
      };
    }
    return { status, activity, task };
  },

  // Mark all current sessions for this user as invalid (force logout on next request).
  invalidateSessions(userId) {
    const idNum = Number(userId);
    if (!Number.isFinite(idNum)) return;
    invalidatedUserIds.add(idNum);
  },

  // Check if this user's sessions have been invalidated.
  isSessionInvalidated(userId) {
    const idNum = Number(userId);
    if (!Number.isFinite(idNum)) return false;
    return invalidatedUserIds.has(idNum);
  },
};
