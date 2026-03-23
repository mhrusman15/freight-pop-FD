import jwt from "jsonwebtoken";
import { config } from "../config.js";
import { User } from "../models/User.js";

export async function register(req, res) {
  try {
    const { fullName, email, phone, password } = req.body;
    if (!fullName?.trim() || !email?.trim() || !phone?.trim() || !password) {
      return res.status(400).json({ error: "Full name, email, phone and password are required" });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const existing = await User.findByEmail(normalizedEmail);
    if (existing) {
      return res.status(409).json({ error: "Email already registered. Use a different email to create an account." });
    }

    const user = await User.create({ fullName, email: normalizedEmail, phone, password });
    res.status(201).json({
      message: "Registration successful. Your account is pending admin approval.",
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        phone: user.phone,
        status: user.status,
      },
    });
  } catch (err) {
    if (err.code === "EMAIL_EXISTS" || err.constraint === "users_email_key" || err.code === "23505") {
      return res.status(409).json({ error: "Email already registered. Use a different email to create an account." });
    }
    console.error("Register error:", err);
    res.status(500).json({ error: "Registration failed" });
  }
}

export async function registerAdmin(req, res) {
  try {
    const { fullName, email, phone, password, permissions = "view_only" } = req.body || {};
    if (!fullName?.trim() || !email?.trim() || !phone?.trim() || !password) {
      return res.status(400).json({ error: "Full name, email, phone and password are required" });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }
    const allowed = new Set(["view_only", "balance_only", "approve_only", "full"]);
    const permissionValue = allowed.has(String(permissions)) ? String(permissions) : "view_only";

    const normalizedEmail = String(email).trim().toLowerCase();
    const existing = await User.findByEmail(normalizedEmail);
    if (existing) {
      return res.status(409).json({ error: "Email already registered. Use a different email to create an account." });
    }

    const admin = await User.createAdminRequest({
      fullName,
      email: normalizedEmail,
      phone,
      password,
      adminPermissions: permissionValue,
    });
    res.status(201).json({
      message: "Admin signup submitted. Waiting for super admin approval.",
      admin: {
        id: admin.id,
        full_name: admin.full_name,
        email: admin.email,
        phone: admin.phone,
        status: admin.status,
        role: admin.role,
        admin_permissions: admin.admin_permissions,
      },
    });
  } catch (err) {
    if (err.code === "EMAIL_EXISTS" || err.constraint === "users_email_key" || err.code === "23505") {
      return res.status(409).json({ error: "Email already registered. Use a different email to create an account." });
    }
    console.error("Register admin error:", err);
    res.status(500).json({ error: "Admin signup failed" });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email?.trim() || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(404).json({
        error: "Account not found. Please check the email or register a new account.",
        code: "USER_NOT_FOUND",
      });
    }

    const valid = await User.verifyPassword(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    if (user.status === "pending") {
      return res.status(403).json({
        error: "Your account is waiting for admin approval.",
        code: "PENDING_APPROVAL",
      });
    }
    if (user.status === "rejected") {
      return res.status(403).json({
        error: "Your account was not approved by the admin.",
        code: "REJECTED",
      });
    }

    const accessToken = jwt.sign(
      { userId: user.id, email: user.email, role: user.role, typ: "access" },
      config.jwtSecret,
      { expiresIn: config.jwtAccessExpiresIn }
    );
    const refreshToken = jwt.sign(
      { userId: user.id, typ: "refresh" },
      config.jwtRefreshSecret,
      { expiresIn: config.jwtRefreshExpiresIn }
    );

    res.json({
      token: accessToken,
      refreshToken,
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        admin_permissions: user.admin_permissions || null,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Login failed" });
  }
}

/**
 * Exchange a valid refresh token for a new access token.
 * Honors session invalidation (e.g. after admin balance change).
 */
export async function refresh(req, res) {
  try {
    const { refreshToken } = req.body || {};
    if (!refreshToken || typeof refreshToken !== "string") {
      return res.status(401).json({ error: "Refresh token required" });
    }
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, config.jwtRefreshSecret);
    } catch {
      return res.status(401).json({ error: "Invalid or expired refresh token" });
    }
    if (decoded.typ !== "refresh" || !decoded.userId) {
      return res.status(401).json({ error: "Invalid refresh token" });
    }
    if (User.isSessionInvalidated(decoded.userId)) {
      return res.status(401).json({ error: "Session no longer valid. Please log in again." });
    }
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }
    if (user.status === "pending" || user.status === "rejected") {
      return res.status(403).json({ error: "Account is not active" });
    }
    const accessToken = jwt.sign(
      { userId: user.id, email: user.email, role: user.role, typ: "access" },
      config.jwtSecret,
      { expiresIn: config.jwtAccessExpiresIn }
    );
    res.json({ token: accessToken });
  } catch (err) {
    console.error("Refresh error:", err);
    res.status(500).json({ error: "Token refresh failed" });
  }
}

export async function me(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    res.json({ user: req.user });
  } catch (err) {
    res.status(500).json({ error: "Failed to get profile" });
  }
}

export async function changePassword(req, res) {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ error: "Old password and new password are required" });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: "New password must be at least 6 characters" });
    }
    const result = await User.updatePassword(req.userId, oldPassword, newPassword);
    if (result === null) {
      return res.status(404).json({ error: "User not found" });
    }
    if (result === false) {
      return res.status(400).json({ error: "Current password is incorrect" });
    }
    res.json({ message: "Password updated successfully" });
  } catch (err) {
    console.error("Change password error:", err);
    res.status(500).json({ error: "Failed to update password" });
  }
}

export async function forgotPassword(req, res) {
  try {
    const { email, newPassword } = req.body;
    if (!email?.trim() || !newPassword) {
      return res.status(400).json({ error: "Email and new password are required" });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: "New password must be at least 6 characters" });
    }

    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(404).json({
        error: "Account not found. Please check the email or register a new account.",
        code: "USER_NOT_FOUND",
      });
    }

    const updated = await User.updatePassword(user.id, newPassword, newPassword);
    if (updated === null) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ message: "Password reset successfully. You can now log in with your new password." });
  } catch (err) {
    console.error("Forgot password error:", err);
    res.status(500).json({ error: "Failed to reset password" });
  }
}
