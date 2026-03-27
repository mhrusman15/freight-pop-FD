import { clearAuth, getRefreshToken, getToken, setAccessToken } from "./auth-store";

function resolveApiBase(): string {
  const envBase = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (envBase) return envBase.replace(/\/$/, "");

  // In deployed environments, call the co-hosted backend service route.
  if (typeof window !== "undefined") {
    const host = window.location.hostname.toLowerCase();
    const isLocalHost = host === "localhost" || host === "127.0.0.1";
    if (!isLocalHost) return `${window.location.origin}/_/backend`;
  }

  // Local development fallback.
  return "http://localhost:4000";
}

const API_BASE = resolveApiBase();

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

let refreshInFlight: Promise<boolean> | null = null;

async function refreshAccessToken(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if (refreshInFlight) return refreshInFlight;
  const rt = getRefreshToken();
  if (!rt) return false;

  refreshInFlight = (async () => {
    try {
      const res = await fetch(`${API_BASE}/api/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: rt }),
      });
      const data = (await res.json().catch(() => ({}))) as { token?: string };
      if (!res.ok || !data.token) return false;
      setAccessToken(data.token);
      return true;
    } catch {
      return false;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

export async function api<T>(
  path: string,
  options: RequestInit & { token?: string | null; suppressAuthRedirect?: boolean } = {}
): Promise<{ data?: T; error?: string; status: number }> {
  const { token = getToken(), suppressAuthRedirect = false, ...fetchOptions } = options;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((fetchOptions.headers as Record<string, string>) || {}),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  let res: Response;
  let retriedAfterRefresh = false;
  try {
    res = await fetch(`${API_BASE}${path}`, { ...fetchOptions, headers });
    if (
      res.status === 401 &&
      !retriedAfterRefresh &&
      shouldAttemptRefresh(path) &&
      (await refreshAccessToken())
    ) {
      retriedAfterRefresh = true;
      const newTok = getToken();
      if (newTok) headers["Authorization"] = `Bearer ${newTok}`;
      res = await fetch(`${API_BASE}${path}`, { ...fetchOptions, headers });
    }
  } catch {
    // Network-level failure (no HTTP response).
    // Status 0 is a common sentinel for "unreachable server" from fetch wrappers.
    return {
      error:
        "Unable to reach the server. Please check your internet connection or try again in a moment.",
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
          'This usually means the backend route is not being reached (check "/_/backend/health" on Vercel) ' +
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
        `Check NEXT_PUBLIC_API_URL (should be "/_/backend" on Vercel).` +
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
        clearAuth();
        window.localStorage.removeItem("fp_asset_balance");
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
  me(token: string | null) {
    return api<{ user: { id: string; full_name: string; email: string; phone: string; role: string; admin_permissions?: string | null } }>(
      "/api/auth/me",
      { token }
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
  task_quota_total?: number;
  task_quota_used?: number;
  task_assignment_required?: boolean;
  task_assignment_requested_at?: string | null;
  task_assignment_granted_at?: string | null;
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
  updateUserBalance(id: string, value: number) {
    return api<{ balance: number; userId: string }>(`/api/admin/users/${id}/balance`, {
      method: "PATCH",
      body: JSON.stringify({ value }),
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
  assignPrimeOrders(id: string, slots: number[], opts?: { noNegative?: boolean; negativeAmount?: number }) {
    return api<{ message: string; userId: string; slots: number[] }>(`/api/admin/users/${id}/tasks/prime`, {
      method: "PATCH",
      body: JSON.stringify({ slots, ...(opts ?? {}) }),
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
  nextAutoAssignAt: string | null;
  taskAssignmentRequestedAt?: string | null;
  taskAssignmentGrantedAt?: string | null;
  primeNegativeAmount?: number;
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
  code?: "PRIME_ORDER_PENDING" | "TASK_ASSIGNMENT_REQUIRED" | "NOT_FOUND";
  error?: string;
};

/** User balance (requires auth). Uses token from localStorage by default. */
export const userApi = {
  getBalance() {
    // Balance checks are often background refreshes (focus/navigation).
    // Do not force logout/redirect on a single 401 from this endpoint.
    return api<{ balance: number }>("/api/user/balance", { suppressAuthRedirect: true });
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
};
