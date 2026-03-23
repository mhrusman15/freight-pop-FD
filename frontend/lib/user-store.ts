/**
 * Client-side user store for pending and approved users.
 * Uses localStorage so Register, Login, and Admin Approvals stay in sync.
 * Replace with API calls when you have a backend.
 */

const PENDING_KEY = "fp_pending_users";
const APPROVED_KEY = "fp_approved_users";

export interface PendingUser {
  id: string;
  name: string;
  email: string;
  mobile: string;
  password: string;
  withdrawalPassword: string;
  createdAt: string;
}

export interface ApprovedUser {
  email: string;
  password: string;
  name: string;
  mobile: string;
  approvedAt: string;
}

function getPending(): PendingUser[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(PENDING_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setPending(users: PendingUser[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PENDING_KEY, JSON.stringify(users));
}

function getApproved(): ApprovedUser[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(APPROVED_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setApproved(users: ApprovedUser[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(APPROVED_KEY, JSON.stringify(users));
}

export const userStore = {
  addPending(user: Omit<PendingUser, "id" | "createdAt">): PendingUser {
    const pending = getPending();
    const id = `pending_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const newUser: PendingUser = {
      ...user,
      id,
      createdAt: new Date().toISOString(),
    };
    pending.push(newUser);
    setPending(pending);
    return newUser;
  },

  getPending(): PendingUser[] {
    return getPending();
  },

  removePending(id: string): void {
    setPending(getPending().filter((u) => u.id !== id));
  },

  approveUser(pendingUser: PendingUser): void {
    const approved = getApproved();
    approved.push({
      email: pendingUser.email.toLowerCase().trim(),
      password: pendingUser.password,
      name: pendingUser.name,
      mobile: pendingUser.mobile,
      approvedAt: new Date().toISOString(),
    });
    setApproved(approved);
    removePending(pendingUser.id);
  },

  rejectUser(id: string): void {
    removePending(id);
  },

  isApproved(email: string): boolean {
    const e = email.toLowerCase().trim();
    return getApproved().some((u) => u.email === e);
  },

  isPending(email: string): boolean {
    const e = email.toLowerCase().trim();
    return getPending().some((u) => u.email.toLowerCase().trim() === e);
  },

  getApprovedUser(email: string): ApprovedUser | undefined {
    const e = email.toLowerCase().trim();
    return getApproved().find((u) => u.email === e);
  },
};

function removePending(id: string) {
  setPending(getPending().filter((u) => u.id !== id));
}
