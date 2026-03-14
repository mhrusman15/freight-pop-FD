 "use client";

import Image from "next/image";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SplashScreen() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace("/login");
    }, 3000); // 3 seconds

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-900">
      <div className="flex flex-col items-center gap-6 px-4">
        <div className="relative w-full max-w-xs sm:max-w-sm md:max-w-md">
          <Image
            src="/images/splash/splash-logo.jpg"
            alt="Freight POP"
            width={800}
            height={800}
            className="w-full h-auto object-contain"
            priority
          />
        </div>
        <p className="text-slate-100 text-sm tracking-[0.25em] uppercase text-center">
          Loading...
        </p>
      </div>
    </main>
  );
}
