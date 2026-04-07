import {
  clearAuth,
  getAdminToken,
  getRefreshToken,
  getUserToken,
  scopeFromPathname,
  setAccessToken,
  type AuthScope,
} from "./auth-store";
import { ASSET_BALANCE_STORAGE_KEY } from "./asset-balance-store";

/** Which session to use for Authorization — API path first, then current browser route. */
export function authScopeForRequest(apiPath: string): AuthScope {
  const p = apiPath.split("?")[0];
  if (p.startsWith("/api/admin")) return "admin";
  if (p.startsWith("/api/user")) return "user";
  if (typeof window !== "undefined") {
    const authPaths = ["/api/auth/me", "/api/auth/logout", "/api/auth/change-password"];
    if (authPaths.some((x) => p === x || p.startsWith(x + "/"))) {
      return scopeFromPathname();
    }
  }
  return typeof window !== "undefined" ? scopeFromPathname() : "user";
}

function tokenForScope(scope: AuthScope): string | null {
  return scope === "admin" ? getAdminToken() : getUserToken();
}

function isBrowserLocalHost(hostname: string): boolean {
  const h = hostname.toLowerCase();
  return h === "localhost" || h === "127.0.0.1" || h === "[::1]";
}

/** True if URL targets loopback — must not be used from a deployed site's browser. */
function isLoopbackApiUrl(urlStr: string): boolean {
  try {
    const u = new URL(urlStr);
    return isBrowserLocalHost(u.hostname);
  } catch {
    return false;
  }
}

/**
 * On an https site, `fetch` to `http://api...` is blocked (mixed content) and throws — same error as offline.
 * Upgrade non-localhost http → https when the page is served over https.
 */
function normalizeHttpsForProdPage(base: string, pageIsLocal: boolean): string {
  if (!base || pageIsLocal) return base;
  if (typeof window === "undefined") return base;
  if (window.location.protocol !== "https:") return base;
  try {
    const u = new URL(base);
    if (u.protocol === "http:" && !isBrowserLocalHost(u.hostname)) {
      u.protocol = "https:";
      return u.href.replace(/\/$/, "");
    }
  } catch {
    return base;
  }
  return base;
}

/** Two Vercel projects (frontend + backend-api): API is another host, not `/_/backend` on the web app. */
function vercelSplitApiMode(): boolean {
  return process.env.NEXT_PUBLIC_VERCEL_API_MODE?.trim().toLowerCase() === "split";
}

/**
 * API origin for fetches. Resolved at call time (not module load) so the browser
 * always sees `window`, and production never inherits SSR/build localhost.
 */
function getApiBase(): string {
  const envBase = process.env.NEXT_PUBLIC_API_URL?.trim();
  const split = vercelSplitApiMode();

  if (typeof window !== "undefined") {
    const origin = window.location.origin;
    const pageIsLocal = isBrowserLocalHost(window.location.hostname);

    if (split) {
      if (pageIsLocal) {
        if (envBase && !isLoopbackApiUrl(envBase)) {
          return normalizeHttpsForProdPage(envBase.replace(/\/$/, ""), pageIsLocal);
        }
        return normalizeHttpsForProdPage(
          (envBase && envBase.replace(/\/$/, "")) || "http://localhost:4000",
          pageIsLocal
        );
      }
      if (envBase && isLoopbackApiUrl(envBase)) return "";
      if (envBase) {
        const cleaned = envBase.replace(/\/$/, "");
        try {
          const u = new URL(cleaned);
          if (u.protocol === "http:" || u.protocol === "https:") {
            return normalizeHttpsForProdPage(cleaned, pageIsLocal);
          }
        } catch {
          /* ignore */
        }
      }
      return "";
    }

    // Monorepo (one Vercel project + Services): same-origin `/_/backend`.
    // Common mistake: Vercel env copies .env.example with http://localhost:4000 — breaks login in production.
    if (!pageIsLocal && envBase && isLoopbackApiUrl(envBase)) {
      return normalizeHttpsForProdPage(`${origin}/_/backend`, pageIsLocal);
    }

    if (envBase) {
      const cleaned = envBase.replace(/\/$/, "");

      if (!pageIsLocal) {
        if (cleaned === "" || cleaned === "/") {
          return normalizeHttpsForProdPage(`${origin}/_/backend`, pageIsLocal);
        }
        if (cleaned.startsWith("/")) {
          return normalizeHttpsForProdPage(
            cleaned.startsWith("/_/backend") ? cleaned : `${origin}/_/backend`,
            pageIsLocal
          );
        }
        try {
          const parsed = new URL(cleaned);
          const sameOrigin = parsed.origin === origin;
          const hasBackendPrefix =
            parsed.pathname === "/_/backend" || parsed.pathname.startsWith("/_/backend/");
          if (sameOrigin && !hasBackendPrefix) {
            return normalizeHttpsForProdPage(`${origin}/_/backend`, pageIsLocal);
          }
        } catch {
          // Fall back to cleaned below.
        }
      }

      return normalizeHttpsForProdPage(cleaned, pageIsLocal);
    }

    if (!pageIsLocal) return normalizeHttpsForProdPage(`${origin}/_/backend`, pageIsLocal);
    return normalizeHttpsForProdPage("http://localhost:4000", pageIsLocal);
  }

  // SSR / Node: no window — avoid localhost if a public site URL is configured
  if (split) {
    if (envBase) {
      const cleaned = envBase.replace(/\/$/, "");
      if (cleaned && !isLoopbackApiUrl(cleaned)) return cleaned;
    }
    return "";
  }
  if (envBase) {
    const cleaned = envBase.replace(/\/$/, "");
    if (cleaned && !isLoopbackApiUrl(cleaned)) return cleaned;
  }
  return "http://localhost:4000";
}

/** Avoid refresh loop on auth endpoints. */
function shouldAttemptRefresh(path: string): boolean {
  const base = path.split("?")[0];
  return ![
    "/api/auth/login",
    "/api/auth/register",
    "/api/auth/refresh",
    "/api/auth/forgot-password",
  ].some((p) => base === p || base.endsWith(p));
}

const refreshInFlightByScope: Partial<Record<AuthScope, Promise<boolean>>> = {};

async function refreshAccessToken(scope: AuthScope): Promise<boolean> {
  if (typeof window === "undefined") return false;
  const existing = refreshInFlightByScope[scope];
  if (existing) return existing;
  const rt = getRefreshToken(scope);
  if (!rt) return false;

  const job = (async () => {
    try {
      const base = getApiBase();
      if (!base) return false;
      const res = await fetch(`${base}/api/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: rt }),
      });
      const data = (await res.json().catch(() => ({}))) as { token?: string };
      if (!res.ok || !data.token) return false;
      setAccessToken(data.token, scope);
      return true;
    } catch {
      return false;
    } finally {
      delete refreshInFlightByScope[scope];
    }
  })();

  refreshInFlightByScope[scope] = job;
  return job;
}

export async function api<T>(
  path: string,
  options: RequestInit & { token?: string | null; suppressAuthRedirect?: boolean } = {}
): Promise<{ data?: T; error?: string; status: number }> {
  const requestScope = authScopeForRequest(path);
  const { token = tokenForScope(requestScope), suppressAuthRedirect = false, ...fetchOptions } = options;
  const method = String(fetchOptions.method || "GET").toUpperCase();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((fetchOptions.headers as Record<string, string>) || {}),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  // Prevent stale admin/user balances due to intermediary/browser caching.
  const effectiveFetchOptions: RequestInit = {
    ...fetchOptions,
    cache: fetchOptions.cache ?? (method === "GET" ? "no-store" : undefined),
  };

  const apiBase = getApiBase();
  if (!apiBase) {
    return {
      error:
        "API base URL is not configured. If the API is a separate Vercel project, set NEXT_PUBLIC_VERCEL_API_MODE=split and NEXT_PUBLIC_API_URL to your API origin (e.g. https://your-api.vercel.app). See frontend/.env.example.",
      status: 0,
    };
  }

  let res: Response;
  let retriedAfterRefresh = false;
  try {
    res = await fetch(`${apiBase}${path}`, { ...effectiveFetchOptions, headers });
    if (
      res.status === 401 &&
      !retriedAfterRefresh &&
      shouldAttemptRefresh(path) &&
      (await refreshAccessToken(requestScope))
    ) {
      retriedAfterRefresh = true;
      const newTok = tokenForScope(requestScope);
      if (newTok) headers["Authorization"] = `Bearer ${newTok}`;
      res = await fetch(`${apiBase}${path}`, { ...effectiveFetchOptions, headers });
    }
  } catch {
    // Network-level failure (no HTTP response): offline, CORS, mixed content (http API on https page), DNS, etc.
    return {
      error:
        "Unable to reach the server. Please check your internet connection or try again in a moment. " +
        "If you are on the live site, confirm Vercel → Settings → Environment Variables: NEXT_PUBLIC_API_URL must be the full HTTPS URL of your API (e.g. https://your-api.vercel.app).",
      status: 0,
    };
  }
  let data: unknown;
  const ct = res.headers.get("content-type");
  if (ct?.includes("application/json")) {
    try {
      data = await res.json();
    } catch {
      data = null;
    }
    // If server claims JSON but sends invalid/empty body, treat as error.
    if (data == null) {
      return {
        error:
          "Server returned an invalid/empty JSON response. " +
          'This usually means the backend route is not being reached (check your API /health URL on Vercel) ' +
          "or the function crashed before responding.",
        status: res.status,
      };
    }
  } else {
    // When the API base is misconfigured (or Vercel routePrefix isn't active),
    // fetch can return a 200 HTML page from Next.js instead of JSON from the backend.
    // Treat any non-JSON response as an error to avoid confusing "invalid response" UI states.
    let text = "";
    try {
      text = await res.text();
    } catch {
      text = "";
    }
    data = null;
    const snippet = text.replace(/\s+/g, " ").trim().slice(0, 180);
    return {
      error:
        `Unexpected non-JSON response from server. ` +
        `Check NEXT_PUBLIC_API_URL (monorepo: same origin /_/backend; two projects: set NEXT_PUBLIC_VERCEL_API_MODE=split and full API URL).` +
        (snippet ? ` Response: ${snippet}` : ""),
      status: res.status,
    };
  }
  if (!res.ok) {
    const err = (data as { error?: string })?.error || res.statusText;

    // If the server reports the token is invalid/expired (e.g. after admin forces logout),
    // clear client auth and send user back to login.
    if (res.status === 401 && typeof window !== "undefined" && !suppressAuthRedirect) {
      try {
        const scope = authScopeForRequest(path);
        clearAuth(scope);
        if (scope === "user") {
          window.sessionStorage.removeItem(ASSET_BALANCE_STORAGE_KEY);
        }
        const isAdminPath = window.location.pathname.startsWith("/admin");
        const loginPath = isAdminPath ? "/admin/login" : "/login";
        if (!window.location.pathname.startsWith("/login") && !window.location.pathname.startsWith("/admin/login")) {
          const redirect = encodeURIComponent(window.location.pathname + window.location.search);
          window.location.href = `${loginPath}?session=expired&redirect=${redirect}`;
        }
      } catch {
        // ignore storage errors
      }
    }

    return { error: err, status: res.status, data: data as T };
  }
  return { data: data as T, status: res.status };
}

/** Error response shape from API */
export interface AuthErrorBody {
  error?: string;
  code?: "PENDING_APPROVAL" | "REJECTED";
}

export const authApi = {
  register(body: { phone: string; password: string; confirmPassword: string; invitationCode: string }) {
    return api<{ user: { id: string; full_name: string; email: string; phone: string; status: string }; message: string }>(
      "/api/auth/register",
      { method: "POST", body: JSON.stringify(body) }
    );
  },
  registerAdmin(body: { fullName: string; email: string; phone: string; password: string; permissions: string }) {
    return api<{
      message: string;
      admin: { id: string; full_name: string; email: string; phone: string; status: string; role: string; admin_permissions?: string | null };
    }>("/api/auth/register-admin", { method: "POST", body: JSON.stringify(body) });
  },
  login(body: { email: string; password: string }) {
    return api<{
      token: string;
      refreshToken?: string;
      user: { id: string; full_name: string; email: string; phone: string; role: string; admin_permissions?: string | null };
    }>("/api/auth/login", { method: "POST", body: JSON.stringify(body) });
  },
  me(token?: string | null) {
    return api<{ user: { id: string; full_name: string; email: string; phone: string; role: string; admin_permissions?: string | null } }>(
      "/api/auth/me",
      token != null ? { token } : {}
    );
  },
  changePassword(body: { oldPassword: string; newPassword: string }) {
    return api<{ message: string }>("/api/auth/change-password", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },
  forgotPassword(body: { email: string; newPassword: string }) {
    return api<{ message: string }>("/api/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },
};

export type AdminUserRow = {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  status: string;
  created_at: string;
  updated_at?: string;
  asset_balance?: number;
  credit_score?: number;
  task_quota_total?: number;
  task_quota_used?: number;
  task_assignment_required?: boolean;
  task_assignment_requested_at?: string | null;
  task_assignment_granted_at?: string | null;
  prime_order_slots?: number[];
  /** Per-task prime rules (server-driven). */
  prime_orders?: { task_no: number; negative_amount: number; is_completed: boolean }[];
  withdrawal_status?: "none" | "pending" | "approved" | "rejected";
  withdrawal_amount?: number | null;
  withdrawal_bank_name?: string | null;
  withdrawal_account_number?: string | null;
  withdrawal_requested_at?: string | null;
  withdrawal_decided_at?: string | null;
  withdrawal_admin_note?: string | null;
};

export type AdminAdminRow = {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  role: "admin" | "super_admin";
  admin_permissions?: string | null;
  status: string;
  created_at: string;
  updated_at?: string;
};

export const adminApi = {
  getStats() {
    return api<{ totalUsers: number; activeUsers: number; pendingApproval: number; totalAdmins: number }>("/api/admin/stats");
  },
  getUsers(params?: { page?: number; limit?: number; status?: string }) {
    const q = new URLSearchParams();
    if (params?.page) q.set("page", String(params.page));
    if (params?.limit) q.set("limit", String(params.limit));
    if (params?.status) q.set("status", params.status);
    const query = q.toString();
    return api<{
      users: AdminUserRow[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>(`/api/admin/users${query ? `?${query}` : ""}`);
  },
  getAdmins() {
    return api<{ admins: AdminAdminRow[] }>("/api/admin/admins");
  },
  createAdmin(body: {
    fullName: string;
    email: string;
    phone: string;
    password: string;
    role?: "admin" | "super_admin";
    permissions?: string;
  }) {
    return api<{ admin: AdminAdminRow }>("/api/admin/admins", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },
  updateAdmin(id: string, body: { role?: "admin" | "super_admin"; permissions?: string }) {
    return api<{ admin: AdminAdminRow }>(`/api/admin/admins/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    });
  },
  getPending(params?: { page?: number; limit?: number }) {
    const q = new URLSearchParams();
    if (params?.page) q.set("page", String(params.page));
    if (params?.limit) q.set("limit", String(params.limit));
    const query = q.toString();
    return api<{
      users: AdminUserRow[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>(`/api/admin/pending${query ? `?${query}` : ""}`);
  },
  approve(id: string) {
    return api<{ user: unknown; message: string }>(`/api/admin/users/${id}/approve`, { method: "PATCH" });
  },
  reject(id: string) {
    return api<{ user: unknown; message: string }>(`/api/admin/users/${id}/reject`, { method: "PATCH" });
  },
  updateUserBalance(id: string, positiveAdd: number, negativeRuntime?: number) {
    return api<{ balance: number; userId: string }>(`/api/admin/users/${id}/balance`, {
      method: "PATCH",
      body: JSON.stringify({
        positiveAdd,
        negativeRuntime: negativeRuntime != null && negativeRuntime > 0 ? negativeRuntime : 0,
        value: positiveAdd,
      }),
    });
  },
  updateUserCreditScore(id: string, creditScore: number) {
    return api<{ credit_score: number; userId: string }>(`/api/admin/users/${id}/credit-score`, {
      method: "PATCH",
      body: JSON.stringify({ creditScore }),
    });
  },
  approveUserWithdrawal(id: string) {
    return api<{ message: string }>(`/api/admin/users/${id}/withdrawal/approve`, {
      method: "PATCH",
    });
  },
  rejectUserWithdrawal(id: string, note?: string) {
    return api<{ message: string }>(`/api/admin/users/${id}/withdrawal/reject`, {
      method: "PATCH",
      body: JSON.stringify({ note: note || "" }),
    });
  },
  deleteUser(id: string) {
    return api<{ message: string; user: { id: string; full_name: string; email: string } }>(`/api/admin/users/${id}`, {
      method: "DELETE",
    });
  },
  assignUserTasks(id: string) {
    return api<{ message: string; status: UserTaskStatus }>(`/api/admin/users/${id}/tasks/assign`, {
      method: "PATCH",
    });
  },
  /** Assign 30-task cycle with per-task prime recharge amounts (replaces assign + prime configure). */
  assignTasksWithPrime(
    id: string,
    primeOrders: { task_no: number; negative_amount: number; product_key?: string }[],
    hiddenGift?: { task_no: number | null; product_key: string | null } | null,
  ) {
    return api<{ message: string; status: UserTaskStatus }>(`/api/admin/users/${id}/tasks/assign-with-prime`, {
      method: "PATCH",
      body: JSON.stringify({
        primeOrders,
        ...(hiddenGift != null ? { hiddenGift } : {}),
      }),
    });
  },
  assignPrimeOrders(id: string, slots: number[], opts?: { noNegative?: boolean; negativeAmount?: number }) {
    return api<{ message: string; userId: string; slots: number[] }>(`/api/admin/users/${id}/tasks/prime`, {
      method: "PATCH",
      body: JSON.stringify({ slots, ...(opts ?? {}) }),
    });
  },
  assignSinglePrimeOrder(id: string, primeOrders: { task_no: number; negative_amount: number }[]) {
    return api<{ message: string; status: UserTaskStatus }>(`/api/admin/users/${id}/assign-prime-order`, {
      method: "POST",
      body: JSON.stringify({ prime_orders: primeOrders }),
    });
  },
};

export type UserTaskStatus = {
  userId: string;
  quotaTotal: number;
  quotaUsed: number;
  remaining: number;
  requiresAdminAssignment: boolean;
  canPerformTasks: boolean;
  /** Next/current task in cycle (from server). */
  currentTaskNo?: number;
  /** Wallet balance from server (same source of truth as prime checks). */
  balance?: number;
  /** Exactly one active prime at a time (or null/undefined when none). */
  activePrime?: { task_no: number; negative_amount: number; is_completed: boolean } | null;
  primeOrders?: { task_no: number; negative_amount: number; is_completed: boolean }[];
  nextAutoAssignAt: string | null;
  taskAssignmentRequestedAt?: string | null;
  taskAssignmentGrantedAt?: string | null;
  primeNegativeAmount?: number;
  /** Deterministic Grab Order product while this prime task is active (matches open task when created). */
  primeGrabProduct?: { image: string; title: string } | null;
  /** 0 = hidden gift disabled; otherwise trigger after this many tasks completed in cycle (default 28). */
  hiddenGiftTaskNo?: number;
  hiddenGiftProductKey?: string | null;
  hiddenGiftProduct?: { image: string; title: string } | null;
  /** True when admin picked a prime-catalog product for the hidden gift (show 15x boost). */
  hiddenGiftShowBoost?: boolean;
  /** When true, prime order UI may show order quantity / reserve impact as negative (admin set a recharge amount). */
  primeShowNegative?: boolean;
  /** True after admin saves a positive "Amount to add (runtime)" for this user. */
  signInRewardFromAdmin?: boolean;
  /** Reward amount for the check-in notification; only set when signInRewardFromAdmin is true. */
  signInRewardAmount?: number | null;
  hasReceivedFirstTasks?: boolean;
  firstTasksCompleted?: number;
  firstTasksRemaining?: number;
  commissionTier?: number;
  /** Report totals: first incomplete prime liability applied; protected reserve forced to 0. */
  total_capital?: number;
  totalCapital?: number;
  instant_profit?: number;
  instantProfit?: number;
  protected_reserve?: number;
  protectedReserve?: number;
  campaign_wallet?: number;
  campaignWallet?: number;
  initialReserveConsumed?: boolean;
  lastPositiveDepositAt?: string | null;
  reportProgress?: {
    lastTaskNo: number;
    lastAmount: number;
    cycleInstantProfit: number;
    lastOrderNumber?: string | null;
    updatedAt?: string | null;
  };
};

export type UserTaskActivityEntry = {
  id: string;
  title: string;
  orderNumber: string;
  quantityRs: number;
  commissionRs: number;
  createdAt: string;
  status: "pending" | "completed";
  taskNo?: number;
  isPrime?: boolean;
  message?: string | null;
  activityType?: "task" | "log";
  taskImage?: string | null;
  taskTitle?: string | null;
};

export type UserWalletCard = {
  mobilePhone: string;
  accountHolderName: string;
  accountNumber: string;
  bankName: string;
  branch: string;
  routingNumber: string;
  updatedAt: string | null;
  hasCard: boolean;
};

export type UserWithdrawalState = {
  balance: number;
  status: "none" | "pending" | "approved" | "rejected";
  amount: number | null;
  bankName: string;
  accountNumber: string;
  requestedAt: string | null;
  decidedAt: string | null;
  adminNote: string;
};

export type UserOpenTaskResult = {
  status?: UserTaskStatus;
  activity?: UserTaskActivityEntry;
  task?: {
    taskNo: number;
    title: string;
    image: string;
    quantityRs: number;
    commissionRs: number;
    rewards: number;
    isPrime: boolean;
  };
  code?: "PRIME_ORDER_PENDING" | "PRIME_BLOCKED" | "TASK_ASSIGNMENT_REQUIRED" | "INSUFFICIENT_BALANCE" | "NOT_FOUND";
  error?: string;
  message?: string;
};

/** User balance (requires auth). Uses token from localStorage by default. */
export const userApi = {
  getCreditScore() {
    return api<{ creditScore: number; deltaAmount: number }>("/api/user/credit-score", { suppressAuthRedirect: true });
  },
  getBalance() {
    // Balance checks are often background refreshes (focus/navigation).
    // Do not force logout/redirect on a single 401 from this endpoint.
    return api<{
      balance: number;
      capital: number;
      negativeAmountTotal: number;
      totalCommissions: number;
      total_capital: number;
      totalCapital: number;
      instant_profit: number;
      instantProfit: number;
      protected_reserve: number;
      protectedReserve: number;
      campaign_wallet: number;
      campaignWallet: number;
      hasAnyPrimeAssigned: boolean;
      commissionTier?: number;
      initialReserveConsumed?: boolean;
      lastPositiveDepositAt?: string | null;
    }>("/api/user/balance", { suppressAuthRedirect: true });
  },
  deposit(amount: number) {
    return api<{ balance: number; message: string }>("/api/user/deposit", {
      method: "POST",
      body: JSON.stringify({ amount }),
    });
  },
  getTaskStatus() {
    return api<UserTaskStatus>("/api/user/tasks/status", { suppressAuthRedirect: true });
  },
  getTaskActivity() {
    return api<{ entries: UserTaskActivityEntry[] }>("/api/user/tasks/activity", { suppressAuthRedirect: true });
  },
  openTask() {
    return api<UserOpenTaskResult>("/api/user/tasks/open", {
      method: "POST",
      suppressAuthRedirect: true,
    });
  },
  completeTask(activityId?: string) {
    return api<UserTaskStatus>("/api/user/tasks/complete", {
      method: "POST",
      body: JSON.stringify(activityId ? { activityId } : {}),
      suppressAuthRedirect: true,
    });
  },
  addActivityLog(body: { message: string }) {
    return api<{ ok: boolean }>("/api/user/activity-log", {
      method: "POST",
      body: JSON.stringify(body),
      suppressAuthRedirect: true,
    });
  },
  getWalletCard() {
    return api<UserWalletCard>("/api/user/wallet-card", { suppressAuthRedirect: true });
  },
  saveWalletCard(body: {
    mobilePhone: string;
    accountHolderName: string;
    accountNumber: string;
    bankName: string;
    branch: string;
    routingNumber: string;
  }) {
    return api<{ message: string; card: UserWalletCard }>("/api/user/wallet-card", {
      method: "POST",
      body: JSON.stringify(body),
      suppressAuthRedirect: true,
    });
  },
  unlinkWalletCard(withdrawalPassword: string) {
    return api<{ message: string }>("/api/user/wallet-card/unlink", {
      method: "POST",
      body: JSON.stringify({ withdrawalPassword }),
      suppressAuthRedirect: true,
    });
  },
  getWithdrawalState() {
    return api<UserWithdrawalState>("/api/user/withdrawal", { suppressAuthRedirect: true });
  },
  requestWithdrawal(body: {
    bankName: string;
    accountNumber: string;
    amount: number;
    withdrawalPassword: string;
  }) {
    return api<{ message: string }>("/api/user/withdrawal", {
      method: "POST",
      body: JSON.stringify(body),
      suppressAuthRedirect: true,
    });
  },
  acknowledgeWithdrawal() {
    return api<{ ok: boolean }>("/api/user/withdrawal/ack", {
      method: "POST",
      suppressAuthRedirect: true,
    });
  },
};
