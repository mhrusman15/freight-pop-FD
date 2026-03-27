import { supabaseAdmin, supabaseAuth } from "../lib/supabaseClient.js";
import {
  TASK_DAILY_LIMIT,
  TASK_IMAGE_POOL,
  buildEmailCandidates,
  buildImageCycles,
  generateOrderNumber,
  makeUserTaskFromState,
  nowIso,
} from "../lib/taskGeneration.js";

function accountStatusFromRow(row) {
  if (!row) return null;
  if (row.rejected) return "rejected";
  if (row.is_approved) return "approved";
  return "pending";
}

function mapProfile(row) {
  if (!row) return null;
  return {
    id: row.id,
    full_name: row.full_name,
    email: row.email,
    phone: row.phone,
    status: accountStatusFromRow(row),
    role: row.role,
    admin_permissions: row.admin_permissions || null,
    asset_balance: row.balance != null ? Number(row.balance) : 0,
    created_at: row.created_at,
  };
}

function parseImageState(raw) {
  if (!raw) return null;
  if (typeof raw === "object" && raw.sequence && Array.isArray(raw.sequence)) {
    return { index: raw.index ?? 0, sequence: raw.sequence };
  }
  return null;
}

async function loadUserRow(userId) {
  const { data, error } = await supabaseAdmin.from("users").select("*").eq("id", userId).maybeSingle();
  if (error) throw error;
  return data;
}

async function insertTransaction(userId, type, amount, status = "approved") {
  const { error } = await supabaseAdmin.from("transactions").insert({
    user_id: userId,
    type,
    amount,
    status,
  });
  if (error) throw error;
}

async function insertActivityLog(userId, message) {
  const { error } = await supabaseAdmin.from("activity_logs").insert({
    user_id: userId,
    message,
  });
  if (error) throw error;
}

async function hasBonusLog(userId) {
  const { count, error } = await supabaseAdmin
    .from("activity_logs")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("message", "You received 30 tasks (first-time bonus)");
  if (error) throw error;
  return (count || 0) > 0;
}

export const User = {
  async create({ fullName, email, phone, password }) {
    const normalizedEmail = email.trim().toLowerCase();
    const { data: authData, error: authErr } = await supabaseAdmin.auth.admin.createUser({
      email: normalizedEmail,
      password,
      email_confirm: true,
    });
    if (authErr) {
      const err = new Error(authErr.message);
      err.code = authErr.code;
      throw err;
    }
    const id = authData.user.id;
    const { data: row, error: insErr } = await supabaseAdmin
      .from("users")
      .insert({
        id,
        email: normalizedEmail,
        full_name: fullName.trim(),
        phone: phone.trim(),
        role: "user",
        is_approved: false,
        has_received_first_tasks: false,
        first_tasks_completed: 0,
        rejected: false,
        balance: 0,
        task_quota_total: TASK_DAILY_LIMIT,
        task_quota_used: 0,
        task_assignment_required: true,
        task_assignment_granted_at: null,
      })
      .select("id, full_name, email, phone, is_approved, rejected, created_at")
      .single();
    if (insErr) {
      await supabaseAdmin.auth.admin.deleteUser(id);
      const err = new Error(insErr.message);
      err.code = insErr.code;
      if (insErr.code === "23505") err.code = "23505";
      throw err;
    }
    return {
      id: row.id,
      full_name: row.full_name,
      email: row.email,
      phone: row.phone,
      status: accountStatusFromRow(row),
    };
  },

  async findByEmail(email) {
    const candidates = buildEmailCandidates(email);
    if (!candidates.length) return null;
    const { data, error } = await supabaseAdmin
      .from("users")
      .select("*")
      .in("email", candidates)
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return mapProfile(data);
  },

  async findById(id) {
    const { data, error } = await supabaseAdmin.from("users").select("*").eq("id", id).maybeSingle();
    if (error) throw error;
    return mapProfile(data);
  },

  async getBalance(userId) {
    const row = await loadUserRow(userId);
    return row ? Number(row.balance ?? 0) : null;
  },

  async setBalance(userId, value) {
    const num = Number(value);
    if (!Number.isFinite(num) || num < 0) throw new Error("Invalid amount");
    const { data, error } = await supabaseAdmin
      .from("users")
      .update({ balance: num })
      .eq("id", userId)
      .select("balance")
      .maybeSingle();
    if (error) throw error;
    return data ? Number(data.balance) : null;
  },

  async addToBalance(userId, amount, { recordDeposit = false } = {}) {
    const num = Number(amount);
    if (!Number.isFinite(num) || num < 0) throw new Error("Invalid amount");
    const row = await loadUserRow(userId);
    if (!row) return null;
    const next = Number(row.balance ?? 0) + num;
    const { data, error } = await supabaseAdmin
      .from("users")
      .update({ balance: next })
      .eq("id", userId)
      .select("balance")
      .maybeSingle();
    if (error) throw error;
    if (recordDeposit && data) {
      await insertTransaction(userId, "deposit", num, "approved");
    }
    return data ? Number(data.balance) : null;
  },

  async subtractFromBalance(userId, amount) {
    const num = Number(amount);
    if (!Number.isFinite(num) || num < 0) throw new Error("Invalid amount");
    const row = await loadUserRow(userId);
    if (!row) return null;
    const next = Math.max(0, Number(row.balance ?? 0) - num);
    const { data, error } = await supabaseAdmin
      .from("users")
      .update({ balance: next })
      .eq("id", userId)
      .select("balance")
      .maybeSingle();
    if (error) throw error;
    return data ? Number(data.balance) : null;
  },

  async getPendingPaginated({ page = 1, limit = 10 }) {
    const offset = (page - 1) * limit;
    const { count, error: countErr } = await supabaseAdmin
      .from("users")
      .select("*", { count: "exact", head: true })
      .eq("is_approved", false)
      .eq("rejected", false);
    if (countErr) throw countErr;
    const total = count ?? 0;
    const { data: rows, error } = await supabaseAdmin
      .from("users")
      .select("id, full_name, email, phone, is_approved, rejected, created_at, updated_at")
      .eq("is_approved", false)
      .eq("rejected", false)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);
    if (error) throw error;
    const usersOut = (rows || []).map((u) => ({
      id: u.id,
      full_name: u.full_name,
      email: u.email,
      phone: u.phone,
      status: accountStatusFromRow(u),
      created_at: u.created_at,
      updated_at: u.updated_at || u.created_at,
    }));
    return {
      users: usersOut,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  },

  async updateStatus(id, status) {
    if (!["approved", "rejected"].includes(status)) throw new Error("Invalid status");
    const patch =
      status === "approved"
        ? {
            is_approved: true,
            rejected: false,
            task_quota_total: TASK_DAILY_LIMIT,
            task_quota_used: 0,
            task_assignment_required: true,
            task_assignment_requested_at: new Date().toISOString(),
            task_assignment_granted_at: null,
            prime_order_slots: [],
            prime_negative_amount: 0,
            image_cycle_state: buildImageCycles(),
            has_received_first_tasks: true,
            first_tasks_completed: 0,
          }
        : { is_approved: false, rejected: true };
    const { data, error } = await supabaseAdmin
      .from("users")
      .update(patch)
      .eq("id", id)
      .eq("is_approved", false)
      .eq("rejected", false)
      .select("id, full_name, email, phone, role, is_approved, rejected, created_at")
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    if (status === "approved" && data.role === "user") {
      const bonusAlreadyLogged = await hasBonusLog(id);
      if (!bonusAlreadyLogged) {
        await insertActivityLog(id, "You received 30 tasks (first-time bonus)");
      }
    }
    return {
      id: data.id,
      full_name: data.full_name,
      email: data.email,
      phone: data.phone,
      status: accountStatusFromRow(data),
      created_at: data.created_at,
    };
  },

  async getUsersPaginated({ status = "approved", page = 1, limit = 10 }) {
    const offset = (page - 1) * limit;
    let q = supabaseAdmin.from("users").select("*", { count: "exact" }).eq("role", "user");
    if (status === "approved") {
      q = q.eq("is_approved", true).eq("rejected", false);
    } else if (status === "pending") {
      q = q.eq("is_approved", false).eq("rejected", false);
    } else if (status === "rejected") {
      q = q.eq("rejected", true);
    }
    const { data: rows, error, count: fullCount } = await q
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);
    if (error) throw error;

    const total = fullCount ?? 0;
    const usersOut = (rows || []).map((u) => ({
      id: u.id,
      full_name: u.full_name,
      email: u.email,
      phone: u.phone,
      status: accountStatusFromRow(u),
      asset_balance: Number(u.balance ?? 0),
      task_quota_total: u.task_quota_total ?? TASK_DAILY_LIMIT,
      task_quota_used: u.task_quota_used ?? 0,
      task_assignment_required: Boolean(u.task_assignment_required),
      task_assignment_requested_at: u.task_assignment_requested_at || null,
      task_assignment_granted_at: u.task_assignment_granted_at || null,
      created_at: u.created_at,
      updated_at: u.updated_at || u.created_at,
    }));
    return {
      users: usersOut,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  },

  async deleteUserByAdmin(userId) {
    const row = await loadUserRow(userId);
    if (!row || row.role !== "user") return null;

    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (authError) throw authError;

    return {
      id: row.id,
      full_name: row.full_name,
      email: row.email,
    };
  },

  async updatePassword(userId, oldPasswordPlain, newPasswordPlain) {
    const row = await loadUserRow(userId);
    if (!row) return null;
    const { data: signInData, error: signErr } = await supabaseAuth.auth.signInWithPassword({
      email: row.email,
      password: oldPasswordPlain,
    });
    if (signErr || !signInData?.user) return false;
    const { error: upErr } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      password: newPasswordPlain,
    });
    if (upErr) throw upErr;
    return true;
  },

  async getStats() {
    const { count: totalUsers } = await supabaseAdmin
      .from("users")
      .select("*", { count: "exact", head: true })
      .eq("role", "user");
    const { count: pendingApproval } = await supabaseAdmin
      .from("users")
      .select("*", { count: "exact", head: true })
      .eq("role", "user")
      .eq("is_approved", false)
      .eq("rejected", false);
    const { count: activeUsers } = await supabaseAdmin
      .from("users")
      .select("*", { count: "exact", head: true })
      .eq("role", "user")
      .eq("is_approved", true)
      .eq("rejected", false);
    const { count: totalAdmins } = await supabaseAdmin
      .from("users")
      .select("*", { count: "exact", head: true })
      .in("role", ["admin", "super_admin"]);
    return {
      totalUsers: totalUsers ?? 0,
      activeUsers: activeUsers ?? 0,
      pendingApproval: pendingApproval ?? 0,
      totalAdmins: totalAdmins ?? 0,
    };
  },

  async getAdmins() {
    const { data: rows, error } = await supabaseAdmin
      .from("users")
      .select("id, full_name, email, phone, role, admin_permissions, is_approved, rejected, created_at, updated_at")
      .in("role", ["admin", "super_admin"])
      .order("role", { ascending: false })
      .order("created_at", { ascending: true });
    if (error) throw error;
    return (rows || []).map((u) => ({
      id: u.id,
      full_name: u.full_name,
      email: u.email,
      phone: u.phone,
      role: u.role,
      admin_permissions: u.admin_permissions || "full",
      status: accountStatusFromRow(u),
      created_at: u.created_at,
      updated_at: u.updated_at || u.created_at,
    }));
  },

  async createAdmin({ fullName, email, phone, password, role = "admin", adminPermissions = "view_only" }) {
    if (!["admin", "super_admin"].includes(role)) {
      throw new Error("Invalid admin role");
    }
    const normalizedEmail = email.trim().toLowerCase();
    const { data: authData, error: authErr } = await supabaseAdmin.auth.admin.createUser({
      email: normalizedEmail,
      password,
      email_confirm: true,
    });
    if (authErr) throw authErr;
    const id = authData.user.id;
    const { data: row, error: insErr } = await supabaseAdmin
      .from("users")
      .insert({
        id,
        email: normalizedEmail,
        full_name: fullName.trim(),
        phone: phone.trim(),
        role,
        admin_permissions: adminPermissions,
        is_approved: true,
        rejected: false,
        balance: 0,
        task_assignment_granted_at: nowIso(),
      })
      .select("*")
      .single();
    if (insErr) {
      await supabaseAdmin.auth.admin.deleteUser(id);
      throw insErr;
    }
    return {
      id: row.id,
      full_name: row.full_name,
      email: row.email,
      phone: row.phone,
      role: row.role,
      admin_permissions: row.admin_permissions,
      status: accountStatusFromRow(row),
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  },

  async createAdminRequest({ fullName, email, phone, password, adminPermissions = "view_only" }) {
    const allowed = new Set(["view_only", "balance_only", "approve_only", "full"]);
    const permissionValue = allowed.has(adminPermissions) ? adminPermissions : "view_only";
    const normalizedEmail = email.trim().toLowerCase();
    const { data: authData, error: authErr } = await supabaseAdmin.auth.admin.createUser({
      email: normalizedEmail,
      password,
      email_confirm: true,
    });
    if (authErr) throw authErr;
    const id = authData.user.id;
    const { data: row, error: insErr } = await supabaseAdmin
      .from("users")
      .insert({
        id,
        email: normalizedEmail,
        full_name: fullName.trim(),
        phone: phone.trim(),
        role: "admin",
        admin_permissions: permissionValue,
        is_approved: false,
        rejected: false,
        balance: 0,
        task_assignment_granted_at: nowIso(),
      })
      .select("*")
      .single();
    if (insErr) {
      await supabaseAdmin.auth.admin.deleteUser(id);
      throw insErr;
    }
    return {
      id: row.id,
      full_name: row.full_name,
      email: row.email,
      phone: row.phone,
      role: row.role,
      admin_permissions: row.admin_permissions,
      status: accountStatusFromRow(row),
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  },

  async updateAdminPermissions(id, { role, adminPermissions }) {
    const updates = {};
    if (role) {
      if (!["admin", "super_admin"].includes(role)) throw new Error("Invalid admin role");
      updates.role = role;
    }
    if (adminPermissions) updates.admin_permissions = adminPermissions;
    if (!Object.keys(updates).length) return null;
    const { data, error } = await supabaseAdmin
      .from("users")
      .update(updates)
      .eq("id", id)
      .in("role", ["admin", "super_admin"])
      .select("id, full_name, email, phone, role, admin_permissions, is_approved, rejected, created_at, updated_at")
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return {
      id: data.id,
      full_name: data.full_name,
      email: data.email,
      phone: data.phone,
      role: data.role,
      admin_permissions: data.admin_permissions,
      status: accountStatusFromRow(data),
      created_at: data.created_at,
      updated_at: data.updated_at,
    };
  },

  async getTaskAssignmentStatus(userId) {
    const row = await loadUserRow(userId);
    if (!row) return null;

    const total = Number(row.task_quota_total || TASK_DAILY_LIMIT);
    const used = Number(row.task_quota_used || 0);
    const required = Boolean(row.task_assignment_required);
    const firstCompleted = Number(row.first_tasks_completed || 0);
    const hasReceivedFirstTasks = Boolean(row.has_received_first_tasks);
    const requestedAt = row.task_assignment_requested_at ? new Date(row.task_assignment_requested_at) : null;
    const grantedAt = row.task_assignment_granted_at ? new Date(row.task_assignment_granted_at) : null;
    const primeNegativeAmount = Math.max(0, Number(row.prime_negative_amount ?? 0) || 0);

    const firstRemaining = Math.max(0, TASK_DAILY_LIMIT - firstCompleted);
    const remaining = Math.max(0, total - used);
    const canUseFirstTasks = hasReceivedFirstTasks && firstCompleted < TASK_DAILY_LIMIT;
    const canUseAssignedTasks = !required && used < total;
    const canPerformTasks = canUseFirstTasks || canUseAssignedTasks;
    return {
      userId,
      quotaTotal: total,
      quotaUsed: used,
      remaining,
      requiresAdminAssignment: required || used >= total,
      canPerformTasks,
      nextAutoAssignAt: null,
      taskAssignmentRequestedAt: requestedAt ? requestedAt.toISOString() : null,
      taskAssignmentGrantedAt: grantedAt ? grantedAt.toISOString() : null,
      primeNegativeAmount,
      hasReceivedFirstTasks,
      firstTasksCompleted: firstCompleted,
      firstTasksRemaining: firstRemaining,
    };
  },

  async markTaskCompleted(userId, activityId = null) {
    let query = supabaseAdmin.from("user_tasks").select("*").eq("user_id", userId).eq("status", "open");
    if (activityId) query = query.eq("id", activityId);
    const { data: openRows, error: findErr } = await query.limit(1);
    if (findErr) throw findErr;
    const targetPending = openRows?.[0];
    if (!targetPending) {
      return { error: "No pending task found", code: "PENDING_TASK_NOT_FOUND" };
    }
    if (targetPending.is_prime) {
      return { error: "check your acitivty task you get prime order", code: "PRIME_ORDER_PENDING" };
    }

    const status = await this.getTaskAssignmentStatus(userId);
    if (!status) return { error: "User not found", code: "NOT_FOUND" };
    if (!status.canPerformTasks) {
      return { error: "Task assignment required", code: "TASK_ASSIGNMENT_REQUIRED", status };
    }

    const commission = Math.max(0, Number(targetPending.payload?.commissionRs) || 0);
    const wasFirstTimeTask = Boolean(targetPending.is_first_time);

    const row = await loadUserRow(userId);
    if (!row) return { error: "User not found", code: "NOT_FOUND" };
    const total = Number(row.task_quota_total || TASK_DAILY_LIMIT);
    const used = Number(row.task_quota_used || 0);
    const firstTasksCompleted = Number(row.first_tasks_completed || 0);
    const newBalance = Number(row.balance ?? 0) + commission;

    const userPatch = {
      balance: newBalance,
      task_quota_total: total,
    };
    if (wasFirstTimeTask) {
      userPatch.first_tasks_completed = firstTasksCompleted + 1;
    } else {
      userPatch.task_quota_used = used + 1;
      if (used + 1 >= total) {
        userPatch.task_assignment_required = true;
        userPatch.task_assignment_requested_at = row.task_assignment_requested_at || new Date().toISOString();
      }
    }

    const { error: upUtErr } = await supabaseAdmin
      .from("user_tasks")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
      })
      .eq("id", targetPending.id)
      .eq("status", "open");
    if (upUtErr) throw upUtErr;

    const { error: upErr } = await supabaseAdmin.from("users").update(userPatch).eq("id", userId);
    if (upErr) throw upErr;

    const completedTaskNo = Number(targetPending.task_no || 0);
    await insertActivityLog(
      userId,
      wasFirstTimeTask
        ? `Completed first-time task ${completedTaskNo}/${TASK_DAILY_LIMIT}`
        : `Completed admin assigned task ${completedTaskNo}`
    );

    if (wasFirstTimeTask && firstTasksCompleted + 1 >= TASK_DAILY_LIMIT) {
      await insertActivityLog(userId, "First-time bonus tasks completed. No tasks available. Check your activity track");
    }

    if (commission > 0) {
      await insertTransaction(userId, "task_reward", commission, "approved");
    }

    const nextStatus = await this.getTaskAssignmentStatus(userId);
    const activity = {
      ...targetPending.payload,
      id: targetPending.id,
      status: "completed",
      completedAt: nowIso(),
    };
    return { ...(nextStatus || {}), activity };
  },

  async adminAssignTasks(userId) {
    const row = await loadUserRow(userId);
    if (!row || row.role !== "user") return null;

    await supabaseAdmin.from("user_tasks").delete().eq("user_id", userId).eq("status", "open");

    const { error } = await supabaseAdmin
      .from("users")
      .update({
        has_received_first_tasks: true,
        task_quota_total: TASK_DAILY_LIMIT,
        task_quota_used: 0,
        task_assignment_required: false,
        task_assignment_requested_at: null,
        task_assignment_granted_at: new Date().toISOString(),
        prime_order_slots: [],
        prime_negative_amount: 0,
        image_cycle_state: buildImageCycles(),
      })
      .eq("id", userId)
      .eq("role", "user");
    if (error) throw error;

    await insertActivityLog(userId, "Admin assigned 30 tasks");
    const firstTaskPending = await this._insertOpenTask(userId, 1, false, []);
    if (!firstTaskPending) return null;
    return this.getTaskAssignmentStatus(userId);
  },

  async _insertOpenTask(userId, taskNo, isPrime, primeSlots, isFirstTime = false) {
    const row = await loadUserRow(userId);
    if (!row) return null;
    let imageState = parseImageState(row.image_cycle_state) || buildImageCycles();
    const slotSet = new Set(primeSlots || row.prime_order_slots || []);
    const isPrimeTask = Boolean(slotSet.has(taskNo));
    const { task, imageState: nextState } = makeUserTaskFromState(taskNo, isPrimeTask, imageState);
    await supabaseAdmin.from("users").update({ image_cycle_state: nextState }).eq("id", userId);

    const createdAt = nowIso();
    const activity = {
      id: null,
      title: task.title,
      orderNumber: generateOrderNumber(new Date(createdAt)),
      quantityRs: task.quantityRs,
      commissionRs: task.commissionRs,
      createdAt,
      status: "pending",
      taskNo,
      isPrime: isPrimeTask,
      task,
    };

    const { data: inserted, error } = await supabaseAdmin
      .from("user_tasks")
      .insert({
        user_id: userId,
        task_id: null,
        status: "open",
        task_no: taskNo,
        is_prime: isPrimeTask,
        is_first_time: Boolean(isFirstTime),
        payload: activity,
      })
      .select("id")
      .single();
    if (error) throw error;
    activity.id = inserted.id;
    return { activity, task };
  },

  async adminAssignPrimeOrders(userId, slots = [], primeNegativeAmount = 0) {
    const user = await loadUserRow(userId);
    if (!user || user.role !== "user") return null;
    const cleaned = Array.from(
      new Set(
        (Array.isArray(slots) ? slots : [])
          .map((n) => Number(n))
          .filter((n) => Number.isInteger(n) && n >= 1 && n <= TASK_DAILY_LIMIT)
      )
    ).sort((a, b) => a - b);

    const safeNegative = cleaned.length ? Math.max(0, Number(primeNegativeAmount) || 0) : 0;
    await supabaseAdmin
      .from("users")
      .update({ prime_order_slots: cleaned, prime_negative_amount: safeNegative })
      .eq("id", userId);

    const { data: openList } = await supabaseAdmin
      .from("user_tasks")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "open")
      .limit(1);
    const currentPending = openList?.[0];

    if (!currentPending) {
      const status = await this.getTaskAssignmentStatus(userId);
      if (!status || !status.canPerformTasks) {
        return { userId, slots: cleaned };
      }
      const nextTaskNo = Math.min(TASK_DAILY_LIMIT, Math.max(1, Number(status.quotaUsed || 0) + 1));
      await supabaseAdmin.from("user_tasks").delete().eq("user_id", userId).eq("status", "open");
      await this._insertOpenTask(userId, nextTaskNo, false, cleaned);
    } else {
      const currentTaskNo = Number(currentPending.task_no) || 1;
      await supabaseAdmin.from("user_tasks").delete().eq("id", currentPending.id);
      await this._insertOpenTask(userId, currentTaskNo, false, cleaned);
    }
    return { userId, slots: cleaned };
  },

  async getPrimeOrderSlots(userId) {
    const row = await loadUserRow(userId);
    if (!row) return [];
    return Array.isArray(row.prime_order_slots) ? row.prime_order_slots.sort((a, b) => a - b) : [];
  },

  async getTaskActivities(userId) {
    const [{ data: rows, error }, { data: logs, error: logErr }] = await Promise.all([
      supabaseAdmin
        .from("user_tasks")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false }),
      supabaseAdmin.from("activity_logs").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
    ]);
    if (error) throw error;
    if (logErr) throw logErr;
    const taskEntries = (rows || []).map((r) => {
      const p = r.payload || {};
      return {
        id: r.id,
        title: p.title,
        orderNumber: p.orderNumber,
        quantityRs: p.quantityRs,
        commissionRs: p.commissionRs,
        createdAt: r.created_at,
        status: r.status === "open" ? "pending" : "completed",
        taskNo: r.task_no,
        isPrime: r.is_prime,
        isFirstTime: Boolean(r.is_first_time),
        message: p.message || null,
        activityType: "task",
      };
    });
    const logEntries = (logs || []).map((entry) => ({
      id: entry.id,
      title: "Activity",
      orderNumber: null,
      quantityRs: null,
      commissionRs: null,
      createdAt: entry.created_at,
      status: "completed",
      taskNo: null,
      isPrime: false,
      isFirstTime: false,
      message: entry.message,
      activityType: "log",
    }));
    return [...taskEntries, ...logEntries].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  async openTask(userId) {
    const row = await loadUserRow(userId);
    if (!row) return { error: "User not found", code: "NOT_FOUND" };
    const status = await this.getTaskAssignmentStatus(userId);
    if (!status) return { error: "User not found", code: "NOT_FOUND" };

    const { data: openList } = await supabaseAdmin
      .from("user_tasks")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "open")
      .limit(1);
    const existingPending = openList?.[0];
    if (existingPending) {
      const p = existingPending.payload || {};
      const activity = { ...p, id: existingPending.id, status: "pending" };
      if (existingPending.is_prime) {
        return {
          code: "PRIME_ORDER_PENDING",
          error: "check your acitivty task you get prime order",
          status,
          activity,
        };
      }
      return { status, activity, task: p.task };
    }

    const firstCompleted = Number(row.first_tasks_completed || 0);
    const hasReceivedFirstTasks = Boolean(row.has_received_first_tasks);
    const primeSlots = row?.prime_order_slots || [];

    let taskNo = null;
    let isFirstTime = false;
    if (hasReceivedFirstTasks && firstCompleted < TASK_DAILY_LIMIT) {
      taskNo = firstCompleted + 1;
      isFirstTime = true;
    } else if (!row.task_assignment_required && Number(row.task_quota_used || 0) < Number(row.task_quota_total || TASK_DAILY_LIMIT)) {
      taskNo = Number(row.task_quota_used || 0) + 1;
    } else {
      return {
        error: "No tasks available. Check your activity track",
        code: "TASK_ASSIGNMENT_REQUIRED",
        status,
      };
    }

    const built = await this._insertOpenTask(userId, taskNo, false, primeSlots, isFirstTime);
    if (!built) return { error: "User not found", code: "NOT_FOUND" };
    const { activity, task } = built;
    if (activity.isPrime) {
      return {
        code: "PRIME_ORDER_PENDING",
        error: "check your acitivty task you get prime order",
        status,
        activity,
      };
    }
    return { status, activity, task };
  },

  invalidateSessions(userId) {
    return supabaseAdmin
      .from("users")
      .update({ sessions_invalidated_at: new Date().toISOString() })
      .eq("id", userId);
  },

  /** True after logout until the next successful login clears the flag. */
  async isSessionBlocked(userId) {
    const row = await loadUserRow(userId);
    return row?.sessions_invalidated_at != null;
  },

  async clearSessionInvalidation(userId) {
    const { error } = await supabaseAdmin.from("users").update({ sessions_invalidated_at: null }).eq("id", userId);
    if (error) throw error;
  },
};
