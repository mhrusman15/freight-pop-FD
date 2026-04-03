import { User } from "../models/User.js";

export async function getBalance(req, res) {
  try {
    const wallet = await User.getBalance(req.userId);
    if (wallet == null) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(wallet);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to get balance" });
  }
}

export async function deposit(req, res) {
  const amount = req.body?.amount;
  if (amount == null || Number(amount) <= 0) {
    return res.status(400).json({ error: "Invalid amount" });
  }
  try {
    const newBalance = await User.addToBalance(req.userId, amount, {
      recordDeposit: true,
      enableX5Profit: true,
    });
    if (newBalance == null) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json({ balance: newBalance, message: "Deposit successful" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || "Deposit failed" });
  }
}

export async function getTaskStatus(req, res) {
  try {
    const status = await User.getTaskAssignmentStatus(req.userId);
    if (!status) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(status);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to get task status" });
  }
}

export async function completeTask(req, res) {
  try {
    const status = await User.markTaskCompleted(req.userId, req.body?.activityId || null);
    if (!status) {
      return res.status(404).json({ error: "User not found", code: "NOT_FOUND" });
    }
    if (status.code === "PRIME_ORDER_PENDING" || status.code === "PRIME_BLOCKED") {
      return res.status(400).json({
        message: status.error || "Insufficient balance. Please recharge.",
        error: status.error || "Insufficient balance. Please recharge.",
        code: "PRIME_BLOCKED",
        status: status.status,
      });
    }
    if (status.code === "TASK_ASSIGNMENT_REQUIRED") {
      return res.status(403).json({
        error: "Check your activity track",
        code: "TASK_ASSIGNMENT_REQUIRED",
        status: status.status,
      });
    }
    if (status.code === "INSUFFICIENT_BALANCE") {
      return res.status(403).json({
        error: status.error || "Insufficient balance. Please recharge.",
        code: "INSUFFICIENT_BALANCE",
        status: status.status,
      });
    }
    if (status.code === "NOT_FOUND") {
      return res.status(404).json({ error: "User not found", code: "NOT_FOUND" });
    }
    res.json(status);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to complete task" });
  }
}

export async function openTask(req, res) {
  try {
    const result = await User.openTask(req.userId);
    if (!result) {
      return res.status(404).json({ error: "User not found", code: "NOT_FOUND" });
    }
    if (result.code === "PRIME_ORDER_PENDING" || result.code === "PRIME_BLOCKED") {
      return res.status(400).json({
        message: result.error || "Insufficient balance. Please recharge.",
        error: result.error || "Insufficient balance. Please recharge.",
        code: "PRIME_BLOCKED",
        status: result.status,
        activity: result.activity,
      });
    }
    if (result.code === "TASK_ASSIGNMENT_REQUIRED") {
      return res.status(403).json({
        ...result,
        error: "No tasks available. Check your activity track",
      });
    }
    if (result.code === "INSUFFICIENT_BALANCE") {
      return res.status(403).json({
        error: result.error || "Insufficient balance. Please recharge.",
        code: "INSUFFICIENT_BALANCE",
        status: result.status,
      });
    }
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to open task" });
  }
}

export async function getTaskActivities(req, res) {
  try {
    const entries = await User.getTaskActivities(req.userId);
    res.json({ entries });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch task activities" });
  }
}

export async function postActivityLog(req, res) {
  try {
    const message = req.body?.message;
    await User.appendActivityLog(req.userId, message);
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message || "Failed to add activity" });
  }
}
