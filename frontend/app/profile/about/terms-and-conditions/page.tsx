"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const EEA_AUTHORITIES_URL = "https://edpb.europa.eu/about-edpb/board/members_en";

export default function TermsAndConditionsPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem("adminEmail");
    const remembered = window.localStorage.getItem("adminRemember");
    if (!saved && remembered !== "true") router.replace("/login");
    else setMounted(true);
  }, [router]);

  if (!mounted) return null;

  return (
    <main className="min-h-screen bg-white dark:bg-slate-900">
      <header className="sticky top-0 z-20 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
        <div className="flex min-h-[3.5rem] items-center justify-center px-4">
          <button
            type="button"
            onClick={() => (typeof window !== "undefined" && window.history.length > 1 ? router.back() : router.push("/profile/about"))}
            className="absolute left-4 flex h-10 w-10 items-center justify-center rounded-lg text-slate-900 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700/50"
            aria-label="Back to About Us"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            Terms & Conditions
          </h1>
        </div>
      </header>

      <div className="fp-container py-6 pb-12">
        <article className="prose prose-slate dark:prose-invert max-w-none text-sm text-slate-800 dark:text-slate-200">
          {/* Biometric Data Policy (Illinois Residents Only) */}
          <h2 className="mb-3 mt-4 text-base font-bold text-slate-900 dark:text-slate-100">
            Biometric Data Policy (Illinois Residents Only)
          </h2>
          <p className="mb-4 leading-relaxed">
            FreightPOP collects, uses, retains, and securely disposes of biometric data for health, safety, security, and administrative functions. We retain biometric data for no longer than one year, or as required by law. This policy applies to Illinois residents who furnish biometric data to FreightPOP. We will not sell, lease, or trade your biometric data. We may disclose biometric data only where required by law or with your consent. For more information on our handling of biometric data, please contact us.
          </p>

          {/* Washington Residents Only */}
          <h2 className="mb-2 mt-6 text-base font-bold text-slate-900 dark:text-slate-100">
            Washington Residents Only
          </h2>
          <p className="mb-4 leading-relaxed">
            Please read the{" "}
            <Link
              href="/profile/about/privacy-policy"
              className="text-primary underline hover:no-underline"
            >
              Washington State Consumer Health Data Privacy Policy
            </Link>{" "}
            for additional information about the processing of your personal data and your privacy rights.
          </p>

          {/* Security */}
          <h2 className="mb-3 mt-6 text-base font-bold text-slate-900 dark:text-slate-100">
            Security
          </h2>
          <p className="mb-4 leading-relaxed">
            We are committed to protecting your personal information through appropriate technical and organizational measures. We provide a level of security appropriate to the risk of processing your personal information. For more information on how FreightPOP protects your personal information, please contact us.
          </p>

          {/* Your data privacy rights */}
          <h2 className="mb-3 mt-6 text-base font-bold text-slate-900 dark:text-slate-100">
            Your data privacy rights
          </h2>
          <p className="mb-3">
            Depending on applicable law, you may have certain rights with respect to your personal information.
          </p>

          <ul className="list-disc space-y-3 pl-5">
            <li className="leading-relaxed">
              You may have the right to <strong>access, correct, update or request deletion</strong> of your personal information.
            </li>
            <li className="leading-relaxed">
              You can <strong>object</strong> to the processing of your personal information, ask us to <strong>restrict</strong> processing of your personal information or request <strong>portability</strong> of your personal information.
            </li>
            <li className="leading-relaxed">
              You may have the right <strong>not to have a decision made about you that is based solely on automated processing, including profiling</strong>, if that decision produces legal effects about you or significantly affects you.
            </li>
            <li className="leading-relaxed">
              If we have collected and processed your personal information with your consent, you can <strong>withdraw your consent at any time</strong>. Withdrawing your consent will not affect the lawfulness of any processing we conducted prior to your withdrawal, nor will it affect processing of your personal information conducted in reliance on lawful processing grounds other than consent.
            </li>
            <li className="leading-relaxed">
              You may have the right to <strong>opt out of the sale</strong> of your personal information. FreightPOP does not sell your personal information to third parties for profit. However, we do share or otherwise disclose your personal information to third parties in accordance with our Privacy Statement and our{" "}
              <Link
                href="/profile/about/cookie-notice"
                className="text-primary underline hover:no-underline"
              >
                Cookie Notice
              </Link>
              . For example, we may share your information with third parties who distribute our products, provide technical assistance, use analytical tools to help us improve our services, or conduct marketing or sales efforts on our behalf. In some jurisdictions, such disclosure may be considered a &quot;sale&quot; of your personal information under applicable data protection laws.
            </li>
            <li className="leading-relaxed">
              You have the right to <strong>complain</strong> to a data protection authority responsible for overseeing compliance with data protection law in your jurisdiction. Individuals in the European Economic Area (EEA) may lodge a complaint with the competent Data Protection Authority. A list of EEA data protection authorities is available at:{" "}
              <a
                href={EEA_AUTHORITIES_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline hover:no-underline break-all"
              >
                {EEA_AUTHORITIES_URL}
              </a>
              . Individuals in Texas have the right to lodge a complaint with the <strong>Texas State Attorney General</strong>.
            </li>
          </ul>

          <p className="mt-6 leading-relaxed">
            We would however appreciate the opportunity to address your concerns. Please feel free to contact us regarding any complaint you may have. We will not discriminate against you for exercising any of your privacy rights.
          </p>
        </article>
      </div>
    </main>
  );
}
