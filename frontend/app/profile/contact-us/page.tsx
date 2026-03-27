"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";

export default function ContactUsPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-white">
      <section className="mx-auto w-full max-w-md bg-white">
        <header className="flex min-h-[3.5rem] items-center justify-center px-4">
          <button
            type="button"
            onClick={() =>
              typeof window !== "undefined" && window.history.length > 1
                ? router.back()
                : router.push("/profile")
            }
            className="absolute left-4 flex h-10 w-10 items-center justify-center rounded-lg text-slate-900 hover:bg-slate-100"
            aria-label="Back to profile"
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
          <h1 className="text-lg font-semibold text-black">Contact Us</h1>
        </header>

        <div className="relative h-[300px] w-full overflow-hidden sm:h-[360px]">
          <Image
            src="/images/login-hero.jpg"
            alt="Contact background"
            fill
            priority
            sizes="(max-width: 448px) 100vw, 448px"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-white/65" />
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white to-transparent" />
        </div>

        <div className="px-4 pb-10 text-center sm:px-6 sm:pb-12">
          <h2 className="text-2xl font-semibold leading-tight text-black sm:text-3xl">Customer Live Chat</h2>
          <p className="mt-3 text-base leading-relaxed text-black sm:text-lg">
            Need to get in touch with us? Click button below link to our customer live chat
          </p>

          <button
            type="button"
            className="mx-auto mt-6 flex w-full max-w-[270px] items-center justify-center gap-3 rounded-lg bg-[#0f78b6] px-4 py-3 text-lg font-semibold text-white shadow sm:mt-8 sm:text-xl"
          >
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#2ca4df]">
              <svg viewBox="0 0 24 24" className="h-5 w-5 fill-white" aria-hidden>
                <path d="M22 4.01 18.56 20.24c-.26 1.15-.94 1.43-1.91.89l-5.28-3.89-2.55 2.45c-.28.28-.52.52-1.06.52l.38-5.39 9.81-8.86c.43-.38-.09-.59-.66-.21L5.17 13.39.96 12.07c-1.15-.36-1.17-1.15.24-1.7L20.2 3.05c.88-.33 1.65.21 1.8.96z" />
              </svg>
            </span>
            Telegram
          </button>
        </div>
      </section>
    </main>
  );
}

