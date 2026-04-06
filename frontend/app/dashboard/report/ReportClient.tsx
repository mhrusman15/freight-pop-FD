"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import {
  TOTAL_TASKS,
  createRandomHiddenRewardGift,
  createRandomTask,
  getRandomPrimeTaskImage,
  getNextTaskImage,
  getTitleFromImageName,
  type Task,
} from "./data/tasks";
import { setAssetBalance } from "@/lib/asset-balance-store";
import { useAssetBalance } from "@/lib/use-asset-balance";
import {
  userApi,
  type UserOpenTaskResult,
  type UserTaskActivityEntry,
  type UserTaskStatus,
} from "@/lib/api";
import { getUserData } from "@/lib/auth-store";

const HIDDEN_REWARD_TRIGGER_TASK_NO = 28;

type ActivityStatus = "pending" | "completed";
type ActivityEntry = {
  id: string;
  title: string;
  orderNumber: string;
  quantityRs: number;
  commissionRs: number;
  createdAt: Date;
  status: ActivityStatus;
  isPrime?: boolean;
  taskNo?: number;
  message?: string | null;
  activityType?: "task" | "log" | "prime_notice";
  /** Server payload.task.image — stable for prime until complete */
  taskImage?: string | null;
  taskTitle?: string | null;
};

function buildCompletedNotifications(
  entries: ActivityEntry[],
  cycleSize: number,
): ActivityEntry[] {
  const completed = entries.filter((e) => e.status === "completed");
  if (completed.length === 0) return [];

  const notifications: ActivityEntry[] = [];
  for (let i = 0; i < completed.length; i += cycleSize) {
    const chunk = completed.slice(i, i + cycleSize);
    // Only emit history notification for full cycles (e.g. 30/30).
    if (chunk.length < cycleSize) continue;
    const latest = chunk[0];
    const totalQuantity = chunk.reduce((sum, entry) => sum + entry.quantityRs, 0);
    const totalCommission = chunk.reduce((sum, entry) => sum + entry.commissionRs, 0);
    const batchRef =
      latest.orderNumber && String(latest.orderNumber).trim().length > 0
        ? latest.orderNumber
        : String(latest.id).slice(0, 12);
    notifications.push({
      id: `completed-summary-${latest.id}-${chunk.length}`,
      title: `${cycleSize} Tasks Completed Report`,
      orderNumber: `BATCH-${batchRef}`,
      quantityRs: totalQuantity,
      commissionRs: totalCommission,
      createdAt: latest.createdAt,
      status: "completed",
    });
  }

  return notifications;
}

function StarRating({
  value,
  onChange,
}: {
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1">
        {Array.from({ length: 5 }, (_, i) => {
          const n = i + 1;
          const filled = n <= value;
          return (
            <button
              key={n}
              type="button"
              aria-label={`Rate ${n} star${n === 1 ? "" : "s"}`}
              onClick={() => onChange(n)}
              className="p-0.5"
            >
              <svg
                viewBox="0 0 24 24"
                className={`h-6 w-6 ${
                  filled ? "text-rose-500" : "text-slate-300"
                }`}
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
              </svg>
            </button>
          );
        })}
      </div>
      <span className="text-sm font-semibold text-slate-800">{value}</span>
    </div>
  );
}

function ModalShell({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 px-4" role="dialog" aria-modal="true">
      <button
        type="button"
        aria-label="Close modal"
        onClick={onClose}
        className="absolute inset-0 bg-black/40"
      />
      <div className="relative z-10 flex min-h-full items-center justify-center">
        <div className="w-full max-w-md rounded-2xl bg-white shadow-xl border border-slate-200 overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  );
}

function pickPrimeGrabProduct(): { image: string; title: string } {
  const image = getRandomPrimeTaskImage();
  return { image, title: getTitleFromImageName(image) };
}

/** Server-first: pending prime row image, then status.primeGrabProduct, then random (legacy fallback). */
async function fetchPrimeGrabDisplay(
  currentTaskNo: number,
  setStatus: (s: UserTaskStatus | null) => void,
): Promise<{ image: string; title: string }> {
  const ct = Math.max(0, Number(currentTaskNo) || 0);
  const [stRes, actRes] = await Promise.all([userApi.getTaskStatus(), userApi.getTaskActivity()]);
  if (stRes.data) setStatus(stRes.data);
  const st = stRes.data;
  const entries = actRes.data?.entries ?? [];
  const pending = entries.find(
    (e) =>
      e.status === "pending" &&
      e.isPrime &&
      (e.taskNo == null || Number(e.taskNo) === ct),
  );
  if (pending?.taskImage) {
    return {
      image: pending.taskImage,
      title:
        (pending.taskTitle && String(pending.taskTitle)) ||
        pending.title ||
        getTitleFromImageName(pending.taskImage),
    };
  }
  const pg = st?.primeGrabProduct;
  if (pg?.image) {
    return { image: pg.image, title: pg.title || getTitleFromImageName(pg.image) };
  }
  return pickPrimeGrabProduct();
}

/** Grab Order style (confetti, success mark, COMBO ribbon, Book Now) — prime block & congrats use the same UI. */
function GrabOrderPrimeModalBody({
  product,
  onClose,
  onBookNow,
}: {
  product: { image: string; title: string } | null;
  onClose: () => void;
  onBookNow: () => void;
}) {
  return (
    <>
      <div className="relative border-b border-slate-200 px-4 pt-3 pb-4">
        <h2 className="text-center text-base font-semibold text-slate-900">Grab Order</h2>
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-1/2 h-8 w-8 -translate-y-1/2 rounded-full text-slate-500 hover:bg-slate-100 grid place-items-center"
          aria-label="Close"
        >
          ✕
        </button>
      </div>
      <div className="relative overflow-hidden px-5 pb-6 pt-4 text-center">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-52 overflow-hidden"
          aria-hidden
        >
          {Array.from({ length: 36 }, (_, i) => {
            const colors = [
              "bg-amber-400/70",
              "bg-yellow-300/80",
              "bg-amber-500/60",
              "bg-orange-300/70",
            ];
            return (
              <span
                key={i}
                className={`absolute h-1.5 w-2 rounded-[1px] ${colors[i % colors.length]}`}
                style={{
                  left: `${(i * 17 + (i % 7) * 11) % 100}%`,
                  top: `${(i * 13) % 55}%`,
                  transform: `rotate(${i * 23}deg)`,
                }}
              />
            );
          })}
        </div>
        <div className="relative z-[1] space-y-4">
          <div className="mx-auto flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-emerald-500 shadow-sm">
            <svg
              viewBox="0 0 24 24"
              className="h-9 w-9 text-white"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              aria-hidden
            >
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </div>
          <p className="text-2xl font-bold text-slate-900">Congratulations!!</p>
          <p className="text-base font-bold text-slate-900">
            You have received an exclusive booking.
          </p>
          <p className="text-sm leading-relaxed text-slate-500">
            You&apos;ve got the prime order x5 commission, please contact customer service to get more
            details!
          </p>
          {product ? (
            <div className="mx-auto w-full max-w-[220px] space-y-2 pt-1">
              <div className="relative mx-auto aspect-square w-full overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                <span className="absolute left-0 top-0 z-10 inline-block origin-top-left -translate-x-0.5 translate-y-3 rotate-[-40deg] whitespace-nowrap bg-red-600 px-4 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow">
                  COMBO
                </span>
                <Image
                  src={product.image}
                  alt={product.title}
                  fill
                  className="object-cover"
                  sizes="220px"
                />
              </div>
              <p className="text-sm font-medium text-slate-600">{product.title}</p>
            </div>
          ) : null}
          <button
            type="button"
            onClick={onBookNow}
            className="mt-2 w-full rounded-lg bg-sky-600 py-3 text-sm font-semibold text-white shadow hover:bg-sky-700"
          >
            Book Now
          </button>
        </div>
      </div>
    </>
  );
}

/** Always shows explicit sign for negatives: e.g. Rs -20,000.00 */
function currencyRs(n: number): string {
  const raw = Number(n);
  if (!Number.isFinite(raw)) return "Rs 0.00";
  const neg = raw < 0;
  const abs = Math.abs(raw);
  const fixed = abs.toFixed(2);
  const [intPart, dec] = fixed.split(".");
  const withCommas = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return neg ? `Rs -${withCommas}.${dec}` : `Rs ${withCommas}.${dec}`;
}

/** Formats a signed currency for deltas (negative uses same Rs -X style). */
function currencyRsSigned(n: number): string {
  const raw = Number(n);
  if (!Number.isFinite(raw) || raw === 0) return currencyRs(0);
  if (raw < 0) return currencyRs(raw);
  return `+${currencyRs(raw)}`;
}

/** Toast when prime blocks flow (server: PRIME_BLOCKED). */
function primeBlockedToastMessage(): string {
  return "Your balance is insufficient please recharge";
}

const INSUFFICIENT_BALANCE_RECHARGE_TOAST = "Insufficient balance. Please recharge.";

/** Shown when balance is negative and user taps a pending task in Activity Track (matches product copy). */
const NEGATIVE_BALANCE_ACTIVITY_TOAST =
  "Insufficient balance, please recharge and try again";

const ACTIVITY_TRACK_TOAST = "check your acitivty track";

function showRechargeToast(setToast: (m: string) => void) {
  setToast(INSUFFICIENT_BALANCE_RECHARGE_TOAST);
  window.setTimeout(() => setToast(""), 2200);
}

function showNegativeBalanceActivityToast(setToast: (m: string) => void) {
  setToast(NEGATIVE_BALANCE_ACTIVITY_TOAST);
  window.setTimeout(() => setToast(""), 2800);
}

function showActivityTrackToast(setToast: (m: string) => void) {
  setToast(ACTIVITY_TRACK_TOAST);
  window.setTimeout(() => setToast(""), 2200);
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function formatTimestamp(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ${pad2(
    d.getHours(),
  )}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
}

function randomDigits(len: number): string {
  let out = "";
  for (let i = 0; i < len; i += 1) out += String(Math.floor(Math.random() * 10));
  return out;
}

let localIdCounter = 0;
function uniqueId(prefix: string): string {
  localIdCounter += 1;
  return `${prefix}-${Date.now()}-${localIdCounter}-${Math.random()
    .toString(16)
    .slice(2, 8)}`;
}

function generateOrderNumber(d: Date): string {
  // Similar style to sample: 01718120260318142628 (prefix + YYYYMMDDHHmmss + 2 random digits)
  const ymd =
    String(d.getFullYear()) +
    pad2(d.getMonth() + 1) +
    pad2(d.getDate()) +
    pad2(d.getHours()) +
    pad2(d.getMinutes()) +
    pad2(d.getSeconds());
  return `017181${ymd}${randomDigits(2)}`;
}

export function ReportClient() {
  const authUser = getUserData();
  const activityHistoryKey = authUser?.id
    ? `fp_activity_history_${authUser.id}`
    : "fp_activity_history_guest";
  const hidePendingActivityKey = authUser?.id
    ? `fp_activity_hide_pending_${authUser.id}`
    : "fp_activity_hide_pending_guest";

  function readHidePendingFromSession(key: string): boolean {
    if (typeof window === "undefined") return false;
    try {
      return sessionStorage.getItem(key) === "1";
    } catch {
      return false;
    }
  }
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const { balance: assetBalance, refetch: refetchAssetBalance } = useAssetBalance();
  const [instantProfit, setInstantProfit] = useState(0);
  const [completedInCycle, setCompletedInCycle] = useState(0);
  const [activeTask, setActiveTask] = useState<Task>(() => createRandomTask(1));
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [isRewardModalOpen, setIsRewardModalOpen] = useState(false);
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [isFailedModalOpen, setIsFailedModalOpen] = useState(false);
  const [activityTab, setActivityTab] = useState<"all" | "pending" | "completed">(
    "all",
  );
  const [activityEntries, setActivityEntries] = useState<ActivityEntry[]>([]);
  const [activePendingEntryId, setActivePendingEntryId] = useState<string | null>(null);
  const [rating, setRating] = useState(4);
  const [imgError, setImgError] = useState(false);
  const [selectedGiftBox, setSelectedGiftBox] = useState<number | null>(null);
  const [giftRewardTask, setGiftRewardTask] = useState<Task | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [taskStatus, setTaskStatus] = useState<UserTaskStatus | null>(null);
  const [hasHydratedProgress, setHasHydratedProgress] = useState(false);
  const [hasShownHiddenRewardThisCycle, setHasShownHiddenRewardThisCycle] = useState(false);
  const [adminAssignReceiptDone, setAdminAssignReceiptDone] = useState(false);
  const [lastAssignmentGrantAt, setLastAssignmentGrantAt] = useState<string | null>(null);
  const [waitingForAdminReassign, setWaitingForAdminReassign] = useState(false);
  /** After first 30-task cycle + gift pick: hide pending rows in Activity Track until admin assigns again. */
  const [activityPendingHiddenUntilAdmin, setActivityPendingHiddenUntilAdmin] = useState(() =>
    readHidePendingFromSession(hidePendingActivityKey),
  );
  /** Shown after user taps Continue on Random Hidden Reward (30/30); cleared when admin assigns next cycle. */
  const [showWaitForAdminAfterGiftContinue, setShowWaitForAdminAfterGiftContinue] = useState(false);

  const setActivityPendingHiddenUntilAdminPersisted = (next: boolean) => {
    setActivityPendingHiddenUntilAdmin(next);
    if (typeof window === "undefined") return;
    try {
      if (next) sessionStorage.setItem(hidePendingActivityKey, "1");
      else sessionStorage.removeItem(hidePendingActivityKey);
    } catch {
      // ignore
    }
  };
  const [failedMessage, setFailedMessage] = useState("check your activity track");
  const [toastMessage, setToastMessage] = useState("");
  const [toastHint, setToastHint] = useState("");
  const [isPrimeCongratsOpen, setIsPrimeCongratsOpen] = useState(false);
  const [isPrimeBlockModalOpen, setIsPrimeBlockModalOpen] = useState(false);
  const [primeBlockProduct, setPrimeBlockProduct] = useState<{
    image: string;
    title: string;
  } | null>(null);
  const [primeReward, setPrimeReward] = useState<{ image: string; title: string } | null>(null);
  const [lastPrimeNoticeId, setLastPrimeNoticeId] = useState<string | null>(null);
  const [walletSnapshot, setWalletSnapshot] = useState({
    capital: 0,
    totalCapital: 0,
    negativeAmountTotal: 0,
    totalCommissions: 0,
    campaignWallet: 0,
    hasAnyPrimeAssigned: false,
    protectedReserve: 0,
    initialReserveConsumed: false,
    lastPositiveDepositAt: null as string | null,
  });

  const total = TOTAL_TASKS;
  const safeIndex = ((currentTaskIndex % total) + total) % total;

  const awaitingAdminOnly =
    taskStatus != null &&
    !taskStatus.canPerformTasks &&
    Boolean(taskStatus.requiresAdminAssignment);
  const awaitingAdminHardLock =
    taskStatus != null &&
    Boolean(taskStatus.requiresAdminAssignment) &&
    Math.max(0, Number(taskStatus.currentTaskNo ?? 0) || 0) <= 0;

  /**
   * Raw DB wallet balance — same source as prime recharge checks and task completion rules.
   */
  const rawWalletBalance = useMemo(() => {
    if (
      taskStatus != null &&
      taskStatus.balance != null &&
      Number.isFinite(Number(taskStatus.balance))
    ) {
      return Number(taskStatus.balance);
    }
    return Number.isFinite(assetBalance) ? assetBalance : 0;
  }, [taskStatus, assetBalance]);

  /** Total capital from API: balance minus liability of first incomplete prime only (may be negative). */
  const totalCapitalDisplay = useMemo(() => {
    const t =
      taskStatus?.totalCapital ??
      taskStatus?.total_capital ??
      walletSnapshot.totalCapital;
    if (t != null && Number.isFinite(Number(t))) return Number(t);
    return rawWalletBalance;
  }, [taskStatus, walletSnapshot.totalCapital, rawWalletBalance]);

  const reportCampaignWallet = useMemo(() => {
    const w =
      taskStatus?.campaignWallet ??
      taskStatus?.campaign_wallet ??
      walletSnapshot.campaignWallet;
    if (w != null && Number.isFinite(Number(w))) return Number(w);
    return 0;
  }, [taskStatus, walletSnapshot.campaignWallet]);

  /** Cosmetic only: server shows placeholder until first negative exposure, then 0 permanently. */
  const protectedReserveDisplay = useMemo(() => {
    if (taskStatus) {
      const v = Number(taskStatus.protectedReserve ?? taskStatus.protected_reserve ?? NaN);
      if (Number.isFinite(v)) return v;
    }
    return walletSnapshot.protectedReserve;
  }, [taskStatus, walletSnapshot.protectedReserve]);

  /** Server truth: current cycle task vs prime_orders — must run before generic "activity track" blocking. */
  const primeRechargeShortfall = useMemo(() => {
    const prime = taskStatus?.activePrime ?? null;
    const required = Math.abs(Number(prime?.negative_amount ?? 0) || 0);
    return Boolean(prime && required > 0 && rawWalletBalance < required);
  }, [taskStatus, rawWalletBalance]);

  /** Hide pending-style rows while waiting for admin (incl. after gift) or when post-gift flag is set. */
  const suppressPendingInActivity =
    awaitingAdminOnly || activityPendingHiddenUntilAdmin || waitingForAdminReassign;

  const progressLabel = useMemo(() => {
    if (awaitingAdminOnly || awaitingAdminHardLock || showWaitForAdminAfterGiftContinue) {
      return "Wait for admin for the next cycle";
    }
    return `Task ${safeIndex + 1} / ${total}`;
  }, [awaitingAdminOnly, awaitingAdminHardLock, showWaitForAdminAfterGiftContinue, safeIndex, total]);
  /** Negative account balance (admin runtime): block task/activity actions. */
  const accountBalanceInsufficient = rawWalletBalance < 0;

  /**
   * Prime blocked before `user_tasks` open row exists — nothing from GET activity. Inject a card so
   * Activity Track still lists Prime Order (negative balance or recharge shortfall).
   */
  const virtualPrimeActivityEntry = useMemo((): ActivityEntry | null => {
    if (!taskStatus?.activePrime) return null;
    const ap = taskStatus.activePrime;
    const ct = Math.max(0, Number(taskStatus.currentTaskNo ?? 0) || 0);
    if (ct <= 0 || Number(ap.task_no) !== ct) return null;
    const required = Math.max(0, Math.abs(Number(ap.negative_amount ?? 0) || 0));
    if (required <= 0) return null;
    const hasServerPendingPrime = activityEntries.some(
      (e) =>
        e.status === "pending" &&
        Boolean(e.isPrime) &&
        (e.taskNo == null || Number(e.taskNo) === ct),
    );
    if (hasServerPendingPrime) return null;
    const bal = rawWalletBalance;
    const shortfall = !Number.isFinite(bal) || bal < required;
    const negative = Number.isFinite(bal) && bal < 0;
    if (!shortfall && !negative) return null;
    const pg = taskStatus.primeGrabProduct;
    const uid = authUser?.id ?? "guest";
    return {
      id: `prime-notice-virtual-${uid}-${ct}`,
      title: "Prime Order",
      orderNumber: `Prime task #${ct} • 5x commission`,
      quantityRs: required,
      commissionRs: 0,
      createdAt: new Date(),
      status: "pending",
      isPrime: true,
      activityType: "prime_notice",
      taskNo: ct,
      taskImage: pg?.image ?? null,
      taskTitle: pg?.title ?? null,
      message: null,
    };
  }, [taskStatus, activityEntries, rawWalletBalance, authUser?.id]);

  /** Always detect server prime pending task (even when other pending rows are suppressed). */
  const pendingPrimeEntry = useMemo(
    () => activityEntries.find((entry) => entry.status === "pending" && Boolean(entry.isPrime)) || null,
    [activityEntries],
  );
  const hasPrimeOrderLock = Boolean(pendingPrimeEntry) || Boolean(virtualPrimeActivityEntry);
  const primeNegativeAmount = Math.max(0, Number(taskStatus?.primeNegativeAmount ?? 0) || 0);
  /**
   * Prime "Continue" is locked while a pending prime order exists and the admin required a recharge
   * amount that the user's balance has not yet met (matches API PRIME_ORDER_PENDING).
   */
  const isPrimeContinueLocked =
    hasPrimeOrderLock &&
    primeNegativeAmount > 0 &&
    rawWalletBalance < primeNegativeAmount;

  const isWithin24hOfDeposit = useMemo(() => {
    const depositAt = walletSnapshot.lastPositiveDepositAt;
    if (!depositAt) return false;
    const diff = Date.now() - new Date(depositAt).getTime();
    return diff < 24 * 60 * 60 * 1000;
  }, [walletSnapshot.lastPositiveDepositAt]);
  const currentTitle = getTitleFromImageName(activeTask.image);
  const isAdminAssignedCyclePending =
    Boolean(taskStatus?.taskAssignmentGrantedAt) &&
    !Boolean(taskStatus?.requiresAdminAssignment) &&
    Number(taskStatus?.quotaUsed ?? 0) === 0 &&
    Number(taskStatus?.remaining ?? 0) > 0 &&
    !adminAssignReceiptDone &&
    !waitingForAdminReassign;

  const refreshTaskStatus = () =>
    userApi.getTaskStatus().then((res) => {
      if (res.error || !res.data) {
        setTaskStatus(null);
        return res;
      }
      if (res.data) {
        setTaskStatus(res.data);
        const noTasksUntilAdmin =
          (!res.data.canPerformTasks && Boolean(res.data.requiresAdminAssignment)) ||
          (Boolean(res.data.requiresAdminAssignment) &&
            Math.max(0, Number(res.data.currentTaskNo ?? 0) || 0) <= 0);

        if (!hasHydratedProgress) {
          const progress = res.data.reportProgress;
          const lastTaskNo = Math.max(0, Number(progress?.lastTaskNo ?? 0) || 0);
          const currentTaskNoFromServer = Math.max(0, Number(res.data.currentTaskNo ?? 0) || 0);
          const cycleProfit = Number(
            res.data.instantProfit ??
              res.data.instant_profit ??
              progress?.cycleInstantProfit ??
              0,
          );
          const quotaUsed = Math.max(0, Number(res.data.quotaUsed ?? 0) || 0);
          const firstDone = Math.max(0, Number(res.data.firstTasksCompleted ?? 0) || 0);
          const inFirstTimeBonus = firstDone < total;
          const completed = inFirstTimeBonus
            ? Math.max(lastTaskNo, firstDone)
            : Math.max(lastTaskNo, quotaUsed);
          if (noTasksUntilAdmin) {
            setCurrentTaskIndex(total - 1);
            setCompletedInCycle(total);
            setHasShownHiddenRewardThisCycle(true);
          } else {
            const serverTaskIndex = currentTaskNoFromServer > 0 ? currentTaskNoFromServer - 1 : -1;
            if (serverTaskIndex >= 0) {
              const idx = Math.min(total - 1, serverTaskIndex);
              setCurrentTaskIndex(idx);
              setCompletedInCycle(Math.max(0, idx));
              setHasShownHiddenRewardThisCycle(idx >= HIDDEN_REWARD_TRIGGER_TASK_NO);
            } else {
              const mod = completed % total;
              setCurrentTaskIndex(mod);
              setCompletedInCycle(mod);
              setHasShownHiddenRewardThisCycle(mod >= HIDDEN_REWARD_TRIGGER_TASK_NO);
            }
          }
          setInstantProfit(Number.isFinite(cycleProfit) ? cycleProfit : 0);
          setHasHydratedProgress(true);
        }
        const grantedAt = res.data.taskAssignmentGrantedAt ?? null;
        if (grantedAt) {
          // Do not reset on first load/login for an already-existing cycle.
          // Reset only when admin grants a NEW assignment after we've already tracked one.
          if (lastAssignmentGrantAt == null) {
            setLastAssignmentGrantAt(grantedAt);
          } else if (grantedAt !== lastAssignmentGrantAt) {
            setLastAssignmentGrantAt(grantedAt);
            setAdminAssignReceiptDone(false);
            setCompletedInCycle(0);
            setCurrentTaskIndex(0);
            setHasShownHiddenRewardThisCycle(false);
            setWaitingForAdminReassign(false);
            setActivityPendingHiddenUntilAdminPersisted(false);
            setShowWaitForAdminAfterGiftContinue(false);
          }
        }
        if (res.data.canPerformTasks && !res.data.requiresAdminAssignment) {
          setActivityPendingHiddenUntilAdminPersisted(false);
          setShowWaitForAdminAfterGiftContinue(false);
        }
      }
      return res;
    });

  const refreshWallet = () =>
    userApi.getBalance().then((res) => {
      if (res.error || !res.data) return res;
      const raw = Number(res.data.balance);
      if (Number.isFinite(raw)) setAssetBalance(raw);
      setWalletSnapshot({
        capital: Number(res.data.capital ?? res.data.balance ?? 0) || 0,
        totalCapital: Number(res.data.totalCapital ?? res.data.total_capital ?? 0) || 0,
        negativeAmountTotal: Number(res.data.negativeAmountTotal ?? 0) || 0,
        totalCommissions: Number(res.data.totalCommissions ?? 0) || 0,
        campaignWallet: Number(res.data.campaignWallet ?? res.data.campaign_wallet ?? 0) || 0,
        hasAnyPrimeAssigned: Boolean(res.data.hasAnyPrimeAssigned),
        protectedReserve: Number(res.data.protectedReserve ?? res.data.protected_reserve ?? 0) || 0,
        initialReserveConsumed: Boolean(res.data.initialReserveConsumed),
        lastPositiveDepositAt: res.data.lastPositiveDepositAt ?? null,
      });
      const ip = res.data.instantProfit ?? res.data.instant_profit;
      if (ip != null && Number.isFinite(Number(ip))) {
        setInstantProfit(Number(ip));
      }
      return res;
    });

  const loadTaskActivity = () =>
    userApi.getTaskActivity().then((res) => {
      if (res.error || !res.data?.entries) {
        if (typeof window !== "undefined") {
          try {
            const raw = window.localStorage.getItem(activityHistoryKey);
            if (raw) {
              const parsed = JSON.parse(raw) as Array<ActivityEntry & { createdAt: string }>;
              const restored = parsed.map((e) => ({ ...e, createdAt: new Date(e.createdAt) }));
              setActivityEntries(restored);
              return restored;
            }
          } catch {
            // ignore cache parse issues
          }
        }
        setActivityEntries([]);
        return [] as ActivityEntry[];
      }
      const mapped: ActivityEntry[] = res.data.entries.map((e: UserTaskActivityEntry) => ({
        id: e.id,
        title: e.title,
        orderNumber: e.orderNumber,
        quantityRs: Number(e.quantityRs || 0),
        commissionRs: Number(e.commissionRs || 0),
        createdAt: new Date(e.createdAt),
        status: e.status,
        isPrime: Boolean(e.isPrime),
        taskNo: e.taskNo != null ? Number(e.taskNo) : undefined,
        message: e.message ?? null,
        activityType: e.activityType ?? "task",
        taskImage: e.taskImage ?? null,
        taskTitle: e.taskTitle ?? null,
      }));
      setActivityEntries(mapped);
      if (typeof window !== "undefined") {
        try {
          window.localStorage.setItem(activityHistoryKey, JSON.stringify(mapped));
        } catch {
          // ignore storage issues
        }
      }
      return mapped;
    });

  useEffect(() => {
    void refreshTaskStatus();
    void refreshWallet();
    void loadTaskActivity();
  }, []);

  const syncOnFocusRef = useRef({
    refreshTaskStatus,
    loadTaskActivity,
    refreshWallet,
  });
  syncOnFocusRef.current = { refreshTaskStatus, loadTaskActivity, refreshWallet };

  useEffect(() => {
    const sync = () => {
      if (typeof document !== "undefined" && document.visibilityState === "hidden") {
        return;
      }
      const { refreshTaskStatus: r, loadTaskActivity: l, refreshWallet: w } =
        syncOnFocusRef.current;
      void r();
      void l();
      void w();
    };
    window.addEventListener("focus", sync);
    document.addEventListener("visibilitychange", sync);
    return () => {
      window.removeEventListener("focus", sync);
      document.removeEventListener("visibilitychange", sync);
    };
  }, []);

  useEffect(() => {
    setActivityPendingHiddenUntilAdmin(readHidePendingFromSession(hidePendingActivityKey));
  }, [hidePendingActivityKey]);

  useEffect(() => {
    if (!taskStatus) return;
    const needWait =
      (!taskStatus.canPerformTasks && Boolean(taskStatus.requiresAdminAssignment)) ||
      (Boolean(taskStatus.requiresAdminAssignment) &&
        Math.max(0, Number(taskStatus.currentTaskNo ?? 0) || 0) <= 0);
    setWaitingForAdminReassign(needWait);
  }, [taskStatus]);

  useEffect(() => {
    if (!taskStatus || !hasHydratedProgress) return;
    const noTasksUntilAdmin =
      (!taskStatus.canPerformTasks && Boolean(taskStatus.requiresAdminAssignment)) ||
      (Boolean(taskStatus.requiresAdminAssignment) &&
        Math.max(0, Number(taskStatus.currentTaskNo ?? 0) || 0) <= 0);
    if (noTasksUntilAdmin) {
      setCurrentTaskIndex(total - 1);
      setCompletedInCycle(total);
      return;
    }
    const serverTaskNo = Math.max(0, Number(taskStatus.currentTaskNo ?? 0) || 0);
    if (serverTaskNo <= 0) return;
    const idx = Math.min(total - 1, serverTaskNo - 1);
    setCurrentTaskIndex(idx);
    setCompletedInCycle(Math.max(0, idx));
  }, [
    taskStatus?.currentTaskNo,
    taskStatus?.canPerformTasks,
    taskStatus?.requiresAdminAssignment,
    hasHydratedProgress,
    total,
  ]);

  useEffect(() => {
    if (!accountBalanceInsufficient) return;
    setIsTaskModalOpen(false);
    setIsSuccessModalOpen(false);
  }, [accountBalanceInsufficient]);

  const resumeAfterPositiveBalanceRef = useRef({
    refreshTaskStatus,
    loadTaskActivity,
    refetchAssetBalance,
  });
  resumeAfterPositiveBalanceRef.current = {
    refreshTaskStatus,
    loadTaskActivity,
    refetchAssetBalance,
  };
  const wasBalanceInsufficientRef = useRef<boolean | null>(null);

  useEffect(() => {
    const prev = wasBalanceInsufficientRef.current;
    wasBalanceInsufficientRef.current = accountBalanceInsufficient;
    if (prev !== true || accountBalanceInsufficient) return;
    const { refreshTaskStatus: r, loadTaskActivity: l, refetchAssetBalance: f } =
      resumeAfterPositiveBalanceRef.current;
    void r();
    void l();
    void f();
  }, [accountBalanceInsufficient]);

  useEffect(() => {
    if (!pendingPrimeEntry?.id) return;
    if (pendingPrimeEntry.id === lastPrimeNoticeId) return;
    if (primeRechargeShortfall) return;
    setLastPrimeNoticeId(pendingPrimeEntry.id);
    const img =
      pendingPrimeEntry.taskImage && pendingPrimeEntry.taskImage.length > 0
        ? pendingPrimeEntry.taskImage
        : getNextTaskImage();
    const title =
      (pendingPrimeEntry.taskTitle && String(pendingPrimeEntry.taskTitle)) ||
      pendingPrimeEntry.title ||
      getTitleFromImageName(img);
    setPrimeReward({ image: img, title });
    setIsPrimeCongratsOpen(true);
  }, [pendingPrimeEntry?.id, lastPrimeNoticeId, primeRechargeShortfall]);

  const openTaskModal = () => {
    if (
      awaitingAdminOnly ||
      awaitingAdminHardLock ||
      waitingForAdminReassign ||
      showWaitForAdminAfterGiftContinue
    ) {
      return;
    }
    if (accountBalanceInsufficient) {
      showRechargeToast(setToastMessage);
      return;
    }
    const ct = Math.max(0, Number(taskStatus?.currentTaskNo ?? 0) || 0);
    const prime = taskStatus?.activePrime ?? null;
    const bal = Number(taskStatus?.balance != null ? taskStatus.balance : assetBalance);
    const required = Math.abs(Number(prime?.negative_amount ?? 0) || 0);

    if (prime && required > 0 && bal < required) {
      void fetchPrimeGrabDisplay(ct, setTaskStatus).then((product) => {
        setPrimeBlockProduct(product);
        setIsPrimeBlockModalOpen(true);
      });
      const key = `fp_prime_pending_logged_${authUser?.id ?? "guest"}_${ct}`;
      if (typeof window !== "undefined" && !sessionStorage.getItem(key)) {
        void userApi.addActivityLog({ message: "Prime order (5x) available but pending" }).then((res) => {
          if (!res.error) {
            try {
              sessionStorage.setItem(key, "1");
            } catch {
              // ignore
            }
            void loadTaskActivity();
          }
        });
      }
      return;
    }

    if (!prime && isAdminAssignedCyclePending) {
      setFailedMessage("check your acitivty track");
      setIsFailedModalOpen(true);
      return;
    }
    if (taskStatus && !taskStatus.canPerformTasks && !primeRechargeShortfall) {
      setFailedMessage("check your activity track");
      setIsFailedModalOpen(true);
      return;
    }
    userApi.openTask().then((res) => {
      if (res.data?.code === "INSUFFICIENT_BALANCE") {
        if (!accountBalanceInsufficient) {
          void refetchAssetBalance();
          void refreshTaskStatus();
          showActivityTrackToast(setToastMessage);
          return;
        }
        void (async () => {
          await refetchAssetBalance();
          showActivityTrackToast(setToastMessage);
          void refreshTaskStatus();
        })();
        return;
      }
      const errCode = (res.data as { code?: string } | undefined)?.code;
      if (res.error && (errCode === "PRIME_BLOCKED" || errCode === "PRIME_ORDER_PENDING")) {
        const body = res.data as UserOpenTaskResult;
        const st = body.status;
        if (st) setTaskStatus(st);
        else void refreshTaskStatus();
        const t = body.task;
        const ctn = Math.max(0, Number(st?.currentTaskNo ?? taskStatus?.currentTaskNo ?? 0) || 0);
        if (t?.image) {
          setPrimeBlockProduct({ image: t.image, title: t.title || getTitleFromImageName(t.image) });
          setIsPrimeBlockModalOpen(true);
        } else if (st?.primeGrabProduct?.image) {
          setPrimeBlockProduct({
            image: st.primeGrabProduct.image,
            title: st.primeGrabProduct.title || getTitleFromImageName(st.primeGrabProduct.image),
          });
          setIsPrimeBlockModalOpen(true);
        } else {
          void fetchPrimeGrabDisplay(ctn, setTaskStatus).then((product) => {
            setPrimeBlockProduct(product);
            setIsPrimeBlockModalOpen(true);
          });
        }
        return;
      }
      if (res.error || !res.data || !res.data.task) {
        const code = (res.data as { code?: string } | undefined)?.code;
        setFailedMessage(code === "TASK_ASSIGNMENT_REQUIRED" ? "check your activity track" : "You have unfinished orders, please deal with them in time");
        setIsFailedModalOpen(true);
        return;
      }
      if (
        (waitingForAdminReassign || !res.data.status?.canPerformTasks) &&
        !primeRechargeShortfall
      ) {
        setFailedMessage("check your activity track");
        setIsFailedModalOpen(true);
        return;
      }
      const serverTask = res.data.task;
      if (res.data.status) setTaskStatus(res.data.status);
      setActivePendingEntryId(res.data.activity?.id || null);
      setActiveTask({
        id: serverTask.taskNo,
        category: "bag",
        image: serverTask.image,
        title: serverTask.title,
        price: serverTask.quantityRs,
        commission: serverTask.commissionRs,
        rewards: serverTask.rewards,
      });
      setRating(4);
      setImgError(false);
      setIsTaskModalOpen(true);
      void loadTaskActivity();
      void refreshWallet();
    }).catch(() => {
      setFailedMessage("check your activity track");
      setIsFailedModalOpen(true);
    });
  };

  const submitTask = () => {
    if (accountBalanceInsufficient) {
      showRechargeToast(setToastMessage);
      return;
    }
    setIsTaskModalOpen(false);
    setIsSuccessModalOpen(true);
  };

  const confirmSuccess = () => {
    if (accountBalanceInsufficient) {
      showRechargeToast(setToastMessage);
      setIsSuccessModalOpen(false);
      setIsConfirming(false);
      return;
    }
    if (isConfirming) return;
    setIsConfirming(true);
    userApi.completeTask(activePendingEntryId || undefined).then((res) => {
      if (res.error) {
        if ((res.data as { code?: string } | undefined)?.code === "INSUFFICIENT_BALANCE") {
          showRechargeToast(setToastMessage);
          setIsSuccessModalOpen(false);
          setIsConfirming(false);
          return;
        }
        const c = (res.data as { code?: string } | undefined)?.code;
        if (c === "PRIME_BLOCKED" || c === "PRIME_ORDER_PENDING") {
          void refreshTaskStatus().then(async (r) => {
            const ctn = Math.max(0, Number(r.data?.currentTaskNo ?? taskStatus?.currentTaskNo ?? 0) || 0);
            if (activeTask?.image) {
              setPrimeBlockProduct({
                image: activeTask.image,
                title: activeTask.title || getTitleFromImageName(activeTask.image),
              });
            } else if (r.data?.primeGrabProduct?.image) {
              setPrimeBlockProduct({
                image: r.data.primeGrabProduct.image,
                title:
                  r.data.primeGrabProduct.title ||
                  getTitleFromImageName(r.data.primeGrabProduct.image),
              });
            } else {
              const product = await fetchPrimeGrabDisplay(ctn, setTaskStatus);
              setPrimeBlockProduct(product);
            }
            setIsPrimeBlockModalOpen(true);
            void loadTaskActivity();
          });
        } else {
          setFailedMessage("check your activity track");
        }
        setIsSuccessModalOpen(false);
        setIsFailedModalOpen(true);
        setIsConfirming(false);
        void loadTaskActivity();
        return;
      }
      if (res.data) setTaskStatus(res.data);

      const now = new Date();
      setActivityEntries((prev) => {
        if (!activePendingEntryId) {
          return [
            {
              id: uniqueId("activity"),
              title: currentTitle,
              orderNumber: generateOrderNumber(now),
              quantityRs: activeTask.price,
              commissionRs: activeTask.commission,
              createdAt: now,
              status: "completed",
            },
            ...prev,
          ];
        }
        return prev.map((e) =>
          e.id === activePendingEntryId
            ? {
                ...e,
                orderNumber: generateOrderNumber(now),
                createdAt: now,
                status: "completed",
              }
            : e,
        );
      });
      setActivePendingEntryId(null);
      void refetchAssetBalance();
      if (res.data) {
        const ip =
          res.data.instantProfit ??
          res.data.instant_profit ??
          res.data.reportProgress?.cycleInstantProfit;
        if (ip != null && Number.isFinite(Number(ip))) {
          setInstantProfit(Number(ip));
        } else {
          void refreshTaskStatus().then((r) => {
            const d = r.data;
            if (!d) return;
            const v =
              d.instantProfit ?? d.instant_profit ?? d.reportProgress?.cycleInstantProfit;
            if (v != null && Number.isFinite(Number(v))) setInstantProfit(Number(v));
          });
        }
      }
      setCurrentTaskIndex((i) => {
        const nextIdx = i + 1;
        if (nextIdx >= total) return total - 1;
        return nextIdx;
      });
      setCompletedInCycle((prev) => {
        const next = prev + 1;
        if (next === HIDDEN_REWARD_TRIGGER_TASK_NO && !hasShownHiddenRewardThisCycle) {
          setSelectedGiftBox(null);
          setGiftRewardTask(null);
          setIsRewardModalOpen(true);
          setHasShownHiddenRewardThisCycle(true);
        }
        if (next >= total) {
          setActivePendingEntryId(null);
          setSelectedGiftBox(null);
          setGiftRewardTask(null);
          setAdminAssignReceiptDone(false);
          setWaitingForAdminReassign(true);
          setHasShownHiddenRewardThisCycle(false);
          return total;
        }
        return next;
      });
      setIsSuccessModalOpen(false);
      setIsConfirming(false);
      void loadTaskActivity();
      void refreshWallet();
    });
  };

  const handleTaskImageError = () => {
    setImgError(true);
  };

  const handleOpenGiftBox = (boxIndex: number) => {
    if (accountBalanceInsufficient) {
      showRechargeToast(setToastMessage);
      return;
    }
    if (selectedGiftBox !== null) return;
    const reward = createRandomHiddenRewardGift(Math.floor(Math.random() * total) + 1);
    setSelectedGiftBox(boxIndex);
    setGiftRewardTask(reward);
    if (completedInCycle >= total) {
      setActivityPendingHiddenUntilAdminPersisted(true);
    }
  };

  const closeRewardModal = (opts?: { fromGiftContinue?: boolean }) => {
    void opts;
    setIsRewardModalOpen(false);
    setSelectedGiftBox(null);
    setGiftRewardTask(null);
    void refreshTaskStatus();
    void loadTaskActivity();
    void refreshWallet();
  };

  const filteredActivityEntries = useMemo(() => {
    const pendingEntriesRaw = activityEntries.filter((e) => e.status === "pending");
    /** Hide generic pending during “wait for admin” / post-gift — but always keep Prime Order rows visible. */
    const pendingEntries = suppressPendingInActivity
      ? pendingEntriesRaw.filter((e) => Boolean(e.isPrime))
      : pendingEntriesRaw;
    const completedEntries = activityEntries.filter((e) => e.status === "completed");
    // Keep completed history compact: 1 notification per fully completed 30-task cycle.
    const completedSummaryNotifications = buildCompletedNotifications(activityEntries, total);
    const visiblePendingEntries = pendingEntries;
    const virtual = virtualPrimeActivityEntry;
    const primeBanner = virtual ? [virtual] : [];
    const allEntries = [
      ...primeBanner,
      ...visiblePendingEntries,
      ...completedSummaryNotifications,
      ...completedEntries,
    ];
    if (activityTab === "all") return allEntries;
    if (activityTab === "pending") return [...primeBanner, ...visiblePendingEntries];
    // Completed tab should show both the per-task completed history and the 30-task cycle summaries.
    return [...completedSummaryNotifications, ...completedEntries];
  }, [
    activityEntries,
    activityTab,
    taskStatus,
    isAdminAssignedCyclePending,
    total,
    suppressPendingInActivity,
    virtualPrimeActivityEntry,
  ]);

  const handlePendingDispose = (entry: ActivityEntry) => {
    if (entry.activityType === "prime_notice") {
      if (accountBalanceInsufficient) {
        showNegativeBalanceActivityToast(setToastMessage);
        setToastHint("");
        return;
      }
      const ctn = Math.max(0, Number(entry.taskNo ?? taskStatus?.currentTaskNo ?? 0) || 0);
      void fetchPrimeGrabDisplay(ctn, setTaskStatus).then((product) => {
        setPrimeBlockProduct(product);
        setIsPrimeBlockModalOpen(true);
      });
      return;
    }
    if (accountBalanceInsufficient) {
      showNegativeBalanceActivityToast(setToastMessage);
      setToastHint("");
      return;
    }
    if (entry.isPrime && entry.status === "pending" && isPrimeContinueLocked) {
      setToastMessage(primeBlockedToastMessage());
      setToastHint("");
      window.setTimeout(() => {
        setToastMessage("");
        setToastHint("");
      }, 2600);
      return;
    }
    userApi.completeTask(entry.id).then((res) => {
      if (res.error) {
        if ((res.data as { code?: string } | undefined)?.code === "INSUFFICIENT_BALANCE") {
          showNegativeBalanceActivityToast(setToastMessage);
          setToastHint("");
          return;
        }
        const c2 = (res.data as { code?: string } | undefined)?.code;
        if (c2 === "PRIME_BLOCKED" || c2 === "PRIME_ORDER_PENDING") {
          void refreshTaskStatus().then(async (r) => {
            const ctn = Math.max(0, Number(entry.taskNo ?? r.data?.currentTaskNo ?? 0) || 0);
            if (entry.taskImage) {
              setPrimeBlockProduct({
                image: entry.taskImage,
                title:
                  (entry.taskTitle && String(entry.taskTitle)) ||
                  entry.title ||
                  getTitleFromImageName(entry.taskImage),
              });
            } else if (r.data?.primeGrabProduct?.image) {
              setPrimeBlockProduct({
                image: r.data.primeGrabProduct.image,
                title:
                  r.data.primeGrabProduct.title ||
                  getTitleFromImageName(r.data.primeGrabProduct.image),
              });
            } else {
              const product = await fetchPrimeGrabDisplay(ctn, setTaskStatus);
              setPrimeBlockProduct(product);
            }
            setIsPrimeBlockModalOpen(true);
          });
          return;
        }
        setFailedMessage("check your activity track");
        setIsFailedModalOpen(true);
        return;
      }
      if (res.data) setTaskStatus(res.data);
      setActivityEntries((prev) =>
        prev.map((item) =>
          item.id === entry.id
            ? {
                ...item,
                status: "completed",
                orderNumber: generateOrderNumber(new Date()),
                createdAt: new Date(),
              }
            : item,
        ),
      );
      void refetchAssetBalance();
      if (res.data) {
        const ip =
          res.data.instantProfit ??
          res.data.instant_profit ??
          res.data.reportProgress?.cycleInstantProfit;
        if (ip != null && Number.isFinite(Number(ip))) {
          setInstantProfit(Number(ip));
        } else {
          void refreshTaskStatus().then((r) => {
            const d = r.data;
            if (!d) return;
            const v =
              d.instantProfit ?? d.instant_profit ?? d.reportProgress?.cycleInstantProfit;
            if (v != null && Number.isFinite(Number(v))) setInstantProfit(Number(v));
          });
        }
      }
      void loadTaskActivity();
      void refreshWallet();
    });
  };

  return (
    <section className="w-full max-w-md -mt-10 rounded-2xl bg-white shadow-md border border-slate-200 px-6 pb-8 pt-10 space-y-6">
      <div className="text-center space-y-1">
        <h1 className="text-xl font-semibold text-slate-900">User Report</h1>
        <p className="text-xs text-slate-500">
          Review your latest performance overview before downloading detailed
          reports.
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-4 space-y-4">
        <div className="flex flex-col items-center gap-1">
          <span className="text-xs text-slate-500">Total Capital</span>
          <span
            className={`text-xl font-semibold ${
              primeRechargeShortfall
                ? "text-rose-600"
                : totalCapitalDisplay > 0 && isWithin24hOfDeposit
                  ? "text-emerald-700"
                  : "text-slate-900"
            }`}
          >
            {currencyRs(totalCapitalDisplay)}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-xs text-slate-800">
          <div className="space-y-1">
            <p className="flex items-center gap-1.5 font-medium">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 text-[10px]">
                ₹
              </span>
              Instant Profit
            </p>
            <p className="text-sm font-semibold text-slate-900">{currencyRs(instantProfit)}</p>
          </div>
          <div className="space-y-1">
            <p className="flex items-center gap-1.5 font-medium">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 text-[10px]">
                ⏱
              </span>
              Pursuit
            </p>
            <p className="text-sm font-semibold">{safeIndex + 1}/{total}</p>
          </div>
          <div className="space-y-1">
            <p className="flex items-center gap-1.5 font-medium">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 text-[10px]">
                🛡
              </span>
              Protected Reserve
            </p>
            <p className="text-sm font-semibold text-slate-900">
              {currencyRs(protectedReserveDisplay)}
            </p>
          </div>
          <div className="space-y-1">
            <p className="flex items-center gap-1.5 font-medium">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 text-[10px]">
                💼
              </span>
              Campaign Wallet
            </p>
            <p className="text-sm font-semibold">{currencyRs(reportCampaignWallet)}</p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 flex items-center justify-between">
        <span className="text-sm font-medium text-slate-800">
          Task Progress
        </span>
        <span className="text-sm font-semibold text-slate-900">
          {progressLabel}
        </span>
      </div>

      {showWaitForAdminAfterGiftContinue ? (
        <div
          className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-center text-sm font-medium text-amber-950"
          role="status"
        >
          Wait for admin for the next cycle.
        </div>
      ) : null}

      <div className="space-y-3">
        <button
          type="button"
          onClick={openTaskModal}
          disabled={
            accountBalanceInsufficient ||
            awaitingAdminOnly ||
            awaitingAdminHardLock ||
            waitingForAdminReassign ||
            showWaitForAdminAfterGiftContinue ||
            (!primeRechargeShortfall &&
              isPrimeContinueLocked &&
              !accountBalanceInsufficient) ||
            (!primeRechargeShortfall &&
              Boolean(taskStatus && !taskStatus.canPerformTasks) &&
              !accountBalanceInsufficient)
          }
          className="w-full rounded-md bg-sky-600 py-2.5 text-sm font-semibold text-white shadow hover:bg-sky-700 disabled:opacity-50 disabled:pointer-events-none"
        >
          Enter Access
        </button>
        <button
          type="button"
          onClick={() => {
            void refreshTaskStatus();
            void loadTaskActivity();
            setIsActivityModalOpen(true);
          }}
          className="w-full rounded-md border border-slate-300 py-2.5 text-sm font-medium text-slate-800 hover:bg-slate-50"
        >
          Activity Track
        </button>
      </div>

      <ModalShell
        open={isPrimeBlockModalOpen}
        onClose={() => setIsPrimeBlockModalOpen(false)}
      >
        <GrabOrderPrimeModalBody
          product={primeBlockProduct}
          onClose={() => setIsPrimeBlockModalOpen(false)}
          onBookNow={() => {
            setToastMessage("Your balance is insufficient please recharge");
            setToastHint("");
            window.setTimeout(() => {
              setToastMessage("");
              setToastHint("");
            }, 2600);
            setIsPrimeBlockModalOpen(false);
          }}
        />
      </ModalShell>

      <ModalShell
        open={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
      >
        <div className="px-4 pt-3 pb-4 border-b border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setIsTaskModalOpen(false)}
            className="h-9 w-9 rounded-full hover:bg-slate-100 grid place-items-center"
            aria-label="Back"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5 text-slate-700"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <h2 className="text-base font-semibold text-slate-900">
            Confirm order
          </h2>
          <div className="h-9 w-9" />
        </div>

        <div className="p-5 space-y-5">
          <div className="flex items-center justify-center">
            <div className="relative h-44 w-44 rounded-xl bg-slate-100 overflow-hidden border border-slate-200">
              {!imgError ? (
                <Image
                  src={activeTask.image}
                  alt={currentTitle}
                  fill
                  sizes="176px"
                  className="object-cover"
                  onError={handleTaskImageError}
                />
              ) : (
                <div className="h-full w-full grid place-items-center text-xs text-slate-500">
                  Image not found
                </div>
              )}
            </div>
          </div>

          <div className="text-center">
            <p className="text-sm font-semibold text-slate-900">
              {currentTitle}
            </p>
          </div>

          <div className="text-sm text-slate-700 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium">Price</span>
              <span className="font-semibold text-slate-900">Rs {activeTask.price}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium">Commission</span>
              <span className="font-semibold text-slate-900">
                {currencyRs(activeTask.commission)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium">Number of rewards</span>
              <span className="font-semibold text-slate-900">x{activeTask.rewards}</span>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-semibold text-slate-900">Your Rating</p>
            <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
              <StarRating value={rating} onChange={setRating} />
            </div>
          </div>

          <button
            type="button"
            onClick={submitTask}
            className="w-full rounded-md bg-sky-600 py-3 text-sm font-semibold text-white shadow hover:bg-sky-700"
          >
            Submit
          </button>
        </div>
      </ModalShell>

      <ModalShell
        open={isSuccessModalOpen}
        onClose={() => setIsSuccessModalOpen(false)}
      >
        <div className="p-8 text-center space-y-5">
          <div className="mx-auto h-16 w-16 rounded-full bg-emerald-500 grid place-items-center">
            <svg
              viewBox="0 0 24 24"
              className="h-9 w-9 text-white"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
            >
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </div>

          <div className="space-y-1">
            <p className="text-2xl font-semibold text-slate-900">
              Successful
            </p>
            <p className="text-slate-500">Complete</p>
          </div>

          <button
            type="button"
            onClick={confirmSuccess}
            disabled={isConfirming}
            className="w-full rounded-md bg-orange-600 py-3 text-sm font-semibold text-white shadow hover:bg-orange-700"
          >
            {isConfirming ? "Confirming..." : "Confirm"}
          </button>
        </div>
      </ModalShell>

      <ModalShell open={isRewardModalOpen} onClose={closeRewardModal}>
        <div className="px-4 pt-3 pb-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900 mx-auto">
            Random Hidden Reward
          </h2>
          <button
            type="button"
            onClick={() => closeRewardModal()}
            className="absolute right-4 h-8 w-8 rounded-full hover:bg-slate-100 grid place-items-center text-slate-600"
            aria-label="Close reward popup"
          >
            ✕
          </button>
        </div>

        <div className="p-5 space-y-5">
          <div className="grid grid-cols-3 gap-4 justify-items-center">
            {Array.from({ length: 6 }, (_, i) => {
              const boxNo = i + 1;
              const opened = selectedGiftBox === boxNo;
              return (
                <button
                  key={boxNo}
                  type="button"
                  onClick={() => handleOpenGiftBox(boxNo)}
                  disabled={selectedGiftBox !== null}
                  className={`rounded-lg p-1 transition ${
                    opened ? "ring-2 ring-emerald-500" : "hover:bg-slate-100"
                  } disabled:cursor-not-allowed`}
                >
                  <Image
                    src="/images/gift.png"
                    alt={`Gift box ${boxNo}`}
                    width={88}
                    height={88}
                    className="object-contain"
                  />
                </button>
              );
            })}
          </div>

          <p className="text-center text-sm font-medium text-slate-700">
            Click to open one box and uncover your hidden reward.
          </p>

          {giftRewardTask ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 space-y-3">
              <p className="text-center text-sm font-semibold text-emerald-700">
                Gift Unlocked
              </p>
              <div className="flex items-center gap-3">
                <div className="relative h-14 w-14 rounded-md overflow-hidden border border-emerald-200 bg-white">
                  <Image
                    src={giftRewardTask.image}
                    alt={giftRewardTask.title}
                    fill
                    sizes="56px"
                    className="object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">
                    {giftRewardTask.title}
                  </p>
                  <p className="text-xs text-slate-600">
                    15x Boost on this gift
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => closeRewardModal({ fromGiftContinue: true })}
                className="w-full rounded-md bg-orange-600 py-2.5 text-sm font-semibold text-white hover:bg-orange-700"
              >
                Continue
              </button>
            </div>
          ) : null}
        </div>
      </ModalShell>

      <ModalShell
        open={isActivityModalOpen}
        onClose={() => setIsActivityModalOpen(false)}
      >
        <div className="px-5 py-4 border-b border-slate-200 text-center relative">
          <h2 className="text-base font-semibold text-slate-900">Activity Track</h2>
          <button
            type="button"
            onClick={() => setIsActivityModalOpen(false)}
            className="absolute right-4 top-3 h-8 w-8 rounded-full hover:bg-slate-100 grid place-items-center text-slate-600"
            aria-label="Close activity"
          >
            ✕
          </button>
        </div>

        <div className="px-5 pt-4">
          <div className="grid grid-cols-3 text-sm font-semibold text-slate-900">
            {([
              { id: "all", label: "All" },
              { id: "pending", label: "Pending" },
              { id: "completed", label: "COMPLETED" },
            ] as const).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setActivityTab(t.id)}
                className={`pb-3 ${
                  activityTab === t.id
                    ? "border-b-2 border-slate-900"
                    : "border-b border-slate-200 text-slate-700"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {virtualPrimeActivityEntry && activityTab === "completed" ? (
          <div className="px-5 pt-2">
            <div className="rounded-lg border border-violet-200 bg-violet-50 px-3 py-2.5 text-xs leading-relaxed text-violet-950">
              <span className="font-semibold">Pending Prime Order</span> — open the{" "}
              <strong>Pending</strong> or <strong>All</strong> tab to see it and continue after
              recharge.
            </div>
          </div>
        ) : null}

        <div className="p-5 space-y-4 max-h-[70vh] overflow-auto">
          {filteredActivityEntries.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-600">
              No activity yet.
            </div>
          ) : (
            filteredActivityEntries.map((e) => {
              const isLogEntry = e.activityType === "log";
              const primeRowLocked =
                Boolean(e.isPrime) &&
                e.status === "pending" &&
                isPrimeContinueLocked;
              return (
              <div
                key={e.id}
                className={`rounded-2xl border bg-white shadow-sm p-5 space-y-4 ${
                  primeRowLocked
                    ? "border-rose-400 ring-1 ring-rose-200"
                    : "border-slate-200"
                }`}
              >
                <div className="space-y-3">
                  <p className="text-right text-sm font-semibold text-slate-800">
                    {isLogEntry ? "Activity" : e.isPrime ? "Prime Order • x5 commission" : "Brand Vault"}
                    {primeRowLocked ? (
                      <span className="ml-2 inline-flex items-center rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-rose-800">
                        Locked
                      </span>
                    ) : null}
                  </p>
                  <div className="h-px w-full bg-slate-200" />
                </div>

                <div
                  className={`space-y-1 ${primeRowLocked ? "text-rose-800" : "text-slate-900"}`}
                >
                  <p className="text-lg font-semibold leading-snug">
                    {isLogEntry ? e.message || e.title : e.isPrime ? "Prime Order" : e.title}
                  </p>
                  {e.isPrime && !isLogEntry && (e.taskTitle || e.title) ? (
                    <p className="text-sm font-medium leading-snug text-slate-600">
                      {e.taskTitle || e.title}
                    </p>
                  ) : null}
                </div>

                {isLogEntry ? (
                  <div className="text-xs text-slate-700">
                    <p>
                      <span className="font-medium">Time</span>: {formatTimestamp(e.createdAt)}
                    </p>
                  </div>
                ) : (
                <div className="text-xs text-slate-700 space-y-1.5">
                  <p>
                    <span className="font-medium">Order number</span>:{" "}
                    {e.orderNumber}
                  </p>
                  <p>
                    <span className="font-medium">
                      {e.activityType === "prime_notice" ? "Recharge required" : "Order quantity"}
                    </span>
                    :{" "}
                    <span
                      className={
                        primeRowLocked && e.quantityRs < 0 ? "font-semibold text-rose-700" : ""
                      }
                    >
                      {currencyRs(e.quantityRs)}
                    </span>
                  </p>
                  <p>
                    <span className="font-medium">Commission</span>:{" "}
                    {e.activityType === "prime_notice" && (!e.commissionRs || e.commissionRs <= 0)
                      ? "5x after recharge"
                      : `${currencyRs(e.commissionRs)}${e.isPrime ? " (x5)" : ""}`}
                  </p>
                  <p>
                    <span className="font-medium">Time</span>:{" "}
                    {formatTimestamp(e.createdAt)}
                  </p>
                </div>
                )}

                <div className="pt-1">
                  {isLogEntry ? (
                    <span className="inline-flex items-center justify-center rounded-full bg-black px-12 py-2.5 text-xs font-semibold text-white shadow">
                      Completed
                    </span>
                  ) : e.status === "completed" ? (
                    <span className="inline-flex items-center justify-center rounded-full bg-black px-12 py-2.5 text-xs font-semibold text-white shadow">
                      Completed
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handlePendingDispose(e)}
                      disabled={
                        e.activityType !== "prime_notice" &&
                        !accountBalanceInsufficient &&
                        e.isPrime &&
                        e.status === "pending" &&
                        isPrimeContinueLocked
                      }
                      title={
                        e.activityType !== "prime_notice" &&
                        !accountBalanceInsufficient &&
                        e.isPrime &&
                        e.status === "pending" &&
                        isPrimeContinueLocked &&
                        primeNegativeAmount > 0
                          ? `Add balance to reach ${currencyRs(primeNegativeAmount)} to unlock Continue`
                          : undefined
                      }
                      className={`inline-flex items-center justify-center rounded-full px-12 py-2.5 text-xs font-semibold text-white shadow ${
                        e.isPrime ? "bg-red-600 hover:bg-red-700" : "bg-sky-600 hover:bg-sky-700"
                      } disabled:opacity-40 disabled:pointer-events-none disabled:cursor-not-allowed`}
                    >
                      {e.isPrime ? "Continue" : "Dispose"}
                    </button>
                  )}
                </div>
              </div>
            );
            })
          )}
        </div>
      </ModalShell>

      <ModalShell open={isFailedModalOpen} onClose={() => setIsFailedModalOpen(false)}>
        <div className="px-4 pt-3 pb-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900 mx-auto">
            Grab Order
          </h2>
          <button
            type="button"
            onClick={() => setIsFailedModalOpen(false)}
            className="absolute right-4 h-8 w-8 rounded-full hover:bg-slate-100 grid place-items-center text-slate-500"
            aria-label="Close failed popup"
          >
            ✕
          </button>
        </div>
        <div className="p-8 text-center space-y-5">
          <div className="mx-auto h-16 w-16 rounded-full bg-rose-500 grid place-items-center">
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
            <p className="text-2xl font-semibold text-slate-900">Failed</p>
            <p className="text-slate-500 text-sm">
              {failedMessage}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsFailedModalOpen(false)}
            className="w-full rounded-md bg-sky-600 py-3 text-sm font-semibold text-white shadow hover:bg-sky-700"
          >
            Confirm
          </button>
        </div>
      </ModalShell>

      <ModalShell
        open={isPrimeCongratsOpen}
        onClose={() => setIsPrimeCongratsOpen(false)}
      >
        <GrabOrderPrimeModalBody
          product={primeReward}
          onClose={() => setIsPrimeCongratsOpen(false)}
          onBookNow={() => setIsPrimeCongratsOpen(false)}
        />
      </ModalShell>
      {toastMessage ? (
        <div className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-black/75 px-4 py-3 text-center text-sm font-medium text-white shadow">
          {toastMessage}
          {toastHint ? <p className="mt-1 text-xs text-slate-200">{toastHint}</p> : null}
        </div>
      ) : null}
    </section>
  );
}

