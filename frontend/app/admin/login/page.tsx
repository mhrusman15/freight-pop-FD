"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authApi } from "@/lib/api";
import { getAdminToken, getAdminUser, setAuth } from "@/lib/auth-store";

function AdminLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [signupMode, setSignupMode] = useState(false);
  const [signupName, setSignupName] = useState("");
  const [signupPhone, setSignupPhone] = useState("");
  const [signupPermission, setSignupPermission] = useState("view_only");
  const [signupSuccess, setSignupSuccess] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const sessionExpired = searchParams.get("session") === "expired" && !isAuthenticated;

  useEffect(() => {
    if (typeof window === "undefined") return;
    const savedRemember = window.localStorage.getItem("adminRemember");
    const savedEmail = window.localStorage.getItem("adminEmail");
    if (savedEmail) setEmail(savedEmail);
    if (savedRemember === "true") setRememberMe(true);
    else if (savedRemember === "false") setRememberMe(false);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const token = getAdminToken();
    const user = getAdminUser();
    const authenticated = !!token && !!user;
    setIsAuthenticated(authenticated);
    if (authenticated && (user.role === "admin" || user.role === "super_admin")) {
      router.replace("/admin");
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const emailLower = email.trim().toLowerCase();
    if (!emailLower || !password) {
      setError("Please enter email and password.");
      return;
    }

    setLoading(true);
    const result = await authApi.login({ email: emailLower, password });
    setLoading(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    const data = result.data;
    if (!data?.token || !data?.user) {
      setError("Invalid response from server.");
      return;
    }

    if (data.user.role !== "admin" && data.user.role !== "super_admin") {
      setError("This portal is only for admin accounts. Please use user login.");
      router.push("/login");
      return;
    }

    setAuth(data.token, data.user, data.refreshToken ?? null);

    if (typeof window !== "undefined") {
      if (rememberMe) {
        window.localStorage.setItem("adminEmail", email.trim());
        window.localStorage.setItem("adminRemember", "true");
      } else {
        window.localStorage.removeItem("adminEmail");
        window.localStorage.setItem("adminRemember", "false");
      }

      try {
        document.cookie = `adminAuthToken=${encodeURIComponent(data.token)}; path=/; SameSite=Lax`;
      } catch {
        // no-op
      }
    }

    router.push(searchParams.get("redirect") || "/admin");
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSignupSuccess("");
    const emailLower = email.trim().toLowerCase();
    if (!signupName.trim() || !signupPhone.trim() || !emailLower || !password) {
      setError("Please fill full name, phone, email and password.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    const result = await authApi.registerAdmin({
      fullName: signupName.trim(),
      phone: signupPhone.trim(),
      email: emailLower,
      password,
      permissions: signupPermission,
    });
    setLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setSignupSuccess("Signup request submitted. Waiting for super admin approval.");
    setPassword("");
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#26264a] via-[#343b72] to-[#1f2350] px-4 py-8 text-white">
      <section className="mx-auto flex min-h-[82vh] w-full max-w-6xl overflow-hidden rounded-[28px] border border-cyan-300/20 bg-[#34365b] shadow-2xl">
        <div className="hidden w-1/3 bg-gradient-to-br from-cyan-400/40 via-blue-500/30 to-indigo-500/10 lg:block" />

        <div className="flex flex-1 items-center justify-center px-6 py-10 sm:px-10">
          <div className="w-full max-w-md">
            <div className="mb-10 text-center">
              <h1 className="text-4xl font-semibold tracking-wide text-cyan-200">Prime Panel</h1>
              <p className="mt-2 text-xs text-slate-300">Fast &amp; Easy Product Management</p>
              <h2 className="mt-10 text-3xl font-semibold text-white">Welcome Back!</h2>
              <p className="mt-2 inline-flex rounded-full border border-cyan-300/40 bg-cyan-300/10 px-3 py-1 text-xs text-cyan-100">
                {signupMode ? "Admin Signup Portal" : "Admin Login Portal"}
              </p>
            </div>

            {sessionExpired && (
              <div className="mb-4 rounded-md border border-amber-300/40 bg-amber-300/10 px-4 py-3 text-sm text-amber-100">
                Your admin session expired. Please sign in again.
              </div>
            )}

            {error && (
              <div className="mb-4 rounded-md border border-red-300/40 bg-red-300/10 px-4 py-3 text-sm text-red-100">
                {error}
              </div>
            )}
            {signupSuccess && (
              <div className="mb-4 rounded-md border border-emerald-300/40 bg-emerald-300/10 px-4 py-3 text-sm text-emerald-100">
                {signupSuccess}
              </div>
            )}

            <form onSubmit={signupMode ? handleSignup : handleSubmit} className="space-y-6">
              {signupMode && (
                <>
                  <div>
                    <label className="mb-2 block text-xs text-slate-300">Full Name</label>
                    <input
                      type="text"
                      value={signupName}
                      onChange={(e) => setSignupName(e.target.value)}
                      placeholder="Your full name"
                      className="w-full border-0 border-b border-slate-300/70 bg-transparent px-0 py-2 text-sm text-white placeholder:text-slate-300/80 focus:border-cyan-200 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs text-slate-300">Phone</label>
                    <input
                      type="text"
                      value={signupPhone}
                      onChange={(e) => setSignupPhone(e.target.value)}
                      placeholder="+1 234 567 890"
                      className="w-full border-0 border-b border-slate-300/70 bg-transparent px-0 py-2 text-sm text-white placeholder:text-slate-300/80 focus:border-cyan-200 focus:outline-none"
                    />
                  </div>
                </>
              )}
              <div>
                <label className="mb-2 block text-xs text-slate-300">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@email.com"
                  className="w-full border-0 border-b border-slate-300/70 bg-transparent px-0 py-2 text-sm text-white placeholder:text-slate-300/80 focus:border-cyan-200 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs text-slate-300">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full border-0 border-b border-slate-300/70 bg-transparent px-0 py-2 pr-10 text-sm text-white placeholder:text-slate-300/80 focus:border-cyan-200 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-0 top-1/2 -translate-y-1/2 text-black"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <svg
                        className="h-5 w-5"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        aria-hidden="true"
                      >
                        <path
                          d="M3 3L21 21"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M10.58 10.58C10.21 10.95 10 11.46 10 12C10 13.1 10.9 14 12 14C12.54 14 13.05 13.79 13.42 13.42"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M9.88 5.09C10.56 4.89 11.27 4.79 12 4.79C16.55 4.79 20.26 8.33 21 12C20.72 13.37 20.03 14.63 19.02 15.62"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M6.61 6.61C4.9 7.79 3.61 9.71 3 12C3.74 15.67 7.45 19.21 12 19.21C13.95 19.21 15.74 18.56 17.21 17.49"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="h-5 w-5"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        aria-hidden="true"
                      >
                        <path
                          d="M1 12C2.73 7.61 7 4.5 12 4.5C17 4.5 21.27 7.61 23 12C21.27 16.39 17 19.5 12 19.5C7 19.5 2.73 16.39 1 12Z"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <circle
                          cx="12"
                          cy="12"
                          r="3"
                          stroke="currentColor"
                          strokeWidth="2"
                        />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-300">
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-3.5 w-3.5 rounded border-slate-500 bg-transparent"
                  />
                  <span>Remember me</span>
                </label>
                <button
                  type="button"
                  onClick={() => router.push("/forgot-password")}
                  className="text-cyan-200 hover:underline"
                >
                  Forget My Password
                </button>
              </div>
              {signupMode && (
                <div>
                  <label className="mb-2 block text-xs text-slate-300">Requested Access</label>
                  <select
                    value={signupPermission}
                    onChange={(e) => setSignupPermission(e.target.value)}
                    className="w-full rounded-md border border-slate-300/60 bg-transparent px-3 py-2 text-sm text-white focus:border-cyan-200 focus:outline-none"
                  >
                    <option className="text-slate-900" value="view_only">View users only</option>
                    <option className="text-slate-900" value="balance_only">Change amount only</option>
                    <option className="text-slate-900" value="approve_only">Approve user accounts only</option>
                    <option className="text-slate-900" value="full">Full admin access</option>
                  </select>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-md bg-cyan-300 px-4 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-cyan-200 disabled:opacity-60"
              >
                {loading ? (signupMode ? "Submitting..." : "Signing in...") : (signupMode ? "Submit Signup Request" : "Sign in")}
              </button>
            </form>

            <div className="mt-8 text-center text-xs text-slate-300">
              <button
                type="button"
                onClick={() => {
                  setError("");
                  setSignupSuccess("");
                  setSignupMode((prev) => !prev);
                }}
                className="mr-4 text-cyan-100 hover:underline"
              >
                {signupMode ? "Back to Admin Login" : "Admin Signup"}
              </button>
              <button
                type="button"
                onClick={() => router.push("/login")}
                className="text-cyan-100 hover:underline"
              >
                User login
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-gradient-to-br from-[#26264a] via-[#343b72] to-[#1f2350]" />}>
      <AdminLoginContent />
    </Suspense>
  );
}
