import { supabaseAuth } from "../lib/supabaseClient.js";
import { assertSupabaseAuthConfig } from "../config.js";
import { User } from "../models/User.js";

export async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: "Authentication required" });
  }

  try {
    assertSupabaseAuthConfig();
    const { data: authData, error: authErr } = await supabaseAuth.auth.getUser(token);
    if (authErr || !authData?.user) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    if (await User.isSessionBlocked(authData.user.id)) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    const profile = await User.findById(authData.user.id);
    if (!profile) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }
    if (profile.role === "user" && profile.status === "pending") {
      return res.status(403).json({
        error: "Your account is pending admin approval",
        code: "PENDING_APPROVAL",
      });
    }
    if (profile.role === "user" && profile.status === "rejected") {
      return res.status(403).json({
        error: "Your account was not approved by the admin.",
        code: "REJECTED",
      });
    }

    req.userId = authData.user.id;
    req.role = profile.role;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

export function adminOnly(req, res, next) {
  if (req.role !== "admin" && req.role !== "super_admin") {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
}

/** User app API — reject admin/super_admin tokens (separate admin session). */
export function userOnly(req, res, next) {
  if (req.role !== "user") {
    return res.status(403).json({ error: "User access required" });
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
    req.user = user
      ? {
          id: user.id,
          full_name: user.full_name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          status: user.status,
          admin_permissions: user.admin_permissions || null,
        }
      : null;
  } catch {
    req.user = null;
  }
  next();
}
