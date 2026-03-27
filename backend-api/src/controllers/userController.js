import { User } from "../models/User.js";

export async function getBalance(req, res) {
  try {
    const balance = await User.getBalance(req.userId);
    if (balance == null) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json({ balance });
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
    const newBalance = await User.addToBalance(req.userId, amount, { recordDeposit: true });
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
    if (status.code === "TASK_ASSIGNMENT_REQUIRED") {
      return res.status(403).json({
        error: "Check your activity track",
        code: "TASK_ASSIGNMENT_REQUIRED",
        status: status.status,
      });
    }
    if (status.code === "NOT_FOUND") {
      return res.status(404).json({ error: "User not found", code: "NOT_FOUND" });
    }
    if (status.code === "PRIME_ORDER_PENDING") {
      return res.status(403).json({
        error: "check your acitivty task you get prime order",
        code: "PRIME_ORDER_PENDING",
      });
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
    if (result.code === "TASK_ASSIGNMENT_REQUIRED") {
      return res.status(403).json({
        ...result,
        error: "No tasks available. Check your activity track",
      });
    }
    if (result.code === "PRIME_ORDER_PENDING") {
      return res.status(409).json(result);
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
