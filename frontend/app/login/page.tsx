"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const savedRemember = window.localStorage.getItem("adminRemember");
    const savedEmail = window.localStorage.getItem("adminEmail");

    if (savedEmail) {
      setEmail(savedEmail);
    }

    if (savedRemember === "true") {
      setRememberMe(true);
    } else if (savedRemember === "false") {
      setRememberMe(false);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const isAdminEmail = email.trim().toLowerCase() === "musmannawaz@gmail.com";
    const storedPassword = typeof window !== "undefined" ? window.localStorage.getItem("adminLoginPassword") : null;
    const expectedPassword = storedPassword || "test@321@123";
    const isAdminPassword = password === expectedPassword;

    if (!isAdminEmail || !isAdminPassword) {
      setError("Invalid email or password.");
      return;
    }

    setError("");

    if (typeof window !== "undefined") {
      if (rememberMe) {
        window.localStorage.setItem("adminEmail", email.trim());
        window.localStorage.setItem("adminRemember", "true");
      } else {
        window.localStorage.removeItem("adminEmail");
        window.localStorage.setItem("adminRemember", "false");
      }
      window.localStorage.setItem("adminLoginPassword", password);
    }

    router.push("/dashboard");
  };

  return (
    <main className="min-h-screen bg-slate-100 flex flex-col items-center py-8 px-4">
      <section className="w-full max-w-md overflow-hidden rounded-md bg-white shadow-md relative h-56">
        <Image
          src="/images/login-hero.jpeg"
          alt="Factory production line"
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
            Please login account to continue
          </p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-600">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
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
            className="mt-2 w-full rounded bg-sky-700 px-4 py-2.5 text-sm font-semibold text-white shadow hover:bg-sky-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
          >
            Login
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
          © 2025 . <span className="font-semibold">Freight POP</span> . All
          Rights Reserved
        </p>
      </section>
    </main>
  );
}

