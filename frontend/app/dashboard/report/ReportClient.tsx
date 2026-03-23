"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import {
  TOTAL_TASKS,
  createRandomTask,
  getTitleFromImageName,
  type Task,
} from "./data/tasks";
import { formatAssetBalance, getAssetBalance } from "@/lib/asset-balance-store";
import { userApi, type UserTaskActivityEntry, type UserTaskStatus } from "@/lib/api";

type ActivityStatus = "pending" | "completed";
type ActivityEntry = {
  id: string;
  title: string;
  orderNumber: string;
  quantityRs: number;
  commissionRs: number;
  createdAt: Date;
  status: ActivityStatus;
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
    if (chunk.length === 0) continue;
    const latest = chunk[0];
    const totalQuantity = chunk.reduce((sum, entry) => sum + entry.quantityRs, 0);
    const totalCommission = chunk.reduce((sum, entry) => sum + entry.commissionRs, 0);
    notifications.push({
      id: `completed-summary-${latest.id}-${chunk.length}`,
      title:
        chunk.length >= cycleSize
          ? `${cycleSize} Tasks Completed Report`
          : `${chunk.length} Tasks Completed`,
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
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [totalCapital, setTotalCapital] = useState<number>(() =>
    getAssetBalance(),
  );
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
  const [adminAssignReceiptDone, setAdminAssignReceiptDone] = useState(false);
  const [lastAssignmentGrantAt, setLastAssignmentGrantAt] = useState<string | null>(null);
  const [waitingForAdminReassign, setWaitingForAdminReassign] = useState(false);
  const [failedMessage, setFailedMessage] = useState("You have unfinished orders, please deal with them in time");
  const [toastMessage, setToastMessage] = useState("");

  const total = TOTAL_TASKS;
  const safeIndex = ((currentTaskIndex % total) + total) % total;

  const progressLabel = useMemo(
    () => `Task ${safeIndex + 1} / ${total}`,
    [safeIndex, total],
  );
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
      if (res.data) {
        setTaskStatus(res.data);
        const grantedAt = res.data.taskAssignmentGrantedAt ?? null;
        if (grantedAt && grantedAt !== lastAssignmentGrantAt) {
          setLastAssignmentGrantAt(grantedAt);
          setAdminAssignReceiptDone(false);
          setCompletedInCycle(0);
          setWaitingForAdminReassign(false);
        }
      }
      return res;
    });

  const loadTaskActivity = () =>
    userApi.getTaskActivity().then((res) => {
      if (!res.data?.entries) return;
      const mapped: ActivityEntry[] = res.data.entries.map((e: UserTaskActivityEntry) => ({
        id: e.id,
        title: e.title,
        orderNumber: e.orderNumber,
        quantityRs: Number(e.quantityRs || 0),
        commissionRs: Number(e.commissionRs || 0),
        createdAt: new Date(e.createdAt),
        status: e.status,
      }));
      setActivityEntries(mapped);
    });

  useEffect(() => {
    void refreshTaskStatus();
    void loadTaskActivity();
  }, []);

  const openTaskModal = () => {
    if (isAdminAssignedCyclePending) {
      setFailedMessage("check your acitivty track");
      setIsFailedModalOpen(true);
      return;
    }
    userApi.openTask().then((res) => {
      if (res.error && res.data?.code === "PRIME_ORDER_PENDING") {
        setFailedMessage("check your acitivty task you get prime order");
        setToastMessage("Insufficient balance, please recharge and try again");
        window.setTimeout(() => setToastMessage(""), 2200);
        setIsFailedModalOpen(true);
        void loadTaskActivity();
        return;
      }
      if (res.error || !res.data || !res.data.task) {
        setFailedMessage("You have unfinished orders, please deal with them in time");
        setIsFailedModalOpen(true);
        return;
      }
      if (waitingForAdminReassign || !res.data.status?.canPerformTasks) {
        setFailedMessage("You have unfinished orders, please deal with them in time");
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
      setFailedMessage("You have unfinished orders, please deal with them in time");
      setIsFailedModalOpen(true);
    });
  };

  const submitTask = () => {
    setIsTaskModalOpen(false);
    setIsSuccessModalOpen(true);
  };

  const confirmSuccess = () => {
    if (isConfirming) return;
    setIsConfirming(true);
    userApi.completeTask(activePendingEntryId || undefined).then((res) => {
      if (res.error) {
        if ((res.data as { code?: string } | undefined)?.code === "PRIME_ORDER_PENDING") {
          setFailedMessage("check your acitivty task you get prime order");
          setToastMessage("Insufficient balance, please recharge and try again");
          window.setTimeout(() => setToastMessage(""), 2200);
        } else {
          setFailedMessage("You have unfinished orders, please deal with them in time");
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
      setTotalCapital((c) => c + activeTask.commission);
      setInstantProfit((p) => p + activeTask.commission);
      setCurrentTaskIndex((i) => (i + 1) % total);
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
    if (selectedGiftBox !== null) return;
    const reward = createRandomTask(Math.floor(Math.random() * total) + 1);
    setSelectedGiftBox(boxIndex);
    setGiftRewardTask(reward);
  };

  const closeRewardModal = () => {
    setIsRewardModalOpen(false);
    setSelectedGiftBox(null);
    setGiftRewardTask(null);
  };

  const filteredActivityEntries = useMemo(() => {
    const hasAdminApproval = Boolean(taskStatus?.taskAssignmentGrantedAt);
    if (!hasAdminApproval) return [];

    const pendingEntries = activityEntries.filter((e) => e.status === "pending");
    const completedNotifications = buildCompletedNotifications(activityEntries, total);
    const canShowDisposeEntries =
      isAdminAssignedCyclePending;
    const virtualPendingNeeded =
      canShowDisposeEntries &&
      pendingEntries.length === 0;
    const virtualPending: ActivityEntry[] = virtualPendingNeeded
      ? [
          {
            id: "admin-assigned-pending",
            title: `Admin Assigned Tasks (${taskStatus?.remaining ?? 0} remaining)`,
            orderNumber: "Assigned by admin",
            quantityRs: 0,
            commissionRs: 0,
            createdAt: new Date(),
            status: "pending",
          },
        ]
      : [];
    const visiblePendingEntries = canShowDisposeEntries
      ? [...virtualPending, ...pendingEntries]
      : [];
    const allEntries = [...visiblePendingEntries, ...completedNotifications];

    if (activityTab === "all") return allEntries;
    if (activityTab === "pending") return visiblePendingEntries;
    return allEntries.filter((e) => e.status === "completed");
  }, [activityEntries, activityTab, taskStatus, isAdminAssignedCyclePending, total]);

  const handlePendingDispose = (entry: ActivityEntry) => {
    if (entry.id === "admin-assigned-pending") {
      const now = new Date();
      setActivityEntries((prev) => [
        {
          id: uniqueId("assign-receipt"),
          title: "Admin Assigned Tasks (collected)",
          orderNumber: "Assigned by admin",
          quantityRs: 0,
          commissionRs: 0,
          createdAt: now,
          status: "completed",
        },
        ...prev,
      ]);
      setAdminAssignReceiptDone(true);
      setToastMessage("Collected. You can now perform tasks.");
      window.setTimeout(() => setToastMessage(""), 1800);
      return;
    }
    setToastMessage("Insufficient balance, please recharge and try again");
    window.setTimeout(() => setToastMessage(""), 2200);
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
          <span className="text-xl font-semibold text-slate-900">
            {formatAssetBalance(totalCapital)}
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
            <p className="text-sm font-semibold">{currencyRs(instantProfit)}</p>
          </div>
          <div className="space-y-1">
            <p className="flex items-center gap-1.5 font-medium">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 text-[10px]">
                ⏱
              </span>
              Pursuit
            </p>
            <p className="text-sm font-semibold">{safeIndex + 1}/30</p>
          </div>
          <div className="space-y-1">
            <p className="flex items-center gap-1.5 font-medium">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 text-[10px]">
                🛡
              </span>
              Protected Reserve
            </p>
            <p className="text-sm font-semibold">Rs0.00</p>
          </div>
          <div className="space-y-1">
            <p className="flex items-center gap-1.5 font-medium">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 text-[10px]">
                💼
              </span>
              Campaign Wallet
            </p>
            <p className="text-sm font-semibold">Rs0</p>
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
          className="w-full rounded-md bg-sky-600 py-2.5 text-sm font-semibold text-white shadow hover:bg-sky-700"
        >
          Enter Access
        </button>
        <button
          type="button"
          onClick={() => {
            refreshTaskStatus();
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
            filteredActivityEntries.map((e) => (
              <div
                key={e.id}
                className="rounded-2xl border border-slate-200 bg-white shadow-sm p-5 space-y-4"
              >
                <div className="space-y-3">
                  <p className="text-right text-sm font-semibold text-slate-800">
                    Brand Vault
                  </p>
                  <div className="h-px w-full bg-slate-200" />
                </div>

                <p className="text-lg font-semibold text-slate-900 leading-snug">
                  {e.title}
                </p>

                <div className="text-xs text-slate-700 space-y-1.5">
                  <p>
                    <span className="font-medium">Order number</span>:{" "}
                    {e.orderNumber}
                  </p>
                  <p>
                    <span className="font-medium">Order quantity</span>:{" "}
                    {currencyRs(e.quantityRs)}
                  </p>
                  <p>
                    <span className="font-medium">Commission</span>:{" "}
                    {currencyRs(e.commissionRs)}
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
                      className="inline-flex items-center justify-center rounded-full bg-sky-600 px-12 py-2.5 text-xs font-semibold text-white shadow hover:bg-sky-700"
                    >
                      Dispose
                    </button>
                  )}
                </div>
              </div>
            ))
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
      {toastMessage ? (
        <div className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-black/75 px-4 py-3 text-center text-sm font-medium text-white shadow">
          {toastMessage}
        </div>
      ) : null}
    </section>
  );
}

