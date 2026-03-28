"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { getUserData } from "@/lib/auth-store";
import { userApi } from "@/lib/api";

// Rewards / gift logo located at frontend/public/images/gift.png
const REWARDS_GIFT_IMAGE = "/images/gift.png";
const MAX_CHECKIN_ROUNDS = 7;
/** Banner always shows this; real admin reward appears only in the check-in success modal. */
const BANNER_REWARD_DISPLAY = 1000;

function ordinal(n: number): string {
  if (n % 100 >= 11 && n % 100 <= 13) return `${n}th`;
  if (n % 10 === 1) return `${n}st`;
  if (n % 10 === 2) return `${n}nd`;
  if (n % 10 === 3) return `${n}rd`;
  return `${n}th`;
}

export default function DailyCheckInPage() {
  const router = useRouter();
  const authUser = getUserData();
  const storageKey = useMemo(
    () =>
      authUser?.id
        ? `fp_daily_checkin_progress_${authUser.id}`
        : "fp_daily_checkin_progress_guest",
    [authUser?.id],
  );
  const [claimedRounds, setClaimedRounds] = useState(0);
  const [lastClaimedGrantAt, setLastClaimedGrantAt] = useState<string | null>(null);
  const [baselineGrantAt, setBaselineGrantAt] = useState<string | null>(null);
  const [pendingGrantAt, setPendingGrantAt] = useState<string | null>(null);
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [showCheckInFailed, setShowCheckInFailed] = useState(false);
  const [failedMessage, setFailedMessage] = useState("Need to complete 1st round of task to sign");
  const [modalRewardAmount, setModalRewardAmount] = useState(BANNER_REWARD_DISPLAY);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as {
        claimedRounds?: number;
        lastClaimedGrantAt?: string | null;
        baselineGrantAt?: string | null;
      };
      setClaimedRounds(Math.max(0, Math.min(MAX_CHECKIN_ROUNDS, Number(parsed.claimedRounds || 0))));
      setLastClaimedGrantAt(parsed.lastClaimedGrantAt || null);
      setBaselineGrantAt(parsed.baselineGrantAt || null);
    } catch {
      // Ignore invalid storage payloads.
    }
  }, [storageKey]);

  const formatRewardDisplay = (n: number) => {
    const x = Number(n);
    if (!Number.isFinite(x)) return "0";
    return Number.isInteger(x) ? String(x) : x.toFixed(2);
  };

  /** API / DB may send numbers as strings; normalize for the reward modal. */
  const coerceRewardAmount = (value: unknown): number | null => {
    if (value == null) return null;
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string" && value.trim() !== "") {
      const n = Number(value);
      return Number.isFinite(n) ? n : null;
    }
    return null;
  };

  const persistProgress = (
    nextClaimedRounds: number,
    nextLastClaimedGrantAt: string | null,
    nextBaselineGrantAt: string | null,
  ) => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(
        storageKey,
        JSON.stringify({
          claimedRounds: nextClaimedRounds,
          lastClaimedGrantAt: nextLastClaimedGrantAt,
          baselineGrantAt: nextBaselineGrantAt,
        }),
      );
    } catch {
      // Ignore storage write issues.
    }
  };

  const showNextRoundError = (nextRound: number) => {
    const cappedRound = Math.max(1, Math.min(MAX_CHECKIN_ROUNDS, nextRound));
    setFailedMessage(`Need to complete ${ordinal(cappedRound)} round of task to sign`);
    setShowCheckInFailed(true);
  };

  const handleCheckInClick = () => {
    userApi.getTaskStatus().then((res) => {
      const status = res.data;
      const grantAt = status?.taskAssignmentGrantedAt ?? null;
      // For new users, treat current assignment as baseline so reward does not show immediately.
      if (!baselineGrantAt && claimedRounds === 0 && grantAt) {
        setBaselineGrantAt(grantAt);
        persistProgress(claimedRounds, lastClaimedGrantAt, grantAt);
      }

      const firstClaimBaseline = baselineGrantAt || grantAt;
      const canClaimForCurrentAssignment =
        Boolean(status?.signInRewardFromAdmin) &&
        Boolean(grantAt) &&
        grantAt !== (claimedRounds === 0 ? firstClaimBaseline : lastClaimedGrantAt) &&
        Number(status?.quotaUsed ?? 0) === 0 &&
        Number(status?.remaining ?? 0) > 0 &&
        !Boolean(status?.requiresAdminAssignment) &&
        claimedRounds < MAX_CHECKIN_ROUNDS;

      if (canClaimForCurrentAssignment) {
        const amt = coerceRewardAmount(status?.signInRewardAmount);
        const resolved = amt != null && amt >= 0 ? amt : BANNER_REWARD_DISPLAY;
        setModalRewardAmount(resolved);
        setPendingGrantAt(grantAt);
        setShowRewardModal(true);
        return;
      }

      const requiredRound = Math.min(claimedRounds + 1, MAX_CHECKIN_ROUNDS);
      showNextRoundError(requiredRound);
    }).catch(() => {
      const requiredRound = Math.min(claimedRounds + 1, MAX_CHECKIN_ROUNDS);
      showNextRoundError(requiredRound);
    });
  };

  const handleRewardConfirm = () => {
    const nextClaimed = Math.min(MAX_CHECKIN_ROUNDS, claimedRounds + 1);
    const nextLastGrant = pendingGrantAt;
    setClaimedRounds(nextClaimed);
    setLastClaimedGrantAt(nextLastGrant);
    const nextBaseline = baselineGrantAt || nextLastGrant;
    setBaselineGrantAt(nextBaseline);
    persistProgress(nextClaimed, nextLastGrant, nextBaseline);
    setShowRewardModal(false);
  };

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <div className="flex flex-col min-h-screen">
        {/* Top bar: back + title */}
        <header className="flex items-center gap-3 bg-white px-4 py-4 shadow-sm">
          <button
            type="button"
            onClick={() => (typeof window !== "undefined" && window.history.length > 1 ? router.back() : router.push("/dashboard"))}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-slate-700 transition-colors hover:bg-slate-100"
            aria-label="Back to dashboard"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="flex-1 text-center text-xl font-bold text-slate-900 pr-10">
            User Daily Check-In
          </h1>
        </header>

        {/* Banner with background + freightPOP branding */}
        <section className="relative h-44 w-full overflow-hidden">
          <Image
            src="/images/login-hero.jpg"
            alt=""
            fill
            className="object-cover opacity-80"
            sizes="100vw"
            priority
          />
          <div className="absolute inset-0 bg-slate-900/30" />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-3xl font-bold tracking-tight text-red-500 drop-shadow-lg">
              freightPOP
            </span>
          </div>
          {/* Small logo mark */}
          <div className="absolute bottom-3 left-4 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
              <svg className="h-4 w-4 text-white" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            </div>
            <span className="text-sm font-semibold text-white drop-shadow">freightPOP</span>
          </div>
        </section>

        {/* Reward card */}
        <section className="fp-container -mt-2 px-4">
          <div className="rounded-xl bg-slate-100 border border-slate-200 p-4 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xl font-bold text-slate-900">
                  +Rs{formatRewardDisplay(BANNER_REWARD_DISPLAY)}
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  You can get reward for check-in for 7 consecutive day.
                </p>
                <p className="mt-1 text-sm text-slate-500">Consecutive check-in days: --</p>
              </div>
              <button
                type="button"
                onClick={handleCheckInClick}
                className="shrink-0 rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white shadow-md hover:bg-blue-700 transition-colors"
              >
                Check-in
              </button>
            </div>
          </div>
        </section>

        {/* 7-day streak boxes – uses rewards gift logo from public/images/gift.png */}
        <section className="fp-container mt-4 px-4">
          <div className="grid grid-cols-7 gap-2">
            {[1, 2, 3, 4, 5, 6, 7].map((day) => (
              <div
                key={day}
                className="flex flex-col items-center rounded-lg bg-white border border-slate-200 p-2 shadow-sm"
              >
                <span className="text-xs font-medium text-slate-700">{day}days</span>
                <div className="mt-1 flex items-center justify-center min-h-[32px]">
                  {day === 7 ? (
                    <div className="relative h-8 w-8 flex items-center justify-center">
                      <Image
                        src={REWARDS_GIFT_IMAGE}
                        alt=""
                        width={24}
                        height={24}
                        className="absolute left-0 object-contain"
                        aria-hidden
                      />
                      <Image
                        src={REWARDS_GIFT_IMAGE}
                        alt=""
                        width={24}
                        height={24}
                        className="absolute right-0 top-0 object-contain opacity-90"
                        aria-hidden
                      />
                    </div>
                  ) : (
                    <Image
                      src={REWARDS_GIFT_IMAGE}
                      alt="Reward"
                      width={32}
                      height={32}
                      className="object-contain"
                      aria-hidden
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Check-in Rules */}
        <section className="fp-container mt-6 px-4 pb-8">
          <h2 className="mb-4 text-lg font-bold text-slate-900">Check-in Rules</h2>
          <ul className="space-y-4">
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center text-green-600" aria-hidden>
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                </svg>
              </span>
              <span className="text-sm text-slate-700">
                <strong>Daily Sign-In Required:</strong> You must sign in once every day to be eligible for rewards.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center text-blue-600" aria-hidden>
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              </span>
              <span className="text-sm text-slate-700">
                <strong>Consecutive Days Matter:</strong> Signing in for 7 days in a row will unlock a special bonus.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center text-slate-600" aria-hidden>
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </span>
              <span className="text-sm text-slate-700">
                <strong>Daily Time Window:</strong> Sign-in is valid from 10:00 AM to 22:00 PM each day.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center text-red-500" aria-hidden>
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </span>
              <span className="text-sm text-slate-700">
                <strong>Missed a Day?</strong> Your streak will reset if you skip a day.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center" aria-hidden>
                <Image src={REWARDS_GIFT_IMAGE} alt="" width={24} height={24} className="object-contain" />
              </span>
              <span className="text-sm text-slate-700">
                <strong>Bonus Milestones:</strong> Extra rewards are given on 3-day, 5-day, and 7-day streaks.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center text-slate-600" aria-hidden>
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M18 15v-4h-3.86a4 4 0 1 0 0 8H18zm0 2h-3.86a2 2 0 1 1 0-4H18v4zM4 11h4V7H4v4zm0 6h4v-4H4v4z" />
                </svg>
              </span>
              <span className="text-sm text-slate-700">
                <strong>Manual Sign-In Only:</strong> Auto-login won&apos;t count. You must click the sign-in button yourself.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center text-slate-600" aria-hidden>
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              </span>
              <span className="text-sm text-slate-700">
                <strong>Track Progress:</strong> You can view your sign-in streak in the dashboard.
              </span>
            </li>
          </ul>
        </section>

        {showRewardModal ? (
          <div className="fixed inset-0 z-50 px-4" role="dialog" aria-modal="true">
            <button
              type="button"
              aria-label="Close modal"
              onClick={() => setShowRewardModal(false)}
              className="absolute inset-0 bg-black/40"
            />
            <div className="relative z-10 flex min-h-full items-center justify-center">
              <div className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
                <div className="border-b border-slate-200 px-4 py-3 text-center">
                  <h2 className="text-3xl font-semibold text-slate-900">System message</h2>
                </div>
                <div className="space-y-5 p-8 text-center">
                  <p className="text-4xl font-semibold text-slate-900">
                    sign in reward{" "}
                    <span className="text-red-600">৳{formatRewardDisplay(modalRewardAmount)}</span>
                  </p>
                  <button
                    type="button"
                    onClick={handleRewardConfirm}
                    className="w-full rounded-md bg-sky-600 py-3 text-sm font-semibold text-white shadow hover:bg-sky-700"
                  >
                    Confirm
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {showCheckInFailed ? (
          <div className="fixed inset-0 z-50 px-4" role="dialog" aria-modal="true">
            <button
              type="button"
              aria-label="Close modal"
              onClick={() => setShowCheckInFailed(false)}
              className="absolute inset-0 bg-black/40"
            />
            <div className="relative z-10 flex min-h-full items-center justify-center">
              <div className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                  <h2 className="mx-auto text-3xl font-semibold text-slate-900">Daily Check-In</h2>
                  <button
                    type="button"
                    onClick={() => setShowCheckInFailed(false)}
                    className="absolute right-4 h-8 w-8 rounded-full text-slate-500 hover:bg-slate-100"
                    aria-label="Close failed popup"
                  >
                    ✕
                  </button>
                </div>
                <div className="space-y-5 p-8 text-center">
                  <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-rose-500">
                    <svg
                      viewBox="0 0 24 24"
                      className="h-9 w-9 text-white"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                    >
                      <path d="M18 6 6 18M6 6l12 12" />
                    </svg>
                  </div>
                  <div className="space-y-1">
                    <p className="text-4xl font-semibold text-slate-900">Failed</p>
                    <p className="text-base text-slate-600">{failedMessage}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowCheckInFailed(false)}
                    className="w-full rounded-md bg-sky-600 py-3 text-sm font-semibold text-white shadow hover:bg-sky-700"
                  >
                    Confirm
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </main>
  );
}
