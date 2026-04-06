import { supabaseAdmin, supabaseAuth } from "../lib/supabaseClient.js";
import {
  TASK_DAILY_LIMIT,
  TASK_IMAGE_POOL,
  buildEmailCandidates,
  buildImageCycles,
  generateOrderNumber,
  makeActivityTask,
  makeUserTaskFromState,
  nowIso,
  stablePrimeGrabProduct,
} from "../lib/taskGeneration.js";
import {
  getActivePrime,
  getFirstIncompletePrime,
  normalizePrimeOrders,
  normalizePrimeOrdersFromAssign,
  primeRechargeRequiredFromPrime,
  primeSlotsFromOrders,
} from "../lib/primeOrders.js";
import { financialSummaryForApi } from "../lib/userFinancialSummary.js";

function getCommissionTierFromRow(row) {
  const t = Number(row?.commission_tier ?? 0);
  if (!Number.isFinite(t) || t < 0) return 0;
  return Math.floor(t);
}

/** Stable key so prime grab product stays the same for a 30-task cycle. */
function primeGrabCycleKey(row) {
  const g = row?.task_assignment_granted_at;
  if (g) return `g:${String(g)}`;
  return `f:${String(row?.id ?? "")}`;
}

function isMissingUsersColumnError(err, columnName) {
  const msg = String(err?.message || "");
  return Boolean(err && err.code === "PGRST204" && msg.includes(`'${columnName}' column`) && msg.includes("'users'"));
}

/** Scales task commission using the last admin credit (linear, max +50%). */
function applyAdminDepositProfitBoost(commission, row) {
  const c = Number(commission);
  if (!Number.isFinite(c) || c <= 0) return c;
  const basis = Math.max(0, Number(row?.admin_deposit_profit_basis ?? 0) || 0);
  if (basis <= 0) return Number(c.toFixed(2));
  const factor = 1 + Math.min(basis / 400000, 0.5);
  return Number((c * factor).toFixed(2));
}

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
    credit_score: Number(row.credit_score ?? 100),
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

/**
 * User Report only: show protected_reserve until any negative exposure (balance, total capital, or campaign wallet),
 * then set initial_reserve_consumed and show 0 forever. Does not affect balances or task logic.
 */
async function syncProtectedReserveDisplay(userId, row, fin) {
  if (!row || Boolean(row.initial_reserve_consumed)) {
    return { initialReserveConsumed: true, displayProtectedReserve: 0 };
  }
  const bal = Number(row.balance ?? 0) || 0;
  const tc = Number(fin.total_capital ?? fin.totalCapital ?? 0) || 0;
  const cw = Number(fin.campaign_wallet ?? fin.campaignWallet ?? 0) || 0;
  if (!(bal < 0 || tc < 0 || cw > 0)) {
    const pr = Number(row.protected_reserve);
    const amount = Number.isFinite(pr) && pr > 0 ? pr : 20000;
    return { initialReserveConsumed: false, displayProtectedReserve: amount };
  }
  const { error } = await supabaseAdmin
    .from("users")
    .update({ initial_reserve_consumed: true })
    .eq("id", userId);
  if (error) throw error;
  return { initialReserveConsumed: true, displayProtectedReserve: 0 };
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

async function hasActivityLogMessage(userId, message) {
  const { count, error } = await supabaseAdmin
    .from("activity_logs")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("message", message);
  if (error) throw error;
  return (count || 0) > 0;
}

async function getReportProgressRow(userId) {
  const { data, error } = await supabaseAdmin
    .from("user_report_progress")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

async function upsertReportProgress(userId, patch) {
  const { error } = await supabaseAdmin
    .from("user_report_progress")
    .upsert({ user_id: userId, ...patch }, { onConflict: "user_id" });
  if (error) throw error;
}

/** Same rules as task status: open row task_no, else next task from first-time or assigned quota. */
function computeCurrentTaskNoFromRow(row, openRow) {
  const total = Number(row?.task_quota_total || TASK_DAILY_LIMIT);
  const used = Number(row?.task_quota_used || 0);
  const required = Boolean(row?.task_assignment_required);
  const firstCompleted = Number(row?.first_tasks_completed || 0);
  const hasReceivedFirstTasks = Boolean(row?.has_received_first_tasks);
  let currentTaskNo = 0;
  if (openRow) {
    currentTaskNo = Number(openRow.task_no) || 0;
  } else if (required && hasReceivedFirstTasks && firstCompleted < TASK_DAILY_LIMIT) {
    currentTaskNo = firstCompleted + 1;
  } else if (!required && used < total) {
    currentTaskNo = used + 1;
  }
  return currentTaskNo;
}

async function loadAppSetting(key, defaultValue = null) {
  try {
    const { data, error } = await supabaseAdmin
      .from("app_settings")
      .select("value")
      .eq("key", key)
      .maybeSingle();
    if (error || !data) return defaultValue;
    return data.value;
  } catch {
    return defaultValue;
  }
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
    const defaultReserve = await loadAppSetting("default_protected_reserve", 20000);
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
        protected_reserve: Number(defaultReserve) || 20000,
        initial_reserve_consumed: false,
        commission_tier: 0,
        credit_score: 100,
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
    if (!row) return null;
    const capital = Number(row.balance ?? 0) || 0;
    const primeOrders = normalizePrimeOrders(row.prime_orders);
    const hasAnyPrimeAssigned = primeOrders.length > 0;
    const { data: openTaskRows } = await supabaseAdmin
      .from("user_tasks")
      .select("task_no")
      .eq("user_id", userId)
      .eq("status", "open")
      .order("created_at", { ascending: false })
      .limit(1);
    const openRow = openTaskRows?.[0];
    const currentTaskNo = computeCurrentTaskNoFromRow(row, openRow);
    const firstIncomplete = getFirstIncompletePrime(row.prime_orders);
    const onPrimeTask =
      firstIncomplete &&
      currentTaskNo > 0 &&
      currentTaskNo === Number(firstIncomplete.task_no);
    const negativeAmountTotal =
      onPrimeTask && firstIncomplete
        ? Number(Math.abs(Number(firstIncomplete.negative_amount) || 0).toFixed(2))
        : 0;
    const reportProgress = await getReportProgressRow(userId);
    const cycleInstantProfit = Number(reportProgress?.cycle_instant_profit || 0);
    const fin = financialSummaryForApi(capital, row.prime_orders, cycleInstantProfit, currentTaskNo);
    const prDisplay = await syncProtectedReserveDisplay(userId, row, fin);
    const { data: txRows, error: txErr } = await supabaseAdmin
      .from("transactions")
      .select("amount")
      .eq("user_id", userId)
      .eq("type", "task_reward")
      .eq("status", "approved");
    if (txErr) throw txErr;
    const totalCommissions = Number(
      (txRows || []).reduce((sum, t) => sum + (Number(t.amount) || 0), 0).toFixed(2),
    );
    return {
      balance: capital,
      capital,
      negativeAmountTotal,
      totalCommissions,
      hasAnyPrimeAssigned,
      commissionTier: getCommissionTierFromRow(row),
      lastPositiveDepositAt: row.last_positive_deposit_at || null,
      ...fin,
      protectedReserve: prDisplay.displayProtectedReserve,
      protected_reserve: prDisplay.displayProtectedReserve,
      initialReserveConsumed: prDisplay.initialReserveConsumed,
    };
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

  async addToBalance(
    userId,
    amount,
    {
      recordDeposit = false,
      clearPrimeNegative = false,
      enableX5Profit = false,
      setAdminDepositBasis = false,
    } = {}
  ) {
    const num = Number(amount);
    if (!Number.isFinite(num) || num < 0) throw new Error("Invalid amount");
    const row = await loadUserRow(userId);
    if (!row) return null;
    const next = Number(row.balance ?? 0) + num;
    const updatePatch = { balance: next };
    if (clearPrimeNegative) {
      /* prime_orders unchanged — recharge does not reset prime slots */
    }
    if (setAdminDepositBasis && num > 0) {
      updatePatch.admin_deposit_profit_basis = num;
    }
    if (enableX5Profit && num > 0) {
      updatePatch.x5_profit_enabled = true;
    }
    const { data, error } = await supabaseAdmin
      .from("users")
      .update(updatePatch)
      .eq("id", userId)
      .select("balance")
      .maybeSingle();
    if (error) throw error;
    if (recordDeposit && data) {
      await insertTransaction(userId, "deposit", num, "approved");
    }
    return data ? Number(data.balance) : null;
  },

  /**
   * Admin panel: optional positive add (algebraic) plus optional "negative runtime" that sets
   * balance to -(abs(balance after add) + negativeRuntime), e.g. old 10000 + neg 15000 → -25000.
   */
  async adminRuntimeBalanceAdjust(
    userId,
    { positiveAdd = 0, negativeRuntime = 0 } = {},
    {
      clearPrimeNegative = true,
      enableX5Profit = true,
      setAdminDepositBasis = true,
    } = {}
  ) {
    const pos = Number(positiveAdd);
    const neg = Number(negativeRuntime);
    if (!Number.isFinite(pos) || pos < 0) throw new Error("Invalid positive add");
    if (!Number.isFinite(neg) || neg < 0) throw new Error("Invalid negative runtime");
    if (pos === 0 && neg === 0) throw new Error("No adjustment");

    const row = await loadUserRow(userId);
    if (!row) return null;

    const oldBalance = Number(row.balance ?? 0);
    let next = oldBalance + pos;
    if (neg > 0) {
      next = -(Math.abs(next) + neg);
    }

    const updatePatch = { balance: next };
    if (setAdminDepositBasis && pos > 0) {
      updatePatch.admin_deposit_profit_basis = pos;
    }
    if (enableX5Profit && pos > 0) {
      updatePatch.x5_profit_enabled = true;
    }
    if (pos > 0) {
      updatePatch.sign_in_reward_amount = pos;
      updatePatch.last_positive_deposit_at = new Date().toISOString();
    }

    const { data, error } = await supabaseAdmin
      .from("users")
      .update(updatePatch)
      .eq("id", userId)
      .select("balance")
      .maybeSingle();
    if (error) throw error;
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
    const defaultReserve = await loadAppSetting("default_protected_reserve", 20000);
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
            prime_orders: [],
            admin_deposit_profit_basis: 0,
            commission_multiplier: 1,
            commission_tier: 0,
            protected_reserve: Number(defaultReserve) || 20000,
            initial_reserve_consumed: false,
            image_cycle_state: buildImageCycles(),
            has_received_first_tasks: true,
            first_tasks_completed: 0,
          }
        : { is_approved: false, rejected: true };
    let updatePatch = patch;
    let data;
    let error;
    ({ data, error } = await supabaseAdmin
      .from("users")
      .update(updatePatch)
      .eq("id", id)
      .eq("is_approved", false)
      .eq("rejected", false)
      .select("id, full_name, email, phone, role, is_approved, rejected, created_at")
      .maybeSingle());
    if (error && isMissingUsersColumnError(error, "commission_multiplier")) {
      const { commission_multiplier, ...fallbackPatch } = updatePatch;
      updatePatch = fallbackPatch;
      ({ data, error } = await supabaseAdmin
        .from("users")
        .update(updatePatch)
        .eq("id", id)
        .eq("is_approved", false)
        .eq("rejected", false)
        .select("id, full_name, email, phone, role, is_approved, rejected, created_at")
        .maybeSingle());
    }
    if (error) throw error;
    if (!data) return null;
    // Cycle 1 auto-starts silently after approval (no activity-track notification).
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
      credit_score: Number(u.credit_score ?? 100),
      task_quota_total: u.task_quota_total ?? TASK_DAILY_LIMIT,
      task_quota_used: u.task_quota_used ?? 0,
      task_assignment_required: Boolean(u.task_assignment_required),
      task_assignment_requested_at: u.task_assignment_requested_at || null,
      task_assignment_granted_at: u.task_assignment_granted_at || null,
      prime_orders: normalizePrimeOrders(u.prime_orders),
      prime_order_slots: primeSlotsFromOrders(u.prime_orders),
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

  async getCreditScore(userId) {
    const row = await loadUserRow(userId);
    if (!row) return null;
    const creditScore = Math.round(Number(row.credit_score ?? 100));
    return {
      creditScore,
      deltaAmount: creditScore - 100,
    };
  },

  async updateCreditScore(userId, creditScore) {
    const score = Math.round(Number(creditScore));
    if (!Number.isFinite(score)) throw new Error("Invalid credit score");
    const { data, error } = await supabaseAdmin
      .from("users")
      .update({ credit_score: score })
      .eq("id", userId)
      .eq("role", "user")
      .select("credit_score")
      .maybeSingle();
    if (error) throw error;
    return data ? Number(data.credit_score) : null;
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
        credit_score: 100,
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
        credit_score: 100,
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
    const reportProgress = await getReportProgressRow(userId);

    const total = Number(row.task_quota_total || TASK_DAILY_LIMIT);
    const used = Number(row.task_quota_used || 0);
    const required = Boolean(row.task_assignment_required);
    const firstCompleted = Number(row.first_tasks_completed || 0);
    const hasReceivedFirstTasks = Boolean(row.has_received_first_tasks);
    const requestedAt = row.task_assignment_requested_at ? new Date(row.task_assignment_requested_at) : null;
    const grantedAt = row.task_assignment_granted_at ? new Date(row.task_assignment_granted_at) : null;
    const orders = normalizePrimeOrders(row.prime_orders);

    const firstRemaining = Math.max(0, TASK_DAILY_LIMIT - firstCompleted);
    const remaining = Math.max(0, total - used);
    // First-time cycle is only active while assignment is still required (cycle 1 auto-start path).
    const canUseFirstTasks = required && hasReceivedFirstTasks && firstCompleted < TASK_DAILY_LIMIT;
    const canUseAssignedTasks = !required && used < total;
    let canPerformTasks = canUseFirstTasks || canUseAssignedTasks;

    const rawBalance = Number(row.balance ?? 0) || 0;
    if (rawBalance < 0) {
      canPerformTasks = false;
    }

    const { data: openTaskRows } = await supabaseAdmin
      .from("user_tasks")
      .select("is_prime, task_no")
      .eq("user_id", userId)
      .eq("status", "open")
      .order("created_at", { ascending: false })
      .limit(1);
    const openRow = openTaskRows?.[0];

    const currentTaskNo = computeCurrentTaskNoFromRow(row, openRow);

    const activePrime = getActivePrime(orders, currentTaskNo);
    const primeNegativeAmount = primeRechargeRequiredFromPrime(activePrime);
    const primeShowNegative = primeNegativeAmount > 0;
    const primeGrabProduct =
      activePrime &&
      Number(activePrime.task_no) === Number(currentTaskNo) &&
      currentTaskNo > 0
        ? stablePrimeGrabProduct(userId, activePrime.task_no, primeGrabCycleKey(row))
        : null;
    /**
     * Do NOT set canPerformTasks false only because prime recharge is short — the Report UI must allow
     * "Enter" to show the prime modal; completion stays blocked in markTaskCompleted / openTask.
     */

    const signInRewardAmount = Math.max(
      0,
      Number(row.sign_in_reward_amount ?? 1000) || 1000,
    );

    const cycleInstantProfit = Number(reportProgress?.cycle_instant_profit || 0);
    const fin = financialSummaryForApi(rawBalance, row.prime_orders, cycleInstantProfit, currentTaskNo);
    const prDisplay = await syncProtectedReserveDisplay(userId, row, fin);

    return {
      userId,
      quotaTotal: total,
      quotaUsed: used,
      remaining,
      requiresAdminAssignment: required || used >= total,
      canPerformTasks,
      currentTaskNo,
      balance: Number(row.balance ?? 0),
      activePrime,
      primeOrders: orders,
      nextAutoAssignAt: null,
      taskAssignmentRequestedAt: requestedAt ? requestedAt.toISOString() : null,
      taskAssignmentGrantedAt: grantedAt ? grantedAt.toISOString() : null,
      primeNegativeAmount,
      primeShowNegative,
      primeGrabProduct,
      signInRewardAmount,
      hasReceivedFirstTasks,
      firstTasksCompleted: firstCompleted,
      firstTasksRemaining: firstRemaining,
      commissionTier: getCommissionTierFromRow(row),
      lastPositiveDepositAt: row.last_positive_deposit_at || null,
      ...fin,
      protectedReserve: prDisplay.displayProtectedReserve,
      protected_reserve: prDisplay.displayProtectedReserve,
      initialReserveConsumed: prDisplay.initialReserveConsumed,
      reportProgress: {
        lastTaskNo: Number(reportProgress?.last_task_no || 0),
        lastAmount: Number(reportProgress?.last_amount || 0),
        cycleInstantProfit,
        lastOrderNumber: reportProgress?.last_order_number || null,
        updatedAt: reportProgress?.updated_at || null,
      },
    };
  },

  async markTaskCompleted(userId, activityId = null) {
    let query = supabaseAdmin
      .from("user_tasks")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "open")
      .order("created_at", { ascending: false });
    if (activityId) query = query.eq("id", activityId);
    const { data: openRows, error: findErr } = await query.limit(1);
    if (findErr) throw findErr;
    const targetPending = openRows?.[0];
    if (!targetPending) {
      return { error: "No pending task found", code: "PENDING_TASK_NOT_FOUND" };
    }
    const row = await loadUserRow(userId);
    if (!row) return { error: "User not found", code: "NOT_FOUND" };
    if (Number(row.balance ?? 0) < 0) {
      const status = await this.getTaskAssignmentStatus(userId);
      return {
        error: "Insufficient balance. Please recharge.",
        code: "INSUFFICIENT_BALANCE",
        status,
      };
    }
    const status = await this.getTaskAssignmentStatus(userId);
    if (!status) return { error: "User not found", code: "NOT_FOUND" };

    let commission = Math.max(0, Number(targetPending.payload?.commissionRs) || 0);
    const wasFirstTimeTask = Boolean(targetPending.is_first_time);
    const taskNoDone = Number(targetPending.task_no) || 0;
    const primeOrders = normalizePrimeOrders(row.prime_orders);
    if (targetPending.is_prime) {
      const activePrime = getActivePrime(primeOrders, taskNoDone);
      const required = primeRechargeRequiredFromPrime(activePrime);
      const bal = Number(row.balance ?? 0);
      if (required > 0 && (!Number.isFinite(bal) || bal < required)) {
        return {
          error: "Insufficient balance. Please recharge.",
          code: "PRIME_BLOCKED",
          status,
        };
      }
    }

    if (!status.canPerformTasks) {
      return { error: "Task assignment required", code: "TASK_ASSIGNMENT_REQUIRED", status };
    }
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
      if (firstTasksCompleted + 1 >= TASK_DAILY_LIMIT) {
        userPatch.task_assignment_required = true;
        userPatch.task_assignment_requested_at = row.task_assignment_requested_at || new Date().toISOString();
      }
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

    if (targetPending.is_prime) {
      const nextPrime = primeOrders.map((p) =>
        p.task_no === taskNoDone ? { ...p, is_completed: true } : p,
      );
      userPatch.prime_orders = nextPrime;
    }

    const { error: upErr } = await supabaseAdmin.from("users").update(userPatch).eq("id", userId);
    if (upErr) throw upErr;

    const completedTaskNo = Number(targetPending.task_no || 0);
    const completedOrderNumber = String(targetPending.payload?.orderNumber || "");
    const previousReport = await getReportProgressRow(userId);
    const nextCycleProfit = Number(previousReport?.cycle_instant_profit || 0) + commission;
    await upsertReportProgress(userId, {
      last_task_no: completedTaskNo,
      last_amount: commission,
      cycle_instant_profit: nextCycleProfit,
      last_order_number: completedOrderNumber || null,
    });
    await insertActivityLog(
      userId,
      targetPending.is_prime
        ? "Prime order completed (5x commission)"
        : wasFirstTimeTask
          ? `Completed first-time task ${completedTaskNo}/${TASK_DAILY_LIMIT}`
          : `Completed admin assigned task ${completedTaskNo}`,
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

    let assignPatch = {
      has_received_first_tasks: true,
      task_quota_total: TASK_DAILY_LIMIT,
      task_quota_used: 0,
      task_assignment_required: false,
      task_assignment_requested_at: null,
      task_assignment_granted_at: new Date().toISOString(),
      prime_orders: [],
      admin_deposit_profit_basis: 0,
      commission_multiplier: 1,
      commission_tier: 0,
      image_cycle_state: buildImageCycles(),
    };
    let { error } = await supabaseAdmin
      .from("users")
      .update(assignPatch)
      .eq("id", userId)
      .eq("role", "user");
    if (error && isMissingUsersColumnError(error, "commission_multiplier")) {
      const { commission_multiplier, ...fallbackPatch } = assignPatch;
      assignPatch = fallbackPatch;
      ({ error } = await supabaseAdmin
        .from("users")
        .update(assignPatch)
        .eq("id", userId)
        .eq("role", "user"));
    }
    if (error) throw error;

    await insertActivityLog(userId, "New tasks assigned");
    await upsertReportProgress(userId, {
      last_task_no: 0,
      last_amount: 0,
      cycle_instant_profit: 0,
      last_order_number: null,
    });
    const firstTaskPending = await this._insertOpenTask(userId, 1, false, []);
    if (!firstTaskPending) return null;
    return this.getTaskAssignmentStatus(userId);
  },

  async _insertOpenTask(userId, taskNo, isPrime, primeSlots, isFirstTime = false) {
    const row = await loadUserRow(userId);
    if (!row) return null;
    const reportProgress = await getReportProgressRow(userId);
    const cycleInstantProfit = Number(reportProgress?.cycle_instant_profit || 0);
    let imageState = parseImageState(row.image_cycle_state) || buildImageCycles();
    const orders = normalizePrimeOrders(row.prime_orders);
    const slotSet = new Set(primeSlots?.length ? primeSlots : orders.map((p) => p.task_no));
    const activePrime = getActivePrime(orders, taskNo);
    const isPrimeTask = Boolean(activePrime && slotSet.has(taskNo));
    const capital = Math.max(0, Number(row.balance ?? 0) || 0);
    const tier = getCommissionTierFromRow(row);
    const fin = financialSummaryForApi(capital, row.prime_orders, cycleInstantProfit, taskNo);
    const totalCapitalTier = fin.total_capital;

    let task;
    let nextState = imageState;
    if (isPrimeTask) {
      const { image, title } = stablePrimeGrabProduct(userId, taskNo, primeGrabCycleKey(row));
      task = makeActivityTask(taskNo, true, image, capital, totalCapitalTier);
      task.title = title;
      task.image = image;
    } else {
      const out = makeUserTaskFromState(taskNo, false, imageState, capital, totalCapitalTier);
      task = out.task;
      nextState = out.imageState;
    }

    const priceRs = Number(task.quantityRs) || 0;
    task.quantityRs = Number(Math.min(priceRs, capital).toFixed(2));
    task.commissionRs = isPrimeTask
      ? Number((Number(task.commissionRs) || 0).toFixed(2))
      : Number(applyAdminDepositProfitBoost(Number(task.commissionRs) || 0, row).toFixed(2));
    task.isPrime = isPrimeTask;

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
      commissionTier: tier,
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

    const safeNegative = cleaned.length > 0 ? Math.abs(Number(primeNegativeAmount) || 0) : 0;
    const showNegative = cleaned.length > 0 && safeNegative > 0;

    const primeOrders = cleaned.map((task_no) => ({
      task_no,
      negative_amount: safeNegative > 0 ? -safeNegative : 0,
      is_completed: false,
    }));

    await supabaseAdmin
      .from("users")
      .update({
        prime_orders: primeOrders,
      })
      .eq("id", userId);

    if (showNegative) {
      await insertActivityLog(
        userId,
        "Your new task cycle has been assigned. You can continue your tasks.",
      );
    }

    const { data: openList } = await supabaseAdmin
      .from("user_tasks")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "open")
      .order("created_at", { ascending: false })
      .limit(1);
    const currentPending = openList?.[0];

    if (!currentPending) {
      return { userId, slots: cleaned, primeOrders };
    }
    const currentTaskNo = Number(currentPending.task_no) || 1;
    await supabaseAdmin.from("user_tasks").delete().eq("id", currentPending.id);
    await this._insertOpenTask(userId, currentTaskNo, false, cleaned);
    return { userId, slots: cleaned, primeOrders };
  },

  async adminAssignTasksWithPrime(userId, primeOrdersInput = []) {
    const row = await loadUserRow(userId);
    if (!row || row.role !== "user") return null;

    await supabaseAdmin.from("user_tasks").delete().eq("user_id", userId).eq("status", "open");

    const prime_orders = normalizePrimeOrdersFromAssign(primeOrdersInput);

    let assignPatch = {
      has_received_first_tasks: true,
      task_quota_total: TASK_DAILY_LIMIT,
      task_quota_used: 0,
      task_assignment_required: false,
      task_assignment_requested_at: null,
      task_assignment_granted_at: new Date().toISOString(),
      prime_orders,
      admin_deposit_profit_basis: 0,
      commission_multiplier: 1,
      commission_tier: 0,
      image_cycle_state: buildImageCycles(),
    };
    let { error } = await supabaseAdmin
      .from("users")
      .update(assignPatch)
      .eq("id", userId)
      .eq("role", "user");
    if (error && isMissingUsersColumnError(error, "commission_multiplier")) {
      const { commission_multiplier, ...fallbackPatch } = assignPatch;
      assignPatch = fallbackPatch;
      ({ error } = await supabaseAdmin
        .from("users")
        .update(assignPatch)
        .eq("id", userId)
        .eq("role", "user"));
    }
    if (error) throw error;

    await insertActivityLog(userId, "New tasks assigned");
    await upsertReportProgress(userId, {
      last_task_no: 0,
      last_amount: 0,
      cycle_instant_profit: 0,
      last_order_number: null,
    });
    const firstTaskPending = await this._insertOpenTask(userId, 1, false, primeSlotsFromOrders(prime_orders));
    if (!firstTaskPending) return null;
    return this.getTaskAssignmentStatus(userId);
  },

  async adminAssignSinglePrimeOrder(userId, primeOrdersInput) {
    const row = await loadUserRow(userId);
    if (!row || row.role !== "user") return null;

    const inputList = Array.isArray(primeOrdersInput)
      ? primeOrdersInput
      : [{ task_no: primeOrdersInput, negative_amount: arguments[2] }];

    const newOrders = inputList.map((o) => ({
      task_no: Math.max(1, Math.min(TASK_DAILY_LIMIT, Math.floor(Number(o.task_no) || 0))),
      negative_amount: -Math.abs(Number(o.negative_amount) || 0),
      is_completed: false,
    }));

    const needsCycleReset = Boolean(row.task_assignment_required) ||
      (Number(row.task_quota_used ?? 0) >= Number(row.task_quota_total ?? TASK_DAILY_LIMIT));

    let existingOrders = normalizePrimeOrders(row.prime_orders);
    for (const newOrder of newOrders) {
      const idx = existingOrders.findIndex((p) => p.task_no === newOrder.task_no);
      if (idx >= 0) {
        existingOrders[idx] = newOrder;
      } else {
        existingOrders.push(newOrder);
      }
    }
    const updatedOrders = existingOrders.sort((a, b) => a.task_no - b.task_no);

    if (needsCycleReset) {
      await supabaseAdmin.from("user_tasks").delete().eq("user_id", userId).eq("status", "open");

      const assignPatch = {
        has_received_first_tasks: true,
        task_quota_total: TASK_DAILY_LIMIT,
        task_quota_used: 0,
        task_assignment_required: false,
        task_assignment_requested_at: null,
        task_assignment_granted_at: new Date().toISOString(),
        prime_orders: updatedOrders,
        admin_deposit_profit_basis: 0,
        image_cycle_state: buildImageCycles(),
      };
      const { error } = await supabaseAdmin
        .from("users")
        .update(assignPatch)
        .eq("id", userId)
        .eq("role", "user");
      if (error) throw error;

      await upsertReportProgress(userId, {
        last_task_no: 0,
        last_amount: 0,
        cycle_instant_profit: 0,
        last_order_number: null,
      });
      await this._insertOpenTask(userId, 1, false, updatedOrders.map((p) => p.task_no));
    } else {
      const { error } = await supabaseAdmin
        .from("users")
        .update({ prime_orders: updatedOrders })
        .eq("id", userId);
      if (error) throw error;

      const { data: openList } = await supabaseAdmin
        .from("user_tasks")
        .select("*")
        .eq("user_id", userId)
        .eq("status", "open")
        .order("created_at", { ascending: false })
        .limit(1);
      const currentPending = openList?.[0];
      if (currentPending) {
        const currentTaskNoVal = Number(currentPending.task_no) || 1;
        await supabaseAdmin.from("user_tasks").delete().eq("id", currentPending.id);
        await this._insertOpenTask(userId, currentTaskNoVal, false, updatedOrders.map((p) => p.task_no));
      }
    }

    for (const order of newOrders) {
      await insertActivityLog(userId, `Admin has assigned a prime order at task #${order.task_no}.`);
    }
    await insertActivityLog(
      userId,
      "Your task cycle is ready. Open Activity Track, dispose the pending order, then use Enter Access to continue.",
    );
    return this.getTaskAssignmentStatus(userId);
  },

  async getPrimeOrderSlots(userId) {
    const row = await loadUserRow(userId);
    if (!row) return [];
    return primeSlotsFromOrders(row.prime_orders);
  },

  async getTaskActivities(userId) {
    const row = await loadUserRow(userId);
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
      let quantityRs = Number(p.quantityRs || 0);
      if (r.status === "open" && r.is_prime && row) {
        const ap = getActivePrime(normalizePrimeOrders(row.prime_orders), Number(r.task_no) || 0);
        const req = primeRechargeRequiredFromPrime(ap);
        if (req > 0) quantityRs = Number(req.toFixed(2));
      }
      return {
        id: r.id,
        title: p.title,
        orderNumber: p.orderNumber,
        quantityRs,
        commissionRs: p.commissionRs,
        createdAt: r.created_at,
        status: r.status === "open" ? "pending" : "completed",
        taskNo: r.task_no,
        isPrime: r.is_prime,
        isFirstTime: Boolean(r.is_first_time),
        message: p.message || null,
        activityType: "task",
        taskImage: p.task?.image || null,
        taskTitle: p.task?.title || null,
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

  async appendActivityLog(userId, message) {
    const m = String(message || "").trim();
    const allowed = new Set([
      "Prime order (5x) available but pending",
      "Balance insufficient. Please recharge to continue.",
    ]);
    if (!allowed.has(m)) throw new Error("Invalid activity message");
    await insertActivityLog(userId, m);
  },

  async openTask(userId) {
    const row = await loadUserRow(userId);
    if (!row) return { error: "User not found", code: "NOT_FOUND" };
    if (Number(row.balance ?? 0) < 0) {
      const status = await this.getTaskAssignmentStatus(userId);
      return {
        error: "Insufficient balance. Please recharge.",
        code: "INSUFFICIENT_BALANCE",
        status,
      };
    }
    const status = await this.getTaskAssignmentStatus(userId);
    if (!status) return { error: "User not found", code: "NOT_FOUND" };

    const { data: openList } = await supabaseAdmin
      .from("user_tasks")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "open")
      .order("created_at", { ascending: false })
      .limit(1);
    const existingPending = openList?.[0];
    if (existingPending) {
      const p = existingPending.payload || {};
      const activity = { ...p, id: existingPending.id, status: "pending" };
      if (existingPending.is_prime) {
        const tno = Number(existingPending.task_no) || 0;
        const required = primeRechargeRequiredFromPrime(status.activePrime?.task_no === tno ? status.activePrime : null);
        const bal = Number(row.balance ?? 0);
        if (required > 0 && (!Number.isFinite(bal) || bal < required)) {
          return {
            code: "PRIME_BLOCKED",
            error: "Insufficient balance. Please recharge.",
            status,
            activity,
            task: p.task,
          };
        }
        if (!status.canPerformTasks) {
          return {
            error: "No tasks available. Check your activity track",
            code: "TASK_ASSIGNMENT_REQUIRED",
            status,
          };
        }
        return { status, activity, task: p.task };
      }
      if (!status.canPerformTasks) {
        return {
          error: "No tasks available. Check your activity track",
          code: "TASK_ASSIGNMENT_REQUIRED",
          status,
        };
      }
      return { status, activity, task: p.task };
    }

    if (!status.canPerformTasks) {
      return {
        error: "No tasks available. Check your activity track",
        code: "TASK_ASSIGNMENT_REQUIRED",
        status,
      };
    }

    const firstCompleted = Number(row.first_tasks_completed || 0);
    const hasReceivedFirstTasks = Boolean(row.has_received_first_tasks);
    const po = normalizePrimeOrders(row.prime_orders);
    const primeSlots = po.map((p) => p.task_no);

    let taskNo = null;
    let isFirstTime = false;
    if (row.task_assignment_required && hasReceivedFirstTasks && firstCompleted < TASK_DAILY_LIMIT) {
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

    const activePrime = getActivePrime(po, taskNo);
    const willBePrime = Boolean(activePrime);

    if (willBePrime) {
      const primeReq = primeRechargeRequiredFromPrime(activePrime);
      const bal = Number(row.balance ?? 0);
      if (primeReq > 0 && (!Number.isFinite(bal) || bal < primeReq)) {
        const logMsg = `Prime order (5x) available but pending (task #${taskNo})`;
        const already = await hasActivityLogMessage(userId, logMsg);
        if (!already) await insertActivityLog(userId, logMsg);
        const st = await this.getTaskAssignmentStatus(userId);
        return {
          error: "Insufficient balance. Please recharge.",
          code: "PRIME_BLOCKED",
          status: st,
        };
      }
    }

    const built = await this._insertOpenTask(userId, taskNo, false, primeSlots, isFirstTime);
    if (!built) return { error: "User not found", code: "NOT_FOUND" };
    const { activity, task } = built;
    const nextStatus = await this.getTaskAssignmentStatus(userId);
    return { status: nextStatus || status, activity, task };
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
