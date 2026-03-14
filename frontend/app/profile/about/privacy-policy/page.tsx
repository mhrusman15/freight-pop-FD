"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function PrivacyPolicyPage() {
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
        <div className="flex min-h-[3rem] items-center justify-center px-4">
          <Link
            href="/profile/about"
            className="absolute left-4 flex items-center text-slate-900 dark:text-slate-100 hover:text-slate-600 dark:hover:text-slate-300"
            aria-label="Back to About Us"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">Privacy Policy</h1>
        </div>
      </header>

      <div className="fp-container py-6">
        <article className="prose prose-slate dark:prose-invert max-w-none text-sm text-slate-800 dark:text-slate-200">
          <p className="mb-6 text-slate-600 dark:text-slate-400">Last updated September 1st, 2025</p>

          <h2 className="mb-3 mt-6 text-base font-bold text-slate-900 dark:text-slate-100">Introduction</h2>
          <p className="mb-4">
            <strong>FreightPOP</strong> International Inc. or its <Link href="#" className="text-primary underline hover:no-underline">affiliates</Link> (collectively, &quot;<strong>FreightPOP</strong>&quot;, &quot;<strong>our</strong>&quot;, &quot;<strong>us</strong>&quot; or &quot;<strong>we</strong>&quot;) are committed to protecting your personal information. This privacy statement describes how FreightPOP, as a <strong>data controller</strong>, collects, shares, discloses, uses, and transfers (&quot;<strong>process</strong>&quot;) your personal information, and how you can exercise your data privacy rights. The type of personal information we collect depends on how you interact with our websites, products, services, and applications (collectively, our &quot;<strong>Services</strong>&quot;). This statement does not apply when we process personal information on behalf of our customers as a &quot;data processor&quot;. For more information about how we process information on behalf of our customers, please see &quot;Information we process on behalf of our customers&quot; below. We may provide additional privacy notices or choices in connection with specific processing activities.
          </p>

          <h2 className="mb-3 mt-6 text-base font-bold text-slate-900 dark:text-slate-100">Our collection of information</h2>
          <p className="mb-3">We may collect the following personal information from you when you interact with us:</p>
          <ul className="list-disc space-y-3 pl-5">
            <li>
              <strong>Identity data</strong>, such as your name, title, company/organization name, e-mail address, telephone numbers and physical address (including street, city, state, postal or zip code, and/or country or region) and government identifiers.
            </li>
            <li>
              <strong>Business contact data</strong>, such as information related to other employees, owners, directors, officers, or contractors of a third-party organization (e.g., business, company, partnership, sole proprietorship, non-profit, or government agency). This information may be provided directly by you or indirectly by a third party (e.g., if you are employed by a customer or supplier of ours or where your information has been shared with us for a legitimate business purpose).
            </li>
            <li>
              <strong>Registration data</strong>, provided by you (including username and password) when you register an account on our websites, portal or a mobile application to use our Services, or to receive communications, download content, sign up for an event, webinar, training, certification or survey.
            </li>
            <li>
              <strong>Marketing, communications data and social listening</strong>, including your marketing preferences, your subscriptions to our publications and we analyze and monitor conversation streams and monitor publicly available opinions, statements or other interactions on social media channels (e.g., LinkedIn) to understand sentiment, intent, mood and market trends and our customers&apos; needs and to improve our Services.
            </li>
            <li>
              <strong>Transaction data</strong>, such as inquiries about orders for our Services and billing information, including purchase order history. Not providing this information may prevent us from providing our Services or completing the transaction.
            </li>
            <li>
              <strong>Communications content and recordings</strong>, such as emails, calls, recordings and transcriptions, texts, chats, voice and logs from your communications with us, including through AI-supported channels. We may collect this when you email us, call us, interact with other FreightPOP users, sign up for our mailing lists, complete forms on our websites, interact with our social media pages (e.g., product reviews or testimonials), participate in online discussion groups, web-conferences, or public-facing comment fields, blogs or community forums sponsored by or affiliated with FreightPOP. We collect and maintain contact details, communications and interactions, your posts or submissions, and our responses. Third-party service providers and partners may also collect information you submit through our websites and online services, web-conference platforms, chat functions, or virtual assistants, and maintain records related to customer support requests.
            </li>
            <li>
              <strong>Usage data</strong>, such as license consumption data, information about how you use our Services, what pages you view, the number of bytes transferred, the links you click, the materials you access, the date and time you access the Services, the website from which you linked to one of our Services and other actions taken within the Services. See our <Link href="/profile/about/cookie-notice" className="text-primary underline hover:no-underline">Cookie Notice</Link> for more information on cookies and similar tracking technologies.
            </li>
            <li>
              <strong>Device data</strong>, such as your IP address, device identifier, service provider, browser and device type, capabilities and language, operating system and other technical information about your device.
            </li>
            <li>
              <strong>Your feedback</strong>, such as surveys, recommendations, or other feedback from you about our Services.
            </li>
            <li>
              <strong>Financial information</strong>, such as credit card, bank account information or other financial information for the purpose of enabling us to facilitate your purchase of FreightPOP Services.
            </li>
            <li>
              <strong>Export control and sanctions information</strong>, such as your nationality, citizenship and country or region of residence to determine your eligibility under export control and sanction regulations related to certain technologies.
            </li>
            <li>
              <strong>Geo-location information</strong>. We may collect precise, real-time location information from your mobile device with your consent to facilitate your use of our Services. This data may be processed by our service providers. You may withdraw or adjust your consent at any time through your device settings.
            </li>
            <li>
              <strong>Biometric data</strong>, such as voice, fingerprint, and facial recognition for health, safety, authentication, security, and other administrative functions, where we have obtained your explicit consent for specified purposes.
            </li>
            <li>
              <strong>Emergency contact information</strong>, such as name, telephone number, email address, and relationship, provided directly by you or indirectly by another individual (e.g., spouse, guardian, employer) for emergency contact purposes.
            </li>
            <li>
              <strong>Information collected from third parties</strong>, such as from social media (e.g., LinkedIn, Meta, Twitter), business intelligence applications (e.g., ZoomInfo), and third-party risk management services (e.g., Certa). We may combine this with other information we hold to improve our Services, customize your experience, and for other purposes described in this Privacy Statement. We may also collect business contact information from your employer or other third parties for business activities and administrative matters.
            </li>
            <li>
              <strong>Information we process on behalf of our customers</strong>. Customers who use our Services may collect personal information and provide it to us for processing on their behalf. We process this information in accordance with our customer contracts. We are not responsible for the privacy or data security practices of our customers.
            </li>
            <li>
              <strong>Recruitment data</strong>, such as information you submit in connection with job applications or inquiries.
            </li>
            <li>
              <strong>Video surveillance</strong>, such as photos, images, or audio or video captured or recorded via CCTV or other security or monitoring systems where legally permitted, or captured during site visits or marketing or public events.
            </li>
          </ul>

          <p className="mb-4 mt-4">
            We may retain special categories of personal information such as health, race, and ethnicity only where permitted or required by law or with your consent. We retain your personal information for as long as necessary for the purposes described in this statement. When no longer needed, we anonymize, delete, or securely destroy it.
          </p>

          <h2 className="mb-3 mt-6 text-base font-bold text-slate-900 dark:text-slate-100">Our use of information</h2>
          <p className="mb-3">We may use your personal information for the following purposes:</p>
          <ul className="list-disc space-y-3 pl-5">
            <li>
              <strong>Business contact data:</strong> For communications, transactions, due diligence, managing orders, contracts, warranties, credit analysis, and compliance. FreightPOP may collect and use this business contact data for these purposes.
            </li>
            <li>
              <strong>Procurement and contract management data:</strong> For the creation, execution, and management of contracts, tenders, leases, purchase orders, and storing contracts in our systems (e.g., Salesforce and SAP).
            </li>
            <li>
              <strong>Account management, services and transactions:</strong> To deliver our Services, personalize your experience, register products, process orders, warranty claims, and customer service.
            </li>
            <li>
              <strong>Administering and protecting our business and Services:</strong> Including tracking website use, verifying activity, fraud investigation, cybercrime prevention, troubleshooting, system maintenance, support, reporting, and data hosting.
            </li>
            <li>
              <strong>Improving our business and Services:</strong> For business analyses, developing and improving our Services, and customizing your experience.
            </li>
            <li>
              <strong>Compliance:</strong> To meet legal obligations, record-keeping, export control, customs, customer/supplier/third-party screening, and preventing financial crime (e.g., money laundering) and sanctions violations, and to comply with policies and industry standards.
            </li>
            <li>
              <strong>Marketing:</strong> To inform you about our products, services, events, news, surveys, and special offers. You may opt out of email marketing at any time.
            </li>
          </ul>

          <h2 className="mb-3 mt-6 text-base font-bold text-slate-900 dark:text-slate-100">Disclosure of information</h2>
          <p className="mb-3">We may share your personal information in the following circumstances:</p>
          <ul className="list-disc space-y-3 pl-5">
            <li>
              <strong>Our group companies:</strong> We share information with our affiliates and group companies for the purposes described in this Privacy Statement.
            </li>
            <li>
              <strong>Service providers:</strong> We share information with companies that provide services on our behalf (e.g., hosting, surveys, transaction processing, analysis) under confidentiality obligations.
            </li>
            <li>
              <strong>Distributors and other trusted business partners:</strong> We share information with third parties who distribute our products and conduct marketing communications, in accordance with applicable law.
            </li>
            <li>
              <strong>Disclosure in connection with transactions:</strong> We may share information with financial institutions, government entities, and shipping or postal services to fulfill transactions.
            </li>
            <li>
              <strong>Disclosures in connection with acquisitions or divestitures:</strong> We may share information in connection with the sale, merger, reorganization, or transfer of assets of FreightPOP or our affiliates.
            </li>
            <li>
              <strong>Disclosure for other reasons:</strong> We may disclose information when required or permitted by law, to comply with legal process, to protect our rights or property, or to protect the personal safety of our users or the public.
            </li>
          </ul>

          <h2 className="mb-3 mt-6 text-base font-bold text-slate-900 dark:text-slate-100">International transfers</h2>
          <p className="mb-4">
            Your personal information may be transferred to and processed in countries other than your country of residence. We take appropriate safeguards to ensure that such transfers comply with applicable data protection laws.
          </p>
        </article>
      </div>
    </main>
  );
}
