import jwt from "jsonwebtoken";
import { config } from "../config.js";
import { User } from "../models/User.js";

export function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: "Authentication required" });
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    req.userId = decoded.userId;
    req.role = decoded.role;

    // If admin has invalidated this user's sessions (e.g. after balance change),
    // treat token as expired so the client logs out on next request.
    if (User.isSessionInvalidated(req.userId)) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

export function adminOnly(req, res, next) {
  // Allow both "admin" and "super_admin" roles to access admin-only routes.
  // The frontend treats both as admins via `isAdmin`, so the backend should align.
  if (req.role !== "admin" && req.role !== "super_admin") {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
}

export function superAdminOnly(req, res, next) {
  if (req.role !== "super_admin") {
    return res.status(403).json({ error: "Super admin access required" });
  }
  next();
}

const ADMIN_PERMISSIONS = new Set(["view_only", "balance_only", "approve_only", "full"]);

export function requireAdminPermission(required) {
  return async function permissionGuard(req, res, next) {
    try {
      if (req.role === "super_admin") return next();
      if (req.role !== "admin") {
        return res.status(403).json({ error: "Admin access required" });
      }
      if (!ADMIN_PERMISSIONS.has(required)) {
        return res.status(500).json({ error: "Invalid permission guard" });
      }
      const user = await User.findById(req.userId);
      const perm = user?.admin_permissions || "view_only";
      if (perm === "full" || perm === required) return next();
      return res.status(403).json({ error: "Insufficient admin permissions" });
    } catch {
      return res.status(500).json({ error: "Permission check failed" });
    }
  };
}

export async function attachUser(req, res, next) {
  if (!req.userId) return next();
  try {
    const user = await User.findById(req.userId);
    req.user = user ? { id: user.id, full_name: user.full_name, email: user.email, phone: user.phone, role: user.role, admin_permissions: user.admin_permissions || null } : null;
  } catch {
    req.user = null;
  }
  next();
}
