import { supabaseAdmin, supabaseAuth } from "../lib/supabaseClient.js";
import { assertSupabaseAuthConfig } from "../config.js";
import { User } from "../models/User.js";

const REGISTRATION_INVITATION_CODE = "FPMZEJZH";

function buildLoginEmailCandidates(identifier) {
  const raw = String(identifier || "").trim().toLowerCase();
  if (!raw) return [];

  if (!raw.includes("@")) {
    const digits = raw.replace(/\D/g, "");
    if (!digits) return [];
    return [`${digits}@fpm.local`, `${digits}@example.com`];
  }

  const candidates = [raw];
  const [localPart, domain] = raw.split("@");
  if (domain === "example.com") {
    candidates.push(`${localPart}@fpm.local`);
  } else if (domain === "fpm.local") {
    candidates.push(`${localPart}@example.com`);
  }
  return Array.from(new Set(candidates));
}

export async function register(req, res) {
  try {
    const { phone, password, confirmPassword, invitationCode } = req.body || {};
    if (!phone?.trim() || !password || !confirmPassword || !invitationCode?.trim()) {
      return res.status(400).json({ error: "Phone number, password, confirm password and invitation code are required" });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ error: "Password and confirm password do not match" });
    }
    if (String(invitationCode).trim() !== REGISTRATION_INVITATION_CODE) {
      return res.status(400).json({ error: "Invalid invitation code." });
    }

    const normalizedPhone = String(phone).trim();
    const phoneKey = normalizedPhone.replace(/\D/g, "");
    if (!phoneKey) {
      return res.status(400).json({ error: "Invalid phone number" });
    }

    const normalizedEmail = `${phoneKey}@fpm.local`;
    const existing = await User.findByEmail(normalizedEmail);
    if (existing) {
      return res.status(409).json({ error: "Phone number already registered. Use a different phone number to create an account." });
    }

    const user = await User.create({
      fullName: normalizedPhone,
      email: normalizedEmail,
      phone: normalizedPhone,
      password,
    });
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
      return res.status(409).json({ error: "Phone number already registered. Use a different phone number to create an account." });
    }
    console.error("Register error:", err);
    res.status(500).json({ error: "Registration failed" });
  }
}

export async function registerAdmin(req, res) {
  try {
    const { fullName, email, phone, password, permissions = "view_only" } = req.body || {};

    // Graceful fallback: if frontend accidentally posts user-signup data
    // to admin endpoint, route it through normal user registration.
    const hasAdminIdentity = !!fullName?.trim() && !!email?.trim();
    const hasUserIdentity = !!phone?.trim() && !!password;
    const looksLikeUserSignupPayload =
      (!hasAdminIdentity && hasUserIdentity) ||
      // Some clients may accidentally include an email field while still sending the user-signup fields.
      // If the user-signup fields are present, always treat it as a normal registration request.
      !!req.body?.confirmPassword ||
      !!req.body?.invitationCode ||
      !!req.body?.inviteCode;
    if (looksLikeUserSignupPayload) {
      req.body = {
        ...req.body,
        // Keep register validation predictable even when frontend payload differs.
        confirmPassword: req.body?.confirmPassword ?? password,
        invitationCode: req.body?.invitationCode ?? req.body?.inviteCode ?? "",
      };
      return register(req, res);
    }

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
    assertSupabaseAuthConfig();
    const { email, password } = req.body;
    if (!email?.trim() || !password) {
      return res.status(400).json({ error: "Email/mobile and password are required" });
    }

    const emailCandidates = buildLoginEmailCandidates(email);
    let sessionData = null;
    let signErr = null;
    for (const candidateEmail of emailCandidates) {
      const { data, error } = await supabaseAuth.auth.signInWithPassword({
        email: candidateEmail,
        password,
      });
      if (data?.session) {
        sessionData = data;
        signErr = null;
        break;
      }
      signErr = error;
    }

    if (signErr || !sessionData?.session) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const profile = await User.findById(sessionData.user.id);
    if (!profile) {
      return res.status(404).json({
        error: "Account not found. Please check the email or register a new account.",
        code: "USER_NOT_FOUND",
      });
    }

    if (profile.status === "pending") {
      return res.status(403).json({
        error: "Your account is pending admin approval",
        code: "PENDING_APPROVAL",
      });
    }
    if (profile.status === "rejected") {
      return res.status(403).json({
        error: "Your account was not approved by the admin.",
        code: "REJECTED",
      });
    }

    await User.clearSessionInvalidation(sessionData.user.id);

    res.json({
      token: sessionData.session.access_token,
      refreshToken: sessionData.session.refresh_token,
      /** App role (from DB); use the correct client storage slot (admin vs user). Supabase JWT `role` claim is the auth role (e.g. authenticated), not this value. */
      sessionRole: profile.role,
      user: {
        id: profile.id,
        full_name: profile.full_name,
        email: profile.email,
        phone: profile.phone,
        role: profile.role,
        admin_permissions: profile.admin_permissions || null,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Login failed" });
  }
}

export async function refresh(req, res) {
  try {
    assertSupabaseAuthConfig();
    const { refreshToken } = req.body || {};
    if (!refreshToken || typeof refreshToken !== "string") {
      return res.status(401).json({ error: "Refresh token required" });
    }

    const { data, error } = await supabaseAuth.auth.refreshSession({ refresh_token: refreshToken });
    if (error || !data?.session) {
      return res.status(401).json({ error: "Invalid or expired refresh token" });
    }

    const profile = await User.findById(data.user.id);
    if (!profile) {
      return res.status(401).json({ error: "User not found" });
    }
    if (profile.status === "pending" || profile.status === "rejected") {
      return res.status(403).json({ error: "Account is not active" });
    }

    if (await User.isSessionBlocked(data.user.id)) {
      return res.status(401).json({ error: "Session no longer valid. Please log in again." });
    }

    res.json({
      token: data.session.access_token,
      refreshToken: data.session.refresh_token,
    });
  } catch (err) {
    console.error("Refresh error:", err);
    res.status(500).json({ error: "Token refresh failed" });
  }
}

export async function logout(req, res) {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    await User.invalidateSessions(req.userId);
    res.json({ message: "Logged out" });
  } catch (err) {
    console.error("Logout error:", err);
    res.status(500).json({ error: "Logout failed" });
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

    const { error } = await supabaseAdmin.auth.admin.updateUserById(user.id, { password: newPassword });
    if (error) {
      console.error("Forgot password update error:", error);
      return res.status(500).json({ error: "Failed to reset password" });
    }

    res.json({ message: "Password reset successfully. You can now log in with your new password." });
  } catch (err) {
    console.error("Forgot password error:", err);
    res.status(500).json({ error: "Failed to reset password" });
  }
}
