"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function ProfileAboutHelpCompanyProfilePage() {
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
            <div className="h-5 w-28 rounded bg-slate-200 dark:bg-slate-600" />
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
            Company Profile
          </h1>
        </div>
      </header>

      <div className="fp-container py-5">
        <div className="mx-auto max-w-md bg-white px-4 py-4 text-[20px] leading-tight text-black dark:bg-slate-800 dark:text-slate-100">
          <p>
            <strong>The Honeywell Platform</strong> Honeywell merges the three
            pillars of e-commerce acceleration - <strong>Enablement, Intelligence, and
            Demand</strong> - into one all-encompassing platform to drive your
            growth worldwide.
          </p>
          <p>
            <strong>Streamlined Merchant Experience</strong>
          </p>
          <p>
            Honeywell makes it simple for merchants to sell worldwide by
            managing all aspects of global e-commerce trading for them. We
            cover it all, while you focus on your brand and stay in control.
          </p>
          <p>
            <strong>End-to-end Operations</strong>
          </p>
          <p>
            Honeywell platform covers all international logistics by leveraging
            our robust worldwide ecosystem, including global and local carriers,
            fulfilment services, and PSPs.
          </p>
          <p>
            <strong>Regulations and Tax Compliance</strong>
          </p>
          <p>
            We manage country restrictions and import processing, to keep your
            international e-commerce store compliant and up-to-date with local
            regulations in every market.
          </p>
          <p>
            <strong>Merchant Support</strong>
          </p>
          <p>
            We work closely with you, providing ongoing reporting, guidance,
            and best practice recommendations as well as technical support, to
            accommodate your business needs and constantly optimise your
            results.
          </p>
          <p>
            <strong>Self-Management Tools</strong>
          </p>
          <p>
            Our merchant portal gives you a full view and control of your
            e-commerce activity. Easily track your performance and manage your
            proposition in over 200 markets from one place.
          </p>
          <p>
            <strong>Proprietary Global Insights to Maximise Your Growth</strong>
          </p>
          <p>
            Leverage our exclusive and massive global dataset, to optimise your
            performance in every market. Our data-driven market know-how
            generated from billions of transactions made through the Honeywell
            platform, enables you to tailor your offering to local preferences
            and global market trends.
          </p>
          <p>
            <strong>Ongoing Analysis to Optimise Your Performance</strong>
          </p>
          <p>
            Honeywell equips you with industry benchmarks and performance
            analysis, and recommends ways to improve your results. The Honeywell
            platform constantly tracks global shopping trends, providing
            merchants with market intelligence to help them make informed
            decisions, boost ecommerce conversions, and accelerate
            profitability.
          </p>
          <p>
            <strong>Dedicated Guidance to Drive Your Success</strong>
          </p>
          <p>
            Our team of Honeywell experts provides ongoing consulting and
            recommendations based on our extensive data and insights to
            accelerate your global online growth. We work closely with you to
            help you reach your business goals and capitalise on new
            opportunities.
          </p>
          <p>
            <strong>Scale Up Your Digital Marketing</strong>
          </p>
          <p>
            Boost traffic and grow your customer base in markets with
            identified growth potential through our A-Z acquisition service. Run
            targeted localised campaigns in every market, combining
            comprehensive media strategies, local consumer behaviour analysis,
            and digital trends insights.
          </p>
        </div>
      </div>
    </main>
  );
}
