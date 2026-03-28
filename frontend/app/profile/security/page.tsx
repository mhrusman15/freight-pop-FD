"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/api";
import { getUserToken } from "@/lib/auth-store";

type TabId = "withdrawal" | "login";

function EyeIcon({ open }: { open: boolean }) {
  if (open) {
    return (
      <svg className="h-5 w-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
      </svg>
    );
  }
  return (
    <svg className="h-5 w-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );
}

function PasswordField({
  id,
  label,
  value,
  onChange,
  showPassword,
  onToggleShow,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  showPassword: boolean;
  onToggleShow: () => void;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={showPassword ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-3 pr-12 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <button
          type="button"
          onClick={onToggleShow}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
          aria-label={showPassword ? "Hide password" : "Show password"}
        >
          <EyeIcon open={showPassword} />
        </button>
      </div>
    </div>
  );
}

export default function ProfileSecurityPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>("login");
  const [loginShow, setLoginShow] = useState({ old: false, new: false, confirm: false });
  const [withdrawalShow, setWithdrawalShow] = useState({ old: false, new: false, confirm: false });
  const [loginForm, setLoginForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [withdrawalForm, setWithdrawalForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [loginError, setLoginError] = useState("");
  const [loginSuccess, setLoginSuccess] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const token = getUserToken();
    const saved = window.localStorage.getItem("adminEmail");
    const remembered = window.localStorage.getItem("adminRemember");
    if (!token && !saved && remembered !== "true") {
      router.replace("/login");
      return;
    }
    setMounted(true);
  }, [router]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setLoginSuccess(false);
    if (loginForm.newPassword.length < 6) {
      setLoginError("New password must be at least 6 characters.");
      return;
    }
    if (loginForm.newPassword !== loginForm.confirmPassword) {
      setLoginError("New password and confirm password do not match.");
      return;
    }
    const token = getUserToken();
    if (token) {
      const result = await authApi.changePassword({
        oldPassword: loginForm.oldPassword,
        newPassword: loginForm.newPassword,
      });
      if (result.error) {
        setLoginError(result.error);
        return;
      }
      setLoginForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
      setLoginSuccess(true);
      return;
    }
    const currentPassword =
      (typeof window !== "undefined" && window.localStorage.getItem("adminLoginPassword")) ||
      "test@321@123";
    if (loginForm.oldPassword !== currentPassword) {
      setLoginError("Old password is incorrect.");
      return;
    }
    if (typeof window !== "undefined") {
      window.localStorage.setItem("adminLoginPassword", loginForm.newPassword);
    }
    setLoginForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
    setLoginSuccess(true);
  };

  const handleWithdrawalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Add validation / API call here
  };

  if (!mounted) {
    return (
      <main className="min-h-screen bg-white dark:bg-slate-900">
        <header className="sticky top-0 z-20 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
          <div className="flex min-h-[3rem] items-center justify-center px-4">
            <div className="absolute left-4 h-6 w-6 rounded bg-slate-200 dark:bg-slate-600" />
            <div className="h-5 w-32 rounded bg-slate-200 dark:bg-slate-600" />
          </div>
        </header>
        <div className="fp-container py-8">
          <div className="mx-auto max-w-sm animate-pulse space-y-4">
            <div className="h-10 rounded bg-slate-200 dark:bg-slate-700" />
            <div className="h-12 rounded bg-slate-200 dark:bg-slate-700" />
            <div className="h-12 rounded bg-slate-200 dark:bg-slate-700" />
            <div className="h-12 rounded bg-slate-200 dark:bg-slate-700" />
          </div>
        </div>
      </main>
    );
  }

  const tabs: { id: TabId; label: string }[] = [
    { id: "withdrawal", label: "withdrawal password" },
    { id: "login", label: "Login password" },
  ];

  return (
    <main className="min-h-screen bg-white dark:bg-slate-900">
      <header className="sticky top-0 z-20 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
        <div className="flex min-h-[3rem] items-center justify-center px-4">
          <button
            type="button"
            onClick={() => (typeof window !== "undefined" && window.history.length > 1 ? router.back() : router.push("/profile"))}
            className="absolute left-4 flex items-center text-slate-900 dark:text-slate-100 hover:text-slate-600 dark:hover:text-slate-300"
            aria-label="Back to profile"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">User Security</h1>
        </div>
      </header>

      <div className="fp-container py-6">
        <div className="mx-auto max-w-sm">
          {/* Tabs */}
          <div className="flex border-b border-slate-200 dark:border-slate-700">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? "border-b-2 border-primary text-primary"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Login password form */}
          {activeTab === "login" && (
            <form onSubmit={handleLoginSubmit} className="mt-6 space-y-5">
              {loginError && (
                <p className="rounded-lg bg-red-50 dark:bg-red-900/20 px-3 py-2 text-sm text-red-600 dark:text-red-400">
                  {loginError}
                </p>
              )}
              {loginSuccess && (
                <p className="rounded-lg bg-green-50 dark:bg-green-900/20 px-3 py-2 text-sm text-green-700 dark:text-green-400">
                  Login password changed successfully. Use your new password next time you sign in.
                </p>
              )}
              <PasswordField
                id="login-old"
                label="Old Password"
                value={loginForm.oldPassword}
                onChange={(v) => setLoginForm((p) => ({ ...p, oldPassword: v }))}
                showPassword={loginShow.old}
                onToggleShow={() => setLoginShow((s) => ({ ...s, old: !s.old }))}
              />
              <PasswordField
                id="login-new"
                label="New password"
                value={loginForm.newPassword}
                onChange={(v) => setLoginForm((p) => ({ ...p, newPassword: v }))}
                showPassword={loginShow.new}
                onToggleShow={() => setLoginShow((s) => ({ ...s, new: !s.new }))}
              />
              <PasswordField
                id="login-confirm"
                label="Confirm password"
                value={loginForm.confirmPassword}
                onChange={(v) => setLoginForm((p) => ({ ...p, confirmPassword: v }))}
                showPassword={loginShow.confirm}
                onToggleShow={() => setLoginShow((s) => ({ ...s, confirm: !s.confirm }))}
              />
              <button
                type="submit"
                className="w-full rounded-lg bg-orange-500 py-3.5 text-base font-semibold text-white shadow hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
              >
                Confirm
              </button>
            </form>
          )}

          {/* Withdrawal password form */}
          {activeTab === "withdrawal" && (
            <form onSubmit={handleWithdrawalSubmit} className="mt-6 space-y-5">
              <PasswordField
                id="wd-old"
                label="Old withdrawal password"
                value={withdrawalForm.oldPassword}
                onChange={(v) => setWithdrawalForm((p) => ({ ...p, oldPassword: v }))}
                showPassword={withdrawalShow.old}
                onToggleShow={() => setWithdrawalShow((s) => ({ ...s, old: !s.old }))}
              />
              <PasswordField
                id="wd-new"
                label="New withdrawal password"
                value={withdrawalForm.newPassword}
                onChange={(v) => setWithdrawalForm((p) => ({ ...p, newPassword: v }))}
                showPassword={withdrawalShow.new}
                onToggleShow={() => setWithdrawalShow((s) => ({ ...s, new: !s.new }))}
              />
              <PasswordField
                id="wd-confirm"
                label="Confirm withdrawal password"
                value={withdrawalForm.confirmPassword}
                onChange={(v) => setWithdrawalForm((p) => ({ ...p, confirmPassword: v }))}
                showPassword={withdrawalShow.confirm}
                onToggleShow={() => setWithdrawalShow((s) => ({ ...s, confirm: !s.confirm }))}
              />
              <button
                type="submit"
                className="w-full rounded-lg bg-orange-500 py-3.5 text-base font-semibold text-white shadow hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
              >
                Confirm
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
