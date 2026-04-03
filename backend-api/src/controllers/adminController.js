import { User } from "../models/User.js";
import { isValidUuid } from "../utils/uuid.js";

export async function getStats(req, res) {
  try {
    const stats = await User.getStats();
    res.json(stats);
  } catch (err) {
    console.error("Get stats error:", err);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
}

export async function getUsers(req, res) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const status = (req.query.status || "approved").toLowerCase();
    if (!["approved", "rejected", "pending"].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }
    const result = await User.getUsersPaginated({ status, page, limit });
    res.json(result);
  } catch (err) {
    console.error("Get users error:", err);
    res.status(500).json({ error: "Failed to fetch users" });
  }
}

export async function updateUserBalance(req, res) {
  try {
    const id = req.params.id;
    if (!isValidUuid(id)) {
      return res.status(400).json({ error: "Invalid user id" });
    }
    const value = req.body?.positiveAdd ?? req.body?.value;
    const negativeRaw = req.body?.negativeRuntime ?? req.body?.negative_runtime;
    const num = Number(value);
    const negNum = negativeRaw === undefined || negativeRaw === "" ? 0 : Number(negativeRaw);
    if (!Number.isFinite(num) || num < 0) {
      return res.status(400).json({ error: "Invalid balance value" });
    }
    if (!Number.isFinite(negNum) || negNum < 0) {
      return res.status(400).json({ error: "Invalid negative runtime amount" });
    }
    if (num === 0 && negNum === 0) {
      return res.status(400).json({ error: "Enter an amount to add and/or a negative runtime amount" });
    }
    const newBalance = await User.adminRuntimeBalanceAdjust(
      id,
      { positiveAdd: num, negativeRuntime: negNum },
      {
        clearPrimeNegative: true,
        enableX5Profit: true,
        setAdminDepositBasis: true,
      }
    );
    if (newBalance == null) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json({ balance: newBalance, userId: id });
  } catch (err) {
    console.error("Update balance error:", err);
    res.status(500).json({ error: "Failed to update balance" });
  }
}

export async function getAdmins(req, res) {
  try {
    const admins = await User.getAdmins();
    res.json({ admins });
  } catch (err) {
    console.error("Get admins error:", err);
    res.status(500).json({ error: "Failed to fetch admins" });
  }
}

export async function createAdmin(req, res) {
  try {
    const { fullName, email, phone, password, role = "admin", permissions = "view_only" } = req.body || {};
    if (!fullName?.trim() || !email?.trim() || !phone?.trim() || !password) {
      return res.status(400).json({ error: "Full name, email, phone and password are required" });
    }
    const admin = await User.createAdmin({
      fullName,
      email,
      phone,
      password,
      role,
      adminPermissions: permissions,
    });
    res.status(201).json({ admin });
  } catch (err) {
    console.error("Create admin error:", err);
    if (err.code === "23505") {
      return res.status(409).json({ error: "Email already exists" });
    }
    res.status(500).json({ error: "Failed to create admin" });
  }
}

export async function updateAdmin(req, res) {
  try {
    const id = req.params.id;
    if (!isValidUuid(id)) {
      return res.status(400).json({ error: "Invalid admin id" });
    }
    const { role, permissions } = req.body || {};
    const updated = await User.updateAdminPermissions(id, { role, adminPermissions: permissions });
    if (!updated) {
      return res.status(404).json({ error: "Admin not found" });
    }
    res.json({ admin: updated });
  } catch (err) {
    console.error("Update admin error:", err);
    res.status(500).json({ error: "Failed to update admin" });
  }
}

export async function getPendingUsers(req, res) {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const result = await User.getPendingPaginated({ page, limit });
    res.json(result);
  } catch (err) {
    console.error("Get pending error:", err);
    res.status(500).json({ error: "Failed to fetch pending users" });
  }
}

export async function approveUser(req, res) {
  try {
    const id = req.params.id;
    if (!isValidUuid(id)) {
      return res.status(400).json({ error: "Invalid user id" });
    }
    const target = await User.findById(id);
    if (target?.role === "admin" && req.role !== "super_admin") {
      return res.status(403).json({ error: "Only super admin can approve admin requests" });
    }
    const user = await User.updateStatus(id, "approved");
    if (!user) {
      return res.status(404).json({ error: "Pending user not found" });
    }
    res.json({ message: "User approved", user });
  } catch (err) {
    console.error("Approve error:", err);
    res.status(500).json({ error: "Failed to approve user" });
  }
}

export async function rejectUser(req, res) {
  try {
    const id = req.params.id;
    if (!isValidUuid(id)) {
      return res.status(400).json({ error: "Invalid user id" });
    }
    const target = await User.findById(id);
    if (target?.role === "admin" && req.role !== "super_admin") {
      return res.status(403).json({ error: "Only super admin can reject admin requests" });
    }
    const user = await User.updateStatus(id, "rejected");
    if (!user) {
      return res.status(404).json({ error: "Pending user not found" });
    }
    res.json({ message: "User rejected", user });
  } catch (err) {
    console.error("Reject error:", err);
    res.status(500).json({ error: "Failed to reject user" });
  }
}

export async function assignUserTasks(req, res) {
  try {
    const id = req.params.id;
    if (!isValidUuid(id)) {
      return res.status(400).json({ error: "Invalid user id" });
    }
    const status = await User.adminAssignTasks(id);
    if (!status) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json({ message: "30 tasks assigned", status });
  } catch (err) {
    console.error("Assign tasks error:", err);
    res.status(500).json({ error: "Failed to assign tasks" });
  }
}

export async function assignPrimeOrders(req, res) {
  try {
    const id = req.params.id;
    if (!isValidUuid(id)) {
      return res.status(400).json({ error: "Invalid user id" });
    }
    const slots = Array.isArray(req.body?.slots) ? req.body.slots : [];
    const noNegative = Boolean(req.body?.noNegative);
    const rawNegative = req.body?.negativeAmount;
    const negativeAmount = noNegative ? 0 : Math.abs(Number(rawNegative ?? 0));
    if (!Number.isFinite(negativeAmount)) {
      return res.status(400).json({ error: "Invalid negative amount" });
    }
    const assigned = await User.adminAssignPrimeOrders(id, slots, negativeAmount);
    if (!assigned) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json({ message: "Prime order tasks assigned", ...assigned });
  } catch (err) {
    console.error("Assign prime orders error:", err);
    res.status(500).json({ error: "Failed to assign prime orders" });
  }
}

export async function assignTasksWithPrime(req, res) {
  try {
    const id = req.params.id;
    if (!isValidUuid(id)) {
      return res.status(400).json({ error: "Invalid user id" });
    }
    const primeOrders = Array.isArray(req.body?.primeOrders) ? req.body.primeOrders : [];
    const status = await User.adminAssignTasksWithPrime(id, primeOrders);
    if (!status) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json({ message: "30 tasks assigned with prime configuration", status });
  } catch (err) {
    console.error("Assign tasks with prime error:", err);
    res.status(500).json({ error: "Failed to assign tasks with prime" });
  }
}

export async function assignSinglePrimeOrder(req, res) {
  try {
    const id = req.params.id;
    if (!isValidUuid(id)) {
      return res.status(400).json({ error: "Invalid user id" });
    }
    let orders = [];
    if (Array.isArray(req.body?.prime_orders)) {
      orders = req.body.prime_orders;
    } else if (req.body?.task_no != null) {
      orders = [{ task_no: Number(req.body.task_no), negative_amount: Number(req.body.negative_amount) }];
    }
    if (orders.length === 0) {
      return res.status(400).json({ error: "At least one prime order is required" });
    }
    for (const o of orders) {
      const tn = Number(o.task_no);
      const na = Number(o.negative_amount);
      if (!Number.isInteger(tn) || tn < 1 || tn > 30) {
        return res.status(400).json({ error: `Task number must be between 1 and 30 (got ${tn})` });
      }
      if (!Number.isFinite(na) || na <= 0) {
        return res.status(400).json({ error: `Negative amount must be a positive number for task ${tn}` });
      }
    }
    const status = await User.adminAssignSinglePrimeOrder(id, orders);
    if (!status) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json({ message: `${orders.length} prime order(s) assigned`, status });
  } catch (err) {
    console.error("Assign prime order error:", err);
    res.status(500).json({ error: "Failed to assign prime order" });
  }
}

export async function deleteUser(req, res) {
  try {
    const id = req.params.id;
    if (!isValidUuid(id)) {
      return res.status(400).json({ error: "Invalid user id" });
    }
    if (id === req.userId) {
      return res.status(400).json({ error: "You cannot delete your own account" });
    }

    const deleted = await User.deleteUserByAdmin(id);
    if (!deleted) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ message: "User deleted", user: deleted });
  } catch (err) {
    console.error("Delete user error:", err);
    res.status(500).json({ error: "Failed to delete user" });
  }
}
