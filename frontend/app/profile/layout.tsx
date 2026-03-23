"use client";

import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { getToken, getAuthUser, isAdmin } from "@/lib/auth-store";

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const token = getToken();
    const user = getAuthUser();

    if (!token || !user || isAdmin()) {
      const redirect = encodeURIComponent(pathname || "/profile");
      router.replace(`/login?redirect=${redirect}`);
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

