"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";

// Place your 4 JPG images in: frontend/public/images/last-event/
// Name them: 1.jpg, 2.jpg, 3.jpg, 4.jpg
const LAST_EVENT_ITEMS = [
  { src: "/images/last-event/1.jpg", title: "Event 1" },
  { src: "/images/last-event/2.jpg", title: "Event 2" },
  { src: "/images/last-event/3.jpg", title: "Event 3" },
  { src: "/images/last-event/4.jpg", title: "Event 4" },
] as const;

export default function LastEventPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-slate-100 flex flex-col pb-8">
      {/* Header: back + Last Event title (centered) */}
      <header className="sticky top-0 z-10 flex items-center gap-3 bg-white px-4 py-4 shadow-sm border-b border-slate-200">
        <button
          type="button"
          onClick={() =>
            typeof window !== "undefined" && window.history.length > 1
              ? router.back()
              : router.push("/dashboard")
          }
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-slate-700 transition-colors hover:bg-slate-100"
          aria-label="Back"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="flex-1 text-center text-xl font-bold text-slate-900 pr-10">
          User Last Event
        </h1>
      </header>

      {/* Vertical stack of banner cards */}
      <section className="flex flex-col gap-4 px-4 pt-4">
        {LAST_EVENT_ITEMS.map((item, i) => (
          <article
            key={item.src}
            className="rounded-xl overflow-hidden bg-white shadow-md border border-slate-200"
          >
            <div className="relative w-full bg-slate-100">
              <Image
                src={item.src}
                alt={item.title}
                width={1200}
                height={800}
                className="w-full h-auto object-contain"
                sizes="100vw"
              />
            </div>
            <div className="px-4 py-3 border-t border-slate-100">
              <h2 className="text-base font-semibold text-slate-900">{item.title}</h2>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
