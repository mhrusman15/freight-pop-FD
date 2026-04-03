"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SplashScreen() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace("/login");
    }, 4000); // 4 seconds

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <main className="relative isolate min-h-[100dvh] min-h-screen w-full overflow-hidden bg-slate-900">
      <div className="absolute inset-0 min-h-[100dvh]">
        <img
          src="/images/splash/splash-logo.jpg"
          alt=""
          className="h-full min-h-[100dvh] w-full object-cover object-center"
          fetchPriority="high"
          aria-hidden
        />
      </div>
      <div
        className="relative z-10 flex min-h-[100dvh] min-h-screen flex-col items-center justify-end gap-4 px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[env(safe-area-inset-top)] sm:justify-center sm:pb-8"
        role="status"
        aria-live="polite"
      >
        <p className="text-center text-sm font-medium tracking-[0.25em] text-slate-100 drop-shadow-[0_1px_8px_rgba(0,0,0,0.85)]">
          Loading...
        </p>
      </div>
    </main>
  );
}
