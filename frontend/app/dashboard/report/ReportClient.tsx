"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import {
  TOTAL_TASKS,
  createRandomTask,
  getNextTaskImage,
  getTitleFromImageName,
  type Task,
} from "./data/tasks";
import { useAssetBalance } from "@/lib/use-asset-balance";
import {
  userApi,
  type UserOpenTaskResult,
  type UserTaskActivityEntry,
  type UserTaskStatus,
} from "@/lib/api";
import { getUserData } from "@/lib/auth-store";

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
};

const INITIAL_PROTECTED_RESERVE = 20000;

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
    notifications.push({
      id: `completed-summary-${latest.id}-${chunk.length}`,
      title: `${cycleSize} Tasks Completed Report`,
      orderNumber: `BATCH-${latest.orderNumber}`,
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

function currencyRs(n: number): string {
  const fixed = n.toFixed(2);
  const [int, dec] = fixed.split(".");
  const withCommas = int.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `Rs ${withCommas}.${dec}`;
}

/** Formats a signed currency for prime reserve deltas (negative = admin recharge requirement). */
function currencyRsSigned(n: number): string {
  const sign = n < 0 ? "-" : n > 0 ? "+" : "";
  const core = currencyRs(Math.abs(n)).replace(/^Rs /, "");
  return sign ? `${sign}Rs ${core}` : `Rs ${core}`;
}

/** Toast when prime blocks flow; reserve/total only change when a prime negative amount is set on the user. */
function primeBlockedToastMessage(primeNegativeAmount: number): string {
  return primeNegativeAmount > 0
    ? "Insufficient balance, please recharge and try again"
    : "Your balance is insufficient please recharge";
}

const INSUFFICIENT_BALANCE_RECHARGE_TOAST = "Insufficient balance. Please recharge.";

const ACTIVITY_TRACK_TOAST = "check your acitivty track";

function showRechargeToast(setToast: (m: string) => void) {
  setToast(INSUFFICIENT_BALANCE_RECHARGE_TOAST);
  window.setTimeout(() => setToast(""), 2200);
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
  const {
    formatted: assetBalanceFormatted,
    balance: assetBalance,
    refetch: refetchAssetBalance,
  } = useAssetBalance();
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
  const [adminAssignReceiptDone, setAdminAssignReceiptDone] = useState(false);
  const [lastAssignmentGrantAt, setLastAssignmentGrantAt] = useState<string | null>(null);
  const [waitingForAdminReassign, setWaitingForAdminReassign] = useState(false);
  /** After first 30-task cycle + gift pick: hide pending rows in Activity Track until admin assigns again. */
  const [activityPendingHiddenUntilAdmin, setActivityPendingHiddenUntilAdmin] = useState(() =>
    readHidePendingFromSession(hidePendingActivityKey),
  );

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
  const [isPrimeCongratsOpen, setIsPrimeCongratsOpen] = useState(false);
  const [primeReward, setPrimeReward] = useState<{ image: string; title: string } | null>(null);
  const [lastPrimeNoticeId, setLastPrimeNoticeId] = useState<string | null>(null);

  const total = TOTAL_TASKS;
  const safeIndex = ((currentTaskIndex % total) + total) % total;

  const awaitingAdminOnly =
    taskStatus != null &&
    !taskStatus.canPerformTasks &&
    Boolean(taskStatus.requiresAdminAssignment);

  /** Hide pending-style rows while waiting for admin (incl. after gift) or when post-gift flag is set. */
  const suppressPendingInActivity =
    awaitingAdminOnly || activityPendingHiddenUntilAdmin || waitingForAdminReassign;

  const progressLabel = useMemo(() => {
    if (awaitingAdminOnly) return "Cycle complete — wait for admin";
    return `Task ${safeIndex + 1} / ${total}`;
  }, [awaitingAdminOnly, safeIndex, total]);
  /** Negative account balance (admin runtime): show wallet as zero; block task/activity actions. */
  const accountBalanceInsufficient = assetBalance < 0;

  const campaignWallet = useMemo(() => {
    if (accountBalanceInsufficient) return 0;
    return assetBalance;
  }, [assetBalance, accountBalanceInsufficient]);
  const pendingPrimeEntry = useMemo(() => {
    if (suppressPendingInActivity) return null;
    return activityEntries.find((entry) => entry.status === "pending" && Boolean(entry.isPrime)) || null;
  }, [activityEntries, suppressPendingInActivity]);
  const hasPrimeOrderLock = Boolean(pendingPrimeEntry);
  const primeNegativeAmount = Math.max(0, Number(taskStatus?.primeNegativeAmount ?? 0) || 0);
  /** Reserve/total-capital deduction and recharge UX only apply once the user has reached the prime slot (pending prime row in activity). */
  const primeFinancialsActive = primeNegativeAmount > 0 && hasPrimeOrderLock;
  const showPrimeRechargeNotice =
    primeFinancialsActive && assetBalance < primeNegativeAmount;
  /**
   * Prime "Continue" is locked while a pending prime order exists and the admin required a recharge
   * amount that the user's balance has not yet met (matches API PRIME_ORDER_PENDING).
   */
  const isPrimeContinueLocked =
    hasPrimeOrderLock &&
    primeNegativeAmount > 0 &&
    assetBalance < primeNegativeAmount;

  /**
   * Protected reserve and Total Capital show the prime deduction only while the user is on the
   * assigned prime order (pending prime in activity), not on earlier tasks in the cycle.
   */
  const protectedReserveDisplay = useMemo(() => {
    if (accountBalanceInsufficient) {
      return { total: 0 };
    }
    const base = INITIAL_PROTECTED_RESERVE;
    if (primeFinancialsActive) {
      return { total: base - primeNegativeAmount };
    }
    return { total: base };
  }, [accountBalanceInsufficient, primeFinancialsActive, primeNegativeAmount]);

  /**
   * While prime recharge is required and balance is short, Total Capital shows the combined liability:
   * -(protected reserve nominal + admin negative amount), e.g. -(20000 + 15000) = -35000.
   * Once balance meets the requirement, net reserve (reserve − required) is used as before.
   */
  const totalCapitalDisplay = useMemo(() => {
    if (accountBalanceInsufficient) {
      return { mode: "balance" as const, value: assetBalance };
    }
    if (primeFinancialsActive) {
      const shortfall = assetBalance < primeNegativeAmount;
      const value = shortfall
        ? -(INITIAL_PROTECTED_RESERVE + primeNegativeAmount)
        : INITIAL_PROTECTED_RESERVE - primeNegativeAmount;
      return { mode: "prime_adjusted" as const, value };
    }
    return { mode: "balance" as const, value: assetBalance };
  }, [accountBalanceInsufficient, primeFinancialsActive, primeNegativeAmount, assetBalance]);
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
          !res.data.canPerformTasks && Boolean(res.data.requiresAdminAssignment);

        if (!hasHydratedProgress) {
          const progress = res.data.reportProgress;
          const lastTaskNo = Math.max(0, Number(progress?.lastTaskNo ?? 0) || 0);
          const cycleProfit = Math.max(0, Number(progress?.cycleInstantProfit ?? 0) || 0);
          const quotaUsed = Math.max(0, Number(res.data.quotaUsed ?? 0) || 0);
          const firstDone = Math.max(0, Number(res.data.firstTasksCompleted ?? 0) || 0);
          const inFirstTimeBonus = firstDone < total;
          const completed = inFirstTimeBonus
            ? Math.max(lastTaskNo, firstDone)
            : Math.max(lastTaskNo, quotaUsed);
          if (noTasksUntilAdmin) {
            setCurrentTaskIndex(total - 1);
            setCompletedInCycle(total);
          } else {
            const mod = completed % total;
            setCurrentTaskIndex(mod);
            setCompletedInCycle(mod);
          }
          setInstantProfit(cycleProfit);
          setHasHydratedProgress(true);
        }
        const grantedAt = res.data.taskAssignmentGrantedAt ?? null;
        if (grantedAt && grantedAt !== lastAssignmentGrantAt) {
          const hadPreviousGrant = lastAssignmentGrantAt !== null;
          setLastAssignmentGrantAt(grantedAt);
          setAdminAssignReceiptDone(false);
          setCompletedInCycle(0);
          setCurrentTaskIndex(0);
          setWaitingForAdminReassign(false);
          if (hadPreviousGrant) {
            setActivityPendingHiddenUntilAdminPersisted(false);
          }
        }
        if (res.data.canPerformTasks && !res.data.requiresAdminAssignment) {
          setActivityPendingHiddenUntilAdminPersisted(false);
        }
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

  const hasPendingPrimeOrder = (entries: ActivityEntry[]) =>
    entries.some((entry) => entry.status === "pending" && Boolean(entry.isPrime));

  useEffect(() => {
    void refreshTaskStatus();
    void loadTaskActivity();
  }, []);

  useEffect(() => {
    setActivityPendingHiddenUntilAdmin(readHidePendingFromSession(hidePendingActivityKey));
  }, [hidePendingActivityKey]);

  useEffect(() => {
    if (!taskStatus) return;
    const needWait =
      !taskStatus.canPerformTasks && Boolean(taskStatus.requiresAdminAssignment);
    setWaitingForAdminReassign(needWait);
  }, [taskStatus]);

  useEffect(() => {
    if (!accountBalanceInsufficient) return;
    setIsActivityModalOpen(false);
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
    setLastPrimeNoticeId(pendingPrimeEntry.id);
    const img = getNextTaskImage();
    setPrimeReward({ image: img, title: getTitleFromImageName(img) });
    setIsPrimeCongratsOpen(true);
  }, [pendingPrimeEntry?.id, lastPrimeNoticeId]);

  const openTaskModal = () => {
    if (accountBalanceInsufficient) {
      showRechargeToast(setToastMessage);
      return;
    }
    if (isAdminAssignedCyclePending) {
      setFailedMessage("check your acitivty track");
      setIsFailedModalOpen(true);
      return;
    }
    if (taskStatus && !taskStatus.canPerformTasks) {
      const shortfall =
        hasPrimeOrderLock &&
        primeNegativeAmount > 0 &&
        assetBalance < primeNegativeAmount &&
        !taskStatus.requiresAdminAssignment;
      setFailedMessage(
        shortfall
          ? "Insufficient balance for the prime order — recharge before continuing tasks."
          : "check your activity track",
      );
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
      if (res.error && res.data?.code === "PRIME_ORDER_PENDING") {
        const body = res.data as UserOpenTaskResult;
        const run = async () => {
          let pn = Math.max(0, Number(body.status?.primeNegativeAmount ?? 0) || 0);
          if (body.status) {
            setTaskStatus(body.status);
          } else {
            const refreshed = await refreshTaskStatus();
            pn = Math.max(0, Number(refreshed.data?.primeNegativeAmount ?? 0) || 0);
          }
          const entries = await loadTaskActivity();
          if (hasPendingPrimeOrder(entries)) {
            setToastMessage(primeBlockedToastMessage(pn));
            window.setTimeout(() => setToastMessage(""), 2200);
          } else {
            setFailedMessage("check your activity track");
            setIsFailedModalOpen(true);
          }
        };
        void run();
        return;
      }
      if (res.error || !res.data || !res.data.task) {
        const code = (res.data as { code?: string } | undefined)?.code;
        setFailedMessage(code === "TASK_ASSIGNMENT_REQUIRED" ? "check your activity track" : "You have unfinished orders, please deal with them in time");
        setIsFailedModalOpen(true);
        return;
      }
      if (waitingForAdminReassign || !res.data.status?.canPerformTasks) {
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
        if ((res.data as { code?: string } | undefined)?.code === "PRIME_ORDER_PENDING") {
          void refreshTaskStatus().then((r) => {
            const pn = Math.max(0, Number(r.data?.primeNegativeAmount ?? 0) || 0);
            void loadTaskActivity().then((entries) => {
              if (hasPendingPrimeOrder(entries)) {
                setFailedMessage("check your acitivty task you get prime order");
                setToastMessage(primeBlockedToastMessage(pn));
                window.setTimeout(() => setToastMessage(""), 2200);
              } else {
                setFailedMessage("check your activity track");
              }
            });
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
      if (res.data?.reportProgress != null) {
        setInstantProfit(Math.max(0, Number(res.data.reportProgress.cycleInstantProfit ?? 0)));
      } else {
        void refreshTaskStatus().then((r) => {
          const cp = r.data?.reportProgress?.cycleInstantProfit;
          if (cp != null) setInstantProfit(Math.max(0, Number(cp)));
        });
      }
      setCurrentTaskIndex((i) => {
        const nextIdx = i + 1;
        if (nextIdx >= total) return total - 1;
        return nextIdx;
      });
      setCompletedInCycle((prev) => {
        const next = prev + 1;
        if (next >= total) {
          setActivePendingEntryId(null);
          setSelectedGiftBox(null);
          setGiftRewardTask(null);
          setIsRewardModalOpen(true);
          setAdminAssignReceiptDone(false);
          setWaitingForAdminReassign(true);
          return total;
        }
        return next;
      });
      setIsSuccessModalOpen(false);
      setIsConfirming(false);
      void loadTaskActivity();
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
    const reward = createRandomTask(Math.floor(Math.random() * total) + 1);
    setSelectedGiftBox(boxIndex);
    setGiftRewardTask(reward);
    if (completedInCycle >= total) {
      setActivityPendingHiddenUntilAdminPersisted(true);
    }
  };

  const closeRewardModal = () => {
    if (selectedGiftBox !== null) {
      setActivityPendingHiddenUntilAdminPersisted(true);
    }
    setIsRewardModalOpen(false);
    setSelectedGiftBox(null);
    setGiftRewardTask(null);
    void refreshTaskStatus();
    void loadTaskActivity();
  };

  const filteredActivityEntries = useMemo(() => {
    const pendingEntriesRaw = activityEntries.filter((e) => e.status === "pending");
    const pendingEntries = suppressPendingInActivity ? [] : pendingEntriesRaw;
    const completedEntries = activityEntries.filter((e) => e.status === "completed");
    const pendingPrimeForList = pendingEntries.find((e) => Boolean(e.isPrime)) || null;
    // Keep completed history compact: 1 notification per fully completed 30-task cycle.
    const completedSummaryNotifications = buildCompletedNotifications(activityEntries, total);
    const primeOrderNotifications: ActivityEntry[] = pendingPrimeForList
      ? [
          {
            id: `prime-order-notice-${pendingPrimeForList.id}`,
            title: "Prime Order Assigned (Action Required • 5x Commission)",
            orderNumber: `Remaining tasks: ${Math.max(0, Number(taskStatus?.remaining ?? 0))}`,
            quantityRs: pendingPrimeForList.quantityRs,
            commissionRs: pendingPrimeForList.commissionRs,
            createdAt: pendingPrimeForList.createdAt,
            status: "pending",
            isPrime: true,
          },
        ]
      : [];
    const visiblePendingEntries = pendingEntries;
    const allEntries = [
      ...visiblePendingEntries,
      ...primeOrderNotifications,
      ...completedSummaryNotifications,
      ...completedEntries,
    ];
    if (activityTab === "all") return allEntries;
    if (activityTab === "pending") return [...visiblePendingEntries, ...primeOrderNotifications];
    // Completed tab should show both the per-task completed history and the 30-task cycle summaries.
    return [...completedSummaryNotifications, ...completedEntries];
  }, [
    activityEntries,
    activityTab,
    taskStatus,
    isAdminAssignedCyclePending,
    total,
    suppressPendingInActivity,
  ]);

  const handlePendingDispose = (entry: ActivityEntry) => {
    if (accountBalanceInsufficient) {
      showRechargeToast(setToastMessage);
      return;
    }
    if (entry.isPrime && entry.status === "pending" && isPrimeContinueLocked) {
      setToastMessage(primeBlockedToastMessage(primeNegativeAmount));
      window.setTimeout(() => setToastMessage(""), 2200);
      return;
    }
    userApi.completeTask(entry.id).then((res) => {
      if (res.error) {
        if ((res.data as { code?: string } | undefined)?.code === "INSUFFICIENT_BALANCE") {
          showRechargeToast(setToastMessage);
          return;
        }
        if ((res.data as { code?: string } | undefined)?.code === "PRIME_ORDER_PENDING") {
          void refreshTaskStatus().then((r) => {
            const pn = Math.max(0, Number(r.data?.primeNegativeAmount ?? 0) || 0);
            setToastMessage(primeBlockedToastMessage(pn));
            window.setTimeout(() => setToastMessage(""), 2200);
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
      if (res.data?.reportProgress != null) {
        setInstantProfit(Math.max(0, Number(res.data.reportProgress.cycleInstantProfit ?? 0)));
      } else {
        void refreshTaskStatus().then((r) => {
          const cp = r.data?.reportProgress?.cycleInstantProfit;
          if (cp != null) setInstantProfit(Math.max(0, Number(cp)));
        });
      }
      void loadTaskActivity();
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
              totalCapitalDisplay.mode === "prime_adjusted" && totalCapitalDisplay.value < 0
                ? "text-rose-700"
                : totalCapitalDisplay.mode === "balance" && assetBalance < 0
                  ? "text-rose-700"
                  : totalCapitalDisplay.mode === "balance" && assetBalance > 0
                    ? "text-emerald-700"
                    : "text-slate-900"
            }`}
          >
            {totalCapitalDisplay.mode === "prime_adjusted"
              ? totalCapitalDisplay.value < 0
                ? currencyRsSigned(totalCapitalDisplay.value)
                : currencyRs(totalCapitalDisplay.value)
              : assetBalance < 0
                ? currencyRsSigned(assetBalance)
                : assetBalanceFormatted}
          </span>
          {showPrimeRechargeNotice ? (
            <p className="text-[11px] text-amber-700 max-w-[280px] text-center">
              Prime order: add balance to reach Rs {primeNegativeAmount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} to complete this order (order amount may show as negative).
            </p>
          ) : null}
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
            <p
              className={`text-sm font-semibold ${
                protectedReserveDisplay.total < 0 ? "text-rose-700" : "text-slate-900"
              }`}
            >
              {currencyRs(protectedReserveDisplay.total)}
            </p>
          </div>
          <div className="space-y-1">
            <p className="flex items-center gap-1.5 font-medium">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 text-[10px]">
                💼
              </span>
              Campaign Wallet
            </p>
            <p className="text-sm font-semibold">{currencyRs(campaignWallet)}</p>
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

      <div className="space-y-3">
        <button
          type="button"
          onClick={openTaskModal}
          disabled={
            (isPrimeContinueLocked && !accountBalanceInsufficient) ||
            (Boolean(taskStatus && !taskStatus.canPerformTasks) && !accountBalanceInsufficient)
          }
          className="w-full rounded-md bg-sky-600 py-2.5 text-sm font-semibold text-white shadow hover:bg-sky-700 disabled:opacity-50 disabled:pointer-events-none"
        >
          Enter Access
        </button>
        <button
          type="button"
          onClick={() => {
            if (accountBalanceInsufficient) {
              showRechargeToast(setToastMessage);
              return;
            }
            refreshTaskStatus();
            loadTaskActivity();
            setIsActivityModalOpen(true);
          }}
          className="w-full rounded-md border border-slate-300 py-2.5 text-sm font-medium text-slate-800 hover:bg-slate-50"
        >
          Activity Track
        </button>
      </div>

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
            onClick={closeRewardModal}
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
                    Bonus: {currencyRs(giftRewardTask.commission)}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeRewardModal}
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

        <div className="p-5 space-y-4 max-h-[70vh] overflow-auto">
          {filteredActivityEntries.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-600">
              No activity yet.
            </div>
          ) : (
            filteredActivityEntries.map((e) => {
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
                    {e.isPrime ? "Prime Order • x5 commission" : "Brand Vault"}
                    {primeRowLocked ? (
                      <span className="ml-2 inline-flex items-center rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-rose-800">
                        Locked
                      </span>
                    ) : null}
                  </p>
                  <div className="h-px w-full bg-slate-200" />
                </div>

                <p
                  className={`text-lg font-semibold leading-snug ${
                    primeRowLocked ? "text-rose-800" : "text-slate-900"
                  }`}
                >
                  {e.isPrime ? "Prime Order" : e.title}
                </p>

                <div className="text-xs text-slate-700 space-y-1.5">
                  <p>
                    <span className="font-medium">Order number</span>:{" "}
                    {e.orderNumber}
                  </p>
                  <p>
                    <span className="font-medium">Order quantity</span>:{" "}
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
                    {currencyRs(e.commissionRs)}
                    {e.isPrime ? " (x5)" : ""}
                  </p>
                  <p>
                    <span className="font-medium">Time</span>:{" "}
                    {formatTimestamp(e.createdAt)}
                  </p>
                </div>

                <div className="pt-1">
                  {e.status === "completed" ? (
                    <span className="inline-flex items-center justify-center rounded-full bg-black px-12 py-2.5 text-xs font-semibold text-white shadow">
                      Completed
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handlePendingDispose(e)}
                      disabled={
                        e.isPrime &&
                        e.status === "pending" &&
                        isPrimeContinueLocked
                      }
                      title={
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

      <ModalShell open={isPrimeCongratsOpen} onClose={() => setIsPrimeCongratsOpen(false)}>
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-amber-50 to-white" />
          <div
            className="absolute inset-0 opacity-40"
            style={{
              backgroundImage:
                "radial-gradient(circle at 10% 10%, rgba(245,158,11,.25) 0 10px, transparent 11px), radial-gradient(circle at 70% 20%, rgba(16,185,129,.25) 0 8px, transparent 9px), radial-gradient(circle at 30% 70%, rgba(168,85,247,.25) 0 9px, transparent 10px)",
            }}
          />

          <div className="relative px-4 pt-3 pb-4 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900 mx-auto">Grab Order</h2>
            <button
              type="button"
              onClick={() => setIsPrimeCongratsOpen(false)}
              className="absolute right-4 h-8 w-8 rounded-full hover:bg-slate-100 grid place-items-center text-slate-500"
              aria-label="Close prime notice"
            >
              ✕
            </button>
          </div>

          <div className="relative p-6 text-center space-y-4">
            <div className="mx-auto h-16 w-16 rounded-full bg-emerald-500 grid place-items-center shadow">
              <svg viewBox="0 0 24 24" className="h-9 w-9 text-white" fill="none" stroke="currentColor" strokeWidth="3">
                <path d="M20 6 9 17l-5-5" />
              </svg>
            </div>

            <div className="space-y-1">
              <p className="text-xl font-semibold text-slate-900">Congratulations!!</p>
              <p className="text-xs text-slate-600">
                You have received an exclusive booking.
              </p>
            </div>

            {primeReward ? (
              <div className="mx-auto w-full max-w-xs rounded-xl border border-slate-200 bg-white/90 p-3 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="relative h-14 w-20 rounded-md overflow-hidden border border-slate-200 bg-slate-50">
                    <Image
                      src={primeReward.image}
                      alt={primeReward.title}
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  </div>
                  <div className="min-w-0 text-left">
                    <div className="text-xs font-semibold text-slate-900 truncate">
                      {primeReward.title}
                    </div>
                    <div className="text-[11px] text-slate-600">
                      Prime order assigned by admin
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            <button
              type="button"
              onClick={() => setIsPrimeCongratsOpen(false)}
              className="w-full rounded-md bg-sky-600 py-3 text-sm font-semibold text-white shadow hover:bg-sky-700"
            >
              Book Now
            </button>
          </div>
        </div>
      </ModalShell>
      {toastMessage ? (
        <div className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-black/75 px-4 py-3 text-center text-sm font-medium text-white shadow">
          {toastMessage}
        </div>
      ) : null}
    </section>
  );
}

