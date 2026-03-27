"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function ProfileAboutHelpAboutUsPage() {
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
            About Us
          </h1>
        </div>
      </header>

      <div className="fp-container py-5">
        <div className="mx-auto max-w-md bg-white px-4 py-4 text-[20px] leading-tight text-black dark:bg-slate-800 dark:text-slate-100">
          <p>
            We create an <strong>intelligent, connected supply chain</strong>,
            empowering businesses to operate with{" "}
            <strong>greater visibility, traceability, and efficiency</strong>.
          </p>
          <p>
            <strong>Freight-pop</strong> simplifies the complexities of supply
            chain operations, bridging the gap between physical processes and{" "}
            <strong>digital intelligence</strong> to help companies deliver with{" "}
            <strong>confidence</strong> and accuracy. From production lines to
            the hands of consumers, <strong>Zetes</strong> ensures every step is{" "}
            <strong>optimized and transparent</strong>.
          </p>
          <p>
            The trusted partner of enterprises across Europe and beyond,
            Freight-pop sets the standard in <strong>supply chain digitization</strong>{" "}
            and operational excellence.
          </p>
          <p>
            <strong>Smart Supply Chains are Powered by Freight-pop.</strong>
          </p>
          <p>
            <strong>Customer Obsessed</strong>
          </p>
          <p>
            <strong>Our partners' performance is our purpose:</strong>
          </p>
          <p>
            At Freight-pop, we work closely with our clients to understand their{" "}
            <strong>specific challenges</strong>, adapting our solutions to suit
            each operation. We are committed to enhancing their supply chains,
            enabling <strong>real-time visibility, regulatory compliance, and
            superior service delivery</strong> across all touchpoints.
          </p>
          <p>
            <strong>Innovation</strong>
          </p>
          <p>
            <strong>Driving the digital transformation of supply chains:</strong>
          </p>
          <p>
            Through our <strong>advanced identification technologies, mobility
            platforms, and cloud-based visibility solutions</strong>, we enable{" "}
            <strong>smarter, faster, and more sustainable operations</strong>.
            Our innovation is continuous - driven by <strong>data, insight, and
            the evolving needs of our clients</strong>.
          </p>
          <p>
            <strong>Team Focused</strong>
          </p>
          <p>
            <strong>Our people make it happen:</strong>
          </p>
          <p>
            Freight-pop unites talent from across <strong>Europe</strong>,
            bringing together a <strong>diverse group of professionals</strong>{" "}
            who are passionate about <strong>problem-solving and performance</strong>.
            Our culture fosters <strong>collaboration, creativity, and
            accountability</strong>, empowering our teams to deliver impact at
            every level.
          </p>
          <p>
            <strong>Sustainability</strong>
          </p>
          <p>
            <strong>Responsibility in every link of the chain:</strong>
          </p>
          <p>
            We are committed to building greener supply chains by{" "}
            <strong>reducing waste, digitizing paper-heavy processes</strong>,
            and supporting our clients in adopting <strong>sustainable
            packaging and logistics practices</strong>. Internally, we focus on
            minimizing our own footprint through <strong>smarter, cleaner
            operations</strong>.
          </p>
          <p>
            <strong>Community</strong>
          </p>
          <p>
            <strong>Investing in the places we live and work:</strong>
          </p>
          <p>
            Freight-pop supports local communities through{" "}
            <strong>active partnerships, volunteering</strong>, and inclusive
            hiring practices. We collaborate with{" "}
            <strong>educational and nonprofit organizations</strong>, helping to{" "}
            <strong>create opportunities</strong> and uplift those around us.
          </p>
        </div>
      </div>
    </main>
  );
}
