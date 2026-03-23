 "use client";

type AuthScope = "admin" | "user";

const LEGACY_TOKEN_KEY = "fp_token";
const LEGACY_REFRESH_KEY = "fp_refresh_token";
const LEGACY_USER_KEY = "fp_user";
const LEGACY_LAST_ACTIVE_KEY = "fp_last_active";

const SCOPED_KEYS: Record<AuthScope, { token: string; refresh: string; user: string; lastActive: string }> = {
  admin: {
    token: "fp_admin_token",
    refresh: "fp_admin_refresh_token",
    user: "fp_admin_user",
    lastActive: "fp_admin_last_active",
  },
  user: {
    token: "fp_user_token",
    refresh: "fp_user_refresh_token",
    user: "fp_user_user",
    lastActive: "fp_user_last_active",
  },
};

export interface AuthUser {
  id: number;
  full_name: string;
  email: string;
  phone: string;
  role: string;
  admin_permissions?: string | null;
}

function isAdminRole(role?: string | null): boolean {
  return role === "admin" || role === "super_admin";
}

function getScopeByPathname(pathname?: string | null): AuthScope {
  const path =
    pathname ?? (typeof window !== "undefined" ? window.location.pathname : "");
  return path.startsWith("/admin") ? "admin" : "user";
}

function getScope(explicitRole?: string): AuthScope {
  if (isAdminRole(explicitRole)) return "admin";
  return getScopeByPathname();
}

function getStoredToken(scope?: AuthScope): string | null {
  if (typeof window === "undefined") return null;
  if (scope) {
    return (
      window.localStorage.getItem(SCOPED_KEYS[scope].token) ||
      window.localStorage.getItem(LEGACY_TOKEN_KEY)
    );
  }
  const resolved = getScope();
  return (
    window.localStorage.getItem(SCOPED_KEYS[resolved].token) ||
    window.localStorage.getItem(LEGACY_TOKEN_KEY)
  );
}

function getStoredUser(scope?: AuthScope): AuthUser | null {
  if (typeof window === "undefined") return null;
  try {
    const scopedKey = scope ? SCOPED_KEYS[scope].user : SCOPED_KEYS[getScope()].user;
    const raw = window.localStorage.getItem(scopedKey) || window.localStorage.getItem(LEGACY_USER_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

export function setAuth(token: string, user: AuthUser, refreshToken?: string | null): void {
  if (typeof window === "undefined") return;
  const scope = getScope(user.role);
  const keys = SCOPED_KEYS[scope];
  window.localStorage.setItem(keys.token, token);
  window.localStorage.setItem(keys.user, JSON.stringify(user));
  window.localStorage.setItem(keys.lastActive, String(Date.now()));

  // Keep legacy keys for backward compatibility with older reads.
  window.localStorage.setItem(LEGACY_TOKEN_KEY, token);
  window.localStorage.setItem(LEGACY_USER_KEY, JSON.stringify(user));
  window.localStorage.setItem(LEGACY_LAST_ACTIVE_KEY, String(Date.now()));

  if (refreshToken) {
    window.localStorage.setItem(keys.refresh, refreshToken);
    window.localStorage.setItem(LEGACY_REFRESH_KEY, refreshToken);
  }
}

export function clearAuth(scope?: AuthScope): void {
  if (typeof window === "undefined") return;
  const resolved = scope ?? getScope();
  const keys = SCOPED_KEYS[resolved];
  const existingScopedToken = window.localStorage.getItem(keys.token);

  window.localStorage.removeItem(keys.token);
  window.localStorage.removeItem(keys.refresh);
  window.localStorage.removeItem(keys.user);
  window.localStorage.removeItem(keys.lastActive);

  // Clear legacy keys only when they represent this same session.
  const legacyToken = window.localStorage.getItem(LEGACY_TOKEN_KEY);
  if (legacyToken && legacyToken === existingScopedToken) {
    window.localStorage.removeItem(LEGACY_TOKEN_KEY);
    window.localStorage.removeItem(LEGACY_REFRESH_KEY);
    window.localStorage.removeItem(LEGACY_USER_KEY);
    window.localStorage.removeItem(LEGACY_LAST_ACTIVE_KEY);
  }

  // Keep admin and user cookies independent so logging out one role does not drop the other.
  const cookieName = resolved === "admin" ? "adminAuthToken" : "userAuthToken";
  document.cookie = `${cookieName}=; Max-Age=0; path=/; SameSite=Lax`;
  document.cookie = `authToken=; Max-Age=0; path=/; SameSite=Lax`;
}

/** Update access token after silent refresh (keeps refresh + user). */
export function setAccessToken(token: string, scope?: AuthScope): void {
  if (typeof window === "undefined") return;
  const resolved = scope ?? getScope();
  window.localStorage.setItem(SCOPED_KEYS[resolved].token, token);
  window.localStorage.setItem(LEGACY_TOKEN_KEY, token);
}

export function getRefreshToken(scope?: AuthScope): string | null {
  if (typeof window === "undefined") return null;
  const resolved = scope ?? getScope();
  return (
    window.localStorage.getItem(SCOPED_KEYS[resolved].refresh) ||
    window.localStorage.getItem(LEGACY_REFRESH_KEY)
  );
}

export function getToken(): string | null {
  return getStoredToken();
}

export function getAuthUser(): AuthUser | null {
  return getStoredUser();
}

export function isAdmin(): boolean {
  const user = getStoredUser();
  return user?.role === "admin" || user?.role === "super_admin";
}

export function isSuperAdmin(): boolean {
  const user = getStoredUser();
  return user?.role === "super_admin";
}

export function getAdminPermission(): string {
  const user = getStoredUser("admin");
  if (!user || user.role !== "admin") return "full";
  return user.admin_permissions || "view_only";
}

export function canAdmin(action: "view" | "approve" | "balance"): boolean {
  const user = getStoredUser("admin");
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
  return !!getStoredToken();
}

export function touchLastActive(scope?: AuthScope): void {
  if (typeof window === "undefined") return;
  const resolved = scope ?? getScope();
  window.localStorage.setItem(SCOPED_KEYS[resolved].lastActive, String(Date.now()));
  window.localStorage.setItem(LEGACY_LAST_ACTIVE_KEY, String(Date.now()));
}

export function getLastActive(scope?: AuthScope): number | null {
  if (typeof window === "undefined") return null;
  const resolved = scope ?? getScope();
  const raw =
    window.localStorage.getItem(SCOPED_KEYS[resolved].lastActive) ||
    window.localStorage.getItem(LEGACY_LAST_ACTIVE_KEY);
  if (!raw) return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}
