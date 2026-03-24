import { User } from "../models/User.js";

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
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid user id" });
    }
    const value = req.body?.value;
    const num = Number(value);
    if (!Number.isFinite(num) || num < 0) {
      return res.status(400).json({ error: "Invalid balance value" });
    }
    const newBalance = await User.setBalance(id, num);
    if (newBalance == null) {
      return res.status(404).json({ error: "User not found" });
    }
    // Keep user session active; balance sync is handled by user polling.
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
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
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
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
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
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
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
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid user id" });
    }
    const status = await User.adminAssignTasks(id);
    if (!status) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json({ message: "29 tasks assigned", status });
  } catch (err) {
    console.error("Assign tasks error:", err);
    res.status(500).json({ error: "Failed to assign tasks" });
  }
}

export async function assignPrimeOrders(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid user id" });
    }
    const slots = Array.isArray(req.body?.slots) ? req.body.slots : [];
    const assigned = await User.adminAssignPrimeOrders(id, slots);
    if (!assigned) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json({ message: "Prime order tasks assigned", ...assigned });
  } catch (err) {
    console.error("Assign prime orders error:", err);
    res.status(500).json({ error: "Failed to assign prime orders" });
  }
}
