"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function ProfileAboutHelpVipBenefitPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem("adminEmail");
    const remembered = window.localStorage.getItem("adminRemember");
    if (!saved && remembered !== "true") {
      router.replace("/login");
      return;
    }
    setMounted(true);
  }, [router]);

  if (!mounted) {
    return (
      <main className="min-h-screen bg-slate-100 dark:bg-slate-900">
        <header className="sticky top-0 z-20 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
          <div className="flex min-h-[3rem] items-center justify-center px-4">
            <div className="absolute left-4 h-6 w-6 rounded bg-slate-200 dark:bg-slate-600" />
            <div className="h-5 w-24 rounded bg-slate-200 dark:bg-slate-600" />
          </div>
        </header>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 dark:bg-slate-900">
      <header className="sticky top-0 z-20 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
        <div className="flex min-h-[3rem] items-center justify-center px-4">
          <button
            type="button"
            onClick={() =>
              typeof window !== "undefined" && window.history.length > 1
                ? router.back()
                : router.push("/profile/about/help")
            }
            className="absolute left-4 flex items-center text-slate-900 dark:text-slate-100 hover:text-slate-600 dark:hover:text-slate-300"
            aria-label="Back to help page"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            VIP Benefit
          </h1>
        </div>
      </header>

      <div className="fp-container py-5">
        <div className="mx-auto max-w-md bg-white px-4 py-4 text-[20px] leading-tight text-black dark:bg-slate-800 dark:text-slate-100">
          <p>
            <strong>VIP and Premium VIP6</strong> members enjoy different
            benefits on the platform.
          </p>
          <p>
            All members receive <strong>5% cashback</strong> in the form of{" "}
            <strong>Points Redemption</strong> on each order, which can be used
            to redeem up to <strong>100 points</strong>. Orders above Rs100,000
            may earn an additional <strong>200 bonus points</strong>.
          </p>
          <p>
            Please note that <strong>cashback rewards</strong> are exclusive to
            the <strong>Flipkart</strong> platform and do not apply to
            affiliated sites such as Myntra, Cleartrip, or Shopsy.
          </p>
          <p>
            <strong>VIP members</strong> also receive <strong>early access</strong>{" "}
            to review events through special notifications or exclusive links.
          </p>
          <p>
            As a <strong>VIP subscriber</strong>, you are eligible to receive a{" "}
            <strong>VIP reward pouch</strong>, which includes sample products
            from partner brands - delivered once during your subscription
            period, typically after completing around <strong>29-30 review
            tasks</strong>.
          </p>
          <p>
            Upon reaching VIP6 status, your <strong>withdrawal limit</strong> is
            raised to <strong>Rs35,00,000</strong>. For withdrawals exceeding
            this amount, <strong>activation of a private VIP withdrawal
            tunnel</strong> is required for enhanced security.
          </p>
          <p>
            All final interpretations of these benefits are at the sole
            discretion of the company.
          </p>
        </div>
      </div>
    </main>
  );
}
