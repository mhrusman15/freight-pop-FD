"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";

const TELEGRAM_LINK = "https://t.me/your_support"; // Replace with your Telegram link

export default function ContactUsPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-slate-100 flex flex-col items-center py-6 px-4">
      {/* Header: freightPOP + back */}
      <header className="w-full max-w-md flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold tracking-tight text-red-500">
          User Contact Us
        </h1>
        <button
          type="button"
          onClick={() =>
            typeof window !== "undefined" && window.history.length > 1
              ? router.back()
              : router.push("/dashboard")
          }
          className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-200 text-slate-700 transition-colors hover:bg-slate-300"
          aria-label="Back"
        >
          <svg
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </header>

      {/* First half: hero image strip (like login) */}
      <section className="w-full max-w-md overflow-hidden rounded-xl bg-white shadow-md relative h-56">
        <Image
          src="/images/login-hero.jpg"
          alt=""
          fill
          className="object-cover"
          sizes="(max-width: 448px) 100vw, 448px"
          priority
        />
      </section>

      {/* Second half: content card overlapping */}
      <section className="w-full max-w-md -mt-8 rounded-2xl bg-white shadow-lg border border-slate-200 px-6 pb-8 pt-8">
        <h2 className="text-xl font-bold text-slate-900">
          Customer Live Chat
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Need to get in touch with us? Click button below link to our
          customer live chat.
        </p>
        <a
          href={TELEGRAM_LINK}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3.5 text-base font-semibold text-white shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <svg
            className="h-5 w-5 shrink-0"
            fill="currentColor"
            viewBox="0 0 24 24"
            aria-hidden
          >
            <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
          </svg>
          Telegram
        </a>
      </section>
    </main>
  );
}
