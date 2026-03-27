"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { authApi } from "@/lib/api";
import { clearAuth, getAuthUser, getToken, setAuth } from "@/lib/auth-store";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const pendingMessage = searchParams.get("pending") === "1";
  const sessionExpired = searchParams.get("session") === "expired" && !isAuthenticated;

  useEffect(() => {
    if (typeof window === "undefined") return;
    const savedRemember =
      window.localStorage.getItem("userRemember") ?? window.localStorage.getItem("adminRemember");
    const savedEmail = window.localStorage.getItem("userEmail") ?? window.localStorage.getItem("adminEmail");
    if (savedEmail) setEmail(savedEmail);
    if (savedRemember === "true") setRememberMe(true);
    else if (savedRemember === "false") setRememberMe(false);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const token = getToken();
    const user = getAuthUser();
    const authenticated = !!token && !!user;
    setIsAuthenticated(authenticated);
    if (authenticated) {
      router.replace(user.role === "admin" || user.role === "super_admin" ? "/admin" : "/dashboard");
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const rawInput = email.trim().toLowerCase();
    if (!rawInput || !password) {
      setError("Please enter email / mobile and password.");
      return;
    }

    setLoading(true);
    const result = await authApi.login({ email: rawInput, password });
    setLoading(false);

    if (result.error) {
      const code = (result.data as { code?: string })?.code;
      if (result.status === 404 && code === "USER_NOT_FOUND") {
        setError("This account does not exist. Please check the email or register a new account.");
        return;
      }
      if (result.status === 403 && code === "PENDING_APPROVAL") {
        setError("Your account is waiting for admin approval.");
        return;
      }
      if (result.status === 403 && code === "REJECTED") {
        setError("Your account was not approved by the admin.");
        return;
      }
      setError(result.error);
      return;
    }

    const data = result.data;

    if (!data?.token || !data?.user) {
      setError("Invalid response from server.");
      return;
    }

    if (data.user.role === "admin" || data.user.role === "super_admin") {
      clearAuth("admin");
      setError("Admin account detected. Please use the admin login page.");
      router.push("/admin/login");
      return;
    }

    setAuth(data.token, data.user, data.refreshToken ?? null);

    if (typeof window !== "undefined") {
      // Persist remember-me preferences in localStorage
      if (rememberMe) {
        const rememberedEmail = email.trim();
        window.localStorage.setItem("userEmail", rememberedEmail);
        window.localStorage.setItem("userRemember", "true");
        // Legacy keys kept for pages that still read old names.
        window.localStorage.setItem("adminEmail", rememberedEmail);
        window.localStorage.setItem("adminRemember", "true");
      } else {
        window.localStorage.removeItem("userEmail");
        window.localStorage.setItem("userRemember", "false");
        window.localStorage.removeItem("adminEmail");
        window.localStorage.setItem("adminRemember", "false");
      }

      // Set role-scoped cookie for middleware route protection.
      try {
        const tokenValue = data.token || "12345";
        const roleCookie =
          data.user.role === "admin" || data.user.role === "super_admin"
            ? "adminAuthToken"
            : "userAuthToken";
        document.cookie = `${roleCookie}=${encodeURIComponent(tokenValue)}; path=/; SameSite=Lax`;
        // Legacy fallback cookie used by older middleware.
        document.cookie = `authToken=${encodeURIComponent(tokenValue)}; path=/; SameSite=Lax`;
      } catch (err) {
        console.error("[login] failed to set auth cookie", err);
      }
    }

    router.push(searchParams.get("redirect") || "/dashboard");
  };

  return (
    <main className="min-h-screen bg-slate-100 flex flex-col items-center py-8 px-4">
      <section className="w-full max-w-md overflow-hidden rounded-md bg-white shadow-md relative h-56">
        <Image
          src="/images/login-hero.jpg"
          alt="Login hero"
          fill
          className="object-cover"
          sizes="(max-width: 448px) 100vw, 448px"
          priority
        />
      </section>

      <section className="w-full max-w-md -mt-10 rounded-2xl bg-white shadow-md border border-slate-200 px-8 pb-8 pt-10 space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-semibold text-slate-900">
            Login to Continue
          </h1>
          <p className="text-sm text-slate-500">
            Please login to your account to continue
          </p>
        <button
          type="button"
          onClick={() => router.push("/admin/login")}
          className="pt-2 text-xs font-medium text-slate-600 hover:text-slate-900 hover:underline"
        >
          Admin? Go to Admin Login
        </button>
        </div>

        {pendingMessage && (
          <div className="rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800">
            Registration successful. Your account is <strong>pending admin approval</strong>. You can login after an admin approves your account from the Admin Panel.
          </div>
        )}
        {sessionExpired && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Your session has expired due to inactivity. Please log in again.
          </div>
        )}

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-600">
              Email / Mobile
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email or mobile"
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-600">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="mt-1 w-full rounded border border-slate-300 px-3 py-2 pr-10 text-sm text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute inset-y-0 right-3 flex items-center text-slate-400 text-xs"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                👁
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-600">
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                className="h-3.5 w-3.5 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <span>Remember me</span>
            </label>
            <button
              type="button"
              className="text-xs font-medium text-sky-600 hover:underline"
              onClick={() => router.push("/forgot-password")}
            >
              Forgot password?
            </button>
          </div>

          {error && (
            <p className="text-xs text-red-600">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full rounded bg-sky-700 px-4 py-2.5 text-sm font-semibold text-white shadow hover:bg-sky-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 disabled:opacity-70"
          >
            {loading ? "Logging in…" : "Login"}
          </button>
        </form>

        <p className="pt-2 text-center text-xs text-slate-600">
          Don&apos;t have an account?{" "}
          <button
            type="button"
            onClick={() => router.push("/register")}
            className="font-semibold text-sky-700 hover:underline"
          >
            Register Now
          </button>
        </p>

        <p className="pt-2 text-center text-[11px] text-slate-400">
          © 2025 . <span className="font-semibold">Freight POP</span> . All Rights Reserved
        </p>
      </section>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-slate-100" />}>
      <LoginContent />
    </Suspense>
  );
}
