"use client";

import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { getUserData, getUserToken, isElevatedUserProfile } from "@/lib/auth-store";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const token = getUserToken();
    const user = getUserData();
    if (!token || !user || isElevatedUserProfile(user)) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname || "/dashboard")}`);
      return;
    }
    setAllowed(true);
  }, [pathname, router]);

  if (allowed !== true) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <p className="text-slate-500">Loading...</p>
      </div>
    );
  }

  return <>{children}</>;
}
