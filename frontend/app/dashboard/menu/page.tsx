import Image from "next/image";
import Link from "next/link";

// Shared outline-style icons – same as dashboard for consistency
const IconStar = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
);
const IconProfile = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path fillRule="evenodd" d="M12 2C9.79 2 8 3.79 8 6s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0 6c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" clipRule="evenodd" />
  </svg>
);
const IconHome = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);
const IconCalendarCheck = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
    <path d="M9 16l2 2 4-4" />
  </svg>
);
const IconCalendarStar = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
    <path d="M12 14l1.5 3 3.5-.5-2.5 2.5.5 3.5-3-1.5-3 1.5.5-3.5-2.5-2.5 3.5.5L12 14z" />
  </svg>
);
const IconHeadset = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
    <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
  </svg>
);
const IconDocument = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
);
const IconChevronRight = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

export default function DashboardMenuPage() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      {/* Blurred background */}
      <div className="fixed inset-0 z-0">
        <Image
          src="/images/login-hero.jpeg"
          alt=""
          fill
          className="object-cover blur-md scale-105"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-slate-900/40" />
      </div>

      <div className="relative z-10 flex min-h-screen flex-col">
        {/* Header: freightPOP + star, profile, close */}
        <header className="flex items-center justify-between px-4 py-4">
          <h1 className="text-xl font-bold tracking-tight text-red-500">
            freightPOP
          </h1>
          <div className="flex items-center gap-2 text-white">
            <Link
              href="/dashboard/credit-score"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-black/30 backdrop-blur-sm transition-opacity hover:bg-black/40"
              aria-label="Credit score"
            >
              <IconStar className="h-4 w-4" />
            </Link>
            <Link
              href="/dashboard/menu"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-black/40 backdrop-blur-sm ring-2 ring-white/50"
              aria-label="Profile menu"
            >
              <IconProfile className="h-5 w-5" />
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-black/30 backdrop-blur-sm transition-opacity hover:bg-black/40"
              aria-label="Close menu"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </Link>
          </div>
        </header>

        {/* Menu cards */}
        <div className="flex-1 px-4 pb-8 space-y-4">
          {/* NAVIGATION – Dashboard & Profile active */}
          <div className="rounded-xl bg-white/95 shadow-lg overflow-hidden">
            <p className="px-4 pt-4 text-xs font-semibold tracking-wider text-slate-500 uppercase">
              Navigation
            </p>
            <div className="divide-y divide-slate-100">
              <Link
                href="/dashboard"
                className="flex items-center gap-3 px-4 py-3 bg-slate-50 text-slate-900 font-medium"
              >
                <IconHome className="h-5 w-5 flex-shrink-0 text-slate-700" />
                <span>Dashboard</span>
                <IconChevronRight className="ml-auto h-5 w-5 flex-shrink-0 text-slate-400" />
              </Link>
              <Link
                href="/dashboard/menu"
                className="flex items-center gap-3 px-4 py-3 bg-slate-50 text-slate-900 font-medium"
              >
                <IconProfile className="h-5 w-5 flex-shrink-0 text-slate-700" />
                <span>Profile</span>
                <IconChevronRight className="ml-auto h-5 w-5 flex-shrink-0 text-slate-400" />
              </Link>
            </div>
          </div>

          {/* GENERAL */}
          <div className="rounded-xl bg-white/95 shadow-lg overflow-hidden">
            <p className="px-4 pt-4 text-xs font-semibold tracking-wider text-slate-500 uppercase">
              General
            </p>
            <div className="divide-y divide-slate-100">
              <Link href="/dashboard/daily-check-in" className="flex items-center gap-3 px-4 py-3 text-slate-700 hover:bg-slate-50">
                <IconCalendarCheck className="h-5 w-5 flex-shrink-0 text-slate-600" />
                <span>Daily Check-In</span>
                <IconChevronRight className="ml-auto h-5 w-5 flex-shrink-0 text-slate-400" />
              </Link>
              <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 text-slate-700 hover:bg-slate-50">
                <IconCalendarStar className="h-5 w-5 flex-shrink-0 text-slate-600" />
                <span>Last Event</span>
                <IconChevronRight className="ml-auto h-5 w-5 flex-shrink-0 text-slate-400" />
              </Link>
              <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 text-slate-700 hover:bg-slate-50">
                <IconHeadset className="h-5 w-5 flex-shrink-0 text-slate-600" />
                <span>Contact Us</span>
                <IconChevronRight className="ml-auto h-5 w-5 flex-shrink-0 text-slate-400" />
              </Link>
            </div>
          </div>

          {/* INFO */}
          <div className="rounded-xl bg-white/95 shadow-lg overflow-hidden">
            <p className="px-4 pt-4 text-xs font-semibold tracking-wider text-slate-500 uppercase">
              Info
            </p>
            <div className="divide-y divide-slate-100">
              <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 text-slate-700 hover:bg-slate-50">
                <IconDocument className="h-5 w-5 flex-shrink-0 text-slate-600" />
                <span>T&C</span>
                <IconChevronRight className="ml-auto h-5 w-5 flex-shrink-0 text-slate-400" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
