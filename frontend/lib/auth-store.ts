"use client";

export type AuthScope = "admin" | "user";

/** Admin session — never mix with user keys */
const ADMIN = {
  token: "admin_access_token",
  refresh: "admin_refresh_token",
  user: "admin_user",
  lastActive: "admin_last_active",
} as const;

/** User session — never mix with admin keys */
const USER = {
  token: "user_access_token",
  refresh: "user_refresh_token",
  user: "user_data",
  lastActive: "user_last_active",
} as const;

/** Previous keys (migrate once per browser) */
const LEGACY = {
  adminToken: "fp_admin_token",
  adminRefresh: "fp_admin_refresh_token",
  adminUser: "fp_admin_user",
  adminLast: "fp_admin_last_active",
  userToken: "fp_user_token",
  userRefresh: "fp_user_refresh_token",
  userUser: "fp_user_user",
  userLast: "fp_user_last_active",
  sharedToken: "fp_token",
  sharedRefresh: "fp_refresh_token",
  sharedUser: "fp_user",
  sharedLast: "fp_last_active",
} as const;

const MIGRATION_FLAG = "fp_auth_v3_migrated";

export interface AuthUser {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  role: string;
  admin_permissions?: string | null;
}

function keysFor(scope: AuthScope) {
  return scope === "admin" ? ADMIN : USER;
}

function isAdminRole(role?: string | null): boolean {
  return role === "admin" || role === "super_admin";
}

/** True when stored user profile is an admin-type account (should not use user portal). */
export function isElevatedUserProfile(user: AuthUser | null): boolean {
  return isAdminRole(user?.role);
}

/** Route → which session this surface uses (not derived from stored user). */
export function scopeFromPathname(pathname?: string | null): AuthScope {
  const path =
    pathname ?? (typeof window !== "undefined" ? window.location.pathname : "");
  return path.startsWith("/admin") ? "admin" : "user";
}

function migrateLegacyStorageOnce(): void {
  if (typeof window === "undefined") return;
  if (window.localStorage.getItem(MIGRATION_FLAG)) return;

  const move = (from: string, to: string) => {
    const v = window.localStorage.getItem(from);
    if (v != null && !window.localStorage.getItem(to)) {
      window.localStorage.setItem(to, v);
    }
  };

  move(LEGACY.adminToken, ADMIN.token);
  move(LEGACY.adminRefresh, ADMIN.refresh);
  move(LEGACY.adminUser, ADMIN.user);
  move(LEGACY.adminLast, ADMIN.lastActive);
  move(LEGACY.userToken, USER.token);
  move(LEGACY.userRefresh, USER.refresh);
  move(LEGACY.userUser, USER.user);
  move(LEGACY.userLast, USER.lastActive);

  // Shared legacy: split by last known user JSON role if possible
  const sharedUserRaw = window.localStorage.getItem(LEGACY.sharedUser);
  let role: string | null = null;
  try {
    if (sharedUserRaw) role = (JSON.parse(sharedUserRaw) as AuthUser)?.role ?? null;
  } catch {
    role = null;
  }
  const sharedTok = window.localStorage.getItem(LEGACY.sharedToken);
  if (sharedTok && !window.localStorage.getItem(ADMIN.token) && !window.localStorage.getItem(USER.token)) {
    const scope = isAdminRole(role) ? "admin" : "user";
    const k = keysFor(scope);
    window.localStorage.setItem(k.token, sharedTok);
    const shRef = window.localStorage.getItem(LEGACY.sharedRefresh);
    const shUser = window.localStorage.getItem(LEGACY.sharedUser);
    const shLast = window.localStorage.getItem(LEGACY.sharedLast);
    if (shRef) window.localStorage.setItem(k.refresh, shRef);
    if (shUser) window.localStorage.setItem(k.user, shUser);
    if (shLast) window.localStorage.setItem(k.lastActive, shLast);
  }

  window.localStorage.setItem(MIGRATION_FLAG, "1");
}

function readToken(scope: AuthScope): string | null {
  if (typeof window === "undefined") return null;
  migrateLegacyStorageOnce();
  return window.localStorage.getItem(keysFor(scope).token);
}

function readUser(scope: AuthScope): AuthUser | null {
  if (typeof window === "undefined") return null;
  migrateLegacyStorageOnce();
  try {
    const raw = window.localStorage.getItem(keysFor(scope).user);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

export function getAdminToken(): string | null {
  return readToken("admin");
}

export function getUserToken(): string | null {
  return readToken("user");
}

export function getAdminUser(): AuthUser | null {
  return readUser("admin");
}

export function getUserData(): AuthUser | null {
  return readUser("user");
}

/** Token for the current URL surface (admin vs user app). */
export function getToken(): string | null {
  return readToken(scopeFromPathname());
}

/** Profile for the current URL surface. */
export function getAuthUser(): AuthUser | null {
  return readUser(scopeFromPathname());
}

/**
 * Persist session for the given account only — does not touch the other role’s storage.
 * Scope is taken from `user.role`, not from the current path (login pages live under /login and /admin/login).
 */
export function setAuth(token: string, user: AuthUser, refreshToken?: string | null): void {
  if (typeof window === "undefined") return;
  const scope: AuthScope = isAdminRole(user.role) ? "admin" : "user";
  const k = keysFor(scope);
  window.localStorage.setItem(k.token, token);
  window.localStorage.setItem(k.user, JSON.stringify(user));
  window.localStorage.setItem(k.lastActive, String(Date.now()));
  if (refreshToken) {
    window.localStorage.setItem(k.refresh, refreshToken);
  }
}

export function clearAuth(scope: AuthScope): void {
  if (typeof window === "undefined") return;
  const k = keysFor(scope);
  window.localStorage.removeItem(k.token);
  window.localStorage.removeItem(k.refresh);
  window.localStorage.removeItem(k.user);
  window.localStorage.removeItem(k.lastActive);

  const cookieName = scope === "admin" ? "adminAuthToken" : "userAuthToken";
  document.cookie = `${cookieName}=; Max-Age=0; path=/; SameSite=Lax`;
}

/** After refresh — must target the same role as the refresh token. */
export function setAccessToken(token: string, scope: AuthScope): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(keysFor(scope).token, token);
}

export function getRefreshToken(scope: AuthScope): string | null {
  if (typeof window === "undefined") return null;
  migrateLegacyStorageOnce();
  return window.localStorage.getItem(keysFor(scope).refresh);
}

/** True if the admin slot has an admin or super_admin profile. */
export function isAdmin(): boolean {
  const user = getAdminUser();
  return user?.role === "admin" || user?.role === "super_admin";
}

export function isSuperAdmin(): boolean {
  return getAdminUser()?.role === "super_admin";
}

export function getAdminPermission(): string {
  const user = getAdminUser();
  if (!user || user.role !== "admin") return "full";
  return user.admin_permissions || "view_only";
}

export function canAdmin(action: "view" | "approve" | "balance"): boolean {
  const user = getAdminUser();
  if (!user) return false;
  if (user.role === "super_admin") return true;
  const perm = user.admin_permissions || "view_only";
  if (perm === "full") return true;
  if (action === "view") return true;
  if (action === "approve") return perm === "approve_only";
  if (action === "balance") return perm === "balance_only";
  return false;
}

export function isAuthenticated(): boolean {
  return !!getToken();
}

export function touchLastActive(scope?: AuthScope): void {
  if (typeof window === "undefined") return;
  const resolved = scope ?? scopeFromPathname();
  window.localStorage.setItem(keysFor(resolved).lastActive, String(Date.now()));
}

export function getLastActive(scope?: AuthScope): number | null {
  if (typeof window === "undefined") return null;
  const resolved = scope ?? scopeFromPathname();
  migrateLegacyStorageOnce();
  const raw = window.localStorage.getItem(keysFor(resolved).lastActive);
  if (!raw) return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}
