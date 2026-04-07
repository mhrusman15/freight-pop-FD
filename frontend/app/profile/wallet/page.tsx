"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getUserData, getUserToken } from "@/lib/auth-store";
import { userApi } from "@/lib/api";

type Network = "Visa" | "Mastercard" | "PayPak" | "Unknown";
type CardType = "Debit" | "Credit" | "Prepaid" | "Unknown";

type BinRule = {
  prefix: string; // 4-6 digits (e.g. "4183" for 4183xx)
  bank: string;
  network: Exclude<Network, "Unknown">;
  type?: Exclude<CardType, "Unknown">;
};

const PK_BIN_RULES: BinRule[] = [
  // Visa (4...)
  { prefix: "4214", bank: "Habib Bank Limited", network: "Visa", type: "Debit" },
  { prefix: "4033", bank: "Habib Bank Limited", network: "Visa", type: "Debit" },
  { prefix: "4181", bank: "United Bank Limited", network: "Visa", type: "Debit" },
  { prefix: "4540", bank: "United Bank Limited", network: "Visa", type: "Debit" },
  { prefix: "4183", bank: "Meezan Bank", network: "Visa", type: "Debit" },
  { prefix: "4068", bank: "Meezan Bank", network: "Visa", type: "Debit" },
  { prefix: "4217", bank: "MCB Bank", network: "Visa", type: "Debit" },
  { prefix: "4571", bank: "Bank Alfalah", network: "Visa", type: "Debit" },
  { prefix: "4111", bank: "Standard Chartered Pakistan", network: "Visa", type: "Debit" },

  // Mastercard (5... / 2-series)
  { prefix: "5199", bank: "Habib Bank Limited", network: "Mastercard", type: "Debit" },
  { prefix: "5211", bank: "United Bank Limited", network: "Mastercard", type: "Debit" },
  { prefix: "5264", bank: "Meezan Bank", network: "Mastercard", type: "Debit" },
  { prefix: "5577", bank: "MCB Bank", network: "Mastercard", type: "Debit" },
  { prefix: "5255", bank: "Bank Alfalah", network: "Mastercard", type: "Debit" },

  // PayPak (62 / 627...)
  { prefix: "6271", bank: "Habib Bank Limited", network: "PayPak", type: "Debit" },
  { prefix: "6272", bank: "United Bank Limited", network: "PayPak", type: "Debit" },
  { prefix: "6273", bank: "Meezan Bank", network: "PayPak", type: "Debit" },
  { prefix: "6275", bank: "Bank of Punjab", network: "PayPak", type: "Debit" },
  { prefix: "6274", bank: "Allied Bank", network: "PayPak", type: "Debit" },

  // Wallets / microfinance
  { prefix: "5310", bank: "JazzCash", network: "Mastercard", type: "Prepaid" },
  { prefix: "4891", bank: "Easypaisa", network: "Visa", type: "Prepaid" },
  { prefix: "5599", bank: "SadaPay", network: "Mastercard", type: "Prepaid" },
  { prefix: "5399", bank: "NayaPay", network: "Mastercard", type: "Prepaid" },
];

function digitsOnly(v: string) {
  return v.replace(/\D/g, "");
}

function detectNetwork(cardNumber: string): Network {
  const n = digitsOnly(cardNumber);
  if (!n) return "Unknown";
  if (/^4/.test(n)) return "Visa";
  if (/^5[1-5]/.test(n) || /^2(2[2-9]|[3-6]\d|7[01]|720)/.test(n)) return "Mastercard";
  if (/^(62|627)/.test(n)) return "PayPak";
  return "Unknown";
}

function luhnCheck(cardNumber: string) {
  const n = digitsOnly(cardNumber);
  if (n.length < 12) return false;
  let sum = 0;
  let doubleDigit = false;
  for (let i = n.length - 1; i >= 0; i--) {
    let d = Number(n[i]);
    if (doubleDigit) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    doubleDigit = !doubleDigit;
  }
  return sum % 10 === 0;
}

function formatCardNumber(cardNumber: string, network: Network) {
  const n = digitsOnly(cardNumber);
  const clipped = n.slice(0, 16);
  const raw = clipped.padEnd(16, "0");
  if (network === "Unknown" && !n) return "0000 0000 0000 0000";
  return raw.match(/.{1,4}/g)?.join(" ") ?? "0000 0000 0000 0000";
}

function lookupPkBin(cardNumber: string) {
  const n = digitsOnly(cardNumber);
  if (n.length < 4) return null;
  const first6 = n.slice(0, 6);
  const first4 = n.slice(0, 4);
  return (
    PK_BIN_RULES.find((r) => r.prefix.length === 6 && r.prefix === first6) ??
    PK_BIN_RULES.find((r) => r.prefix.length === 4 && r.prefix === first4) ??
    null
  );
}

function normalizeName(v: string) {
  return v.trim().toLowerCase().replace(/\s+/g, " ");
}

function evaluateCard(cardNumber: string, enteredBankName: string) {
  const network = detectNetwork(cardNumber);
  const bin = lookupPkBin(cardNumber);
  const luhnValid = luhnCheck(cardNumber);

  const detectedBank = bin?.bank ?? "Unknown Bank";
  const type: CardType = bin?.type ?? "Unknown";

  const entered = normalizeName(enteredBankName);
  const detected = normalizeName(detectedBank);
  const bankMismatch = !!entered && detectedBank !== "Unknown Bank" && entered !== detected;

  const status: "Likely Valid" | "Unknown BIN" | "Mismatch" | "Invalid" =
    !luhnValid || network === "Unknown" ? "Invalid" : bankMismatch ? "Mismatch" : !bin ? "Unknown BIN" : "Likely Valid";

  return { network, detectedBank, type, luhnValid, status };
}

type CardTheme = "purple" | "blue" | "black";

function getThemeForBank(bankName: string): CardTheme {
  const b = normalizeName(bankName);
  if (!b) return "purple";
  if (b.includes("meezan")) return "black";
  if (
    b.includes("habib") ||
    b.includes("united bank") ||
    b.includes("mcb") ||
    b.includes("alfalah") ||
    b.includes("standard chartered")
  ) {
    return "blue";
  }
  // Wallets and unknowns: keep vibrant default
  return "purple";
}

export default function ProfileWalletPage() {
  const router = useRouter();
  const emptyForm = {
    mobilePhone: "",
    accountHolderName: "",
    accountNumber: "",
    bankName: "",
    branch: "",
    routingNumber: "",
  };
  const [mounted, setMounted] = useState(false);
  const [formData, setFormData] = useState(emptyForm);
  const [loadingCard, setLoadingCard] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasSavedCard, setHasSavedCard] = useState(false);
  const [isEditing, setIsEditing] = useState(true);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState("");
  const [unlinking, setUnlinking] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const token = getUserToken();
    const user = getUserData();
    const isUserSession = !!token && !!user && user.role !== "admin" && user.role !== "super_admin";
    if (!isUserSession) {
      router.replace("/login");
      return;
    }
    setMounted(true);

    async function loadWalletCard() {
      setLoadingCard(true);
      const res = await userApi.getWalletCard();
      if (res.data) {
        const next = {
          mobilePhone: res.data.mobilePhone || "",
          accountHolderName: res.data.accountHolderName || "",
          accountNumber: res.data.accountNumber || "",
          bankName: res.data.bankName || "",
          branch: res.data.branch || "",
          routingNumber: res.data.routingNumber || "",
        };
        setFormData(next);
        setHasSavedCard(Boolean(res.data.hasCard));
        setIsEditing(!res.data.hasCard);
      } else {
        setFormData(emptyForm);
        setHasSavedCard(false);
        setIsEditing(true);
      }
      setLoadingCard(false);
    }

    loadWalletCard();
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isEditing) return;
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");
    setSubmitSuccess("");
    setSaving(true);
    const res = await userApi.saveWalletCard(formData);
    setSaving(false);
    if (res.error || !res.data?.card) {
      setSubmitError(res.error || "Failed to save card information");
      return;
    }
    setFormData({
      mobilePhone: res.data.card.mobilePhone || "",
      accountHolderName: res.data.card.accountHolderName || "",
      accountNumber: res.data.card.accountNumber || "",
      bankName: res.data.card.bankName || "",
      branch: res.data.card.branch || "",
      routingNumber: res.data.card.routingNumber || "",
    });
    setHasSavedCard(true);
    setIsEditing(false);
    setSubmitSuccess("Card information saved successfully.");
  };

  const cardEval = evaluateCard(formData.accountNumber, formData.bankName);
  const displayBank = cardEval.detectedBank !== "Unknown Bank" ? cardEval.detectedBank : formData.bankName?.trim() ? formData.bankName : "Unknown Bank";

  if (!mounted) {
    return (
      <main className="min-h-screen bg-white dark:bg-slate-900">
        <header className="sticky top-0 z-20 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
          <div className="flex min-h-[3rem] items-center justify-center px-4">
            <div className="absolute left-4 h-6 w-6 rounded bg-slate-200 dark:bg-slate-600" />
            <div className="h-5 w-20 rounded bg-slate-200 dark:bg-slate-600" />
          </div>
        </header>
        <div className="fp-container py-8">
          <div className="mx-auto max-w-sm animate-pulse space-y-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-12 rounded-lg bg-slate-200 dark:bg-slate-700" />
            ))}
            <div className="h-12 rounded-lg bg-slate-200 dark:bg-slate-700" />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white dark:bg-slate-900">
      <header className="sticky top-0 z-20 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
        <div className="flex min-h-[3rem] items-center justify-center px-4">
          <button
            type="button"
            onClick={() => (typeof window !== "undefined" && window.history.length > 1 ? router.back() : router.push("/profile"))}
            className="absolute left-4 flex items-center text-slate-900 dark:text-slate-100 hover:text-slate-600 dark:hover:text-slate-300"
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
          <h1 className="text-lg font-bold uppercase tracking-wide text-slate-900 dark:text-slate-100">
            User Wallet
          </h1>
        </div>
      </header>

      <div className="fp-container py-8">
        <div className="mx-auto max-w-sm">
          <form onSubmit={handleSubmit} className="space-y-5">
          {loadingCard ? (
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
              Loading saved card information...
            </div>
          ) : null}
          {submitError ? (
            <div className="rounded-lg border border-rose-300 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
              {submitError}
            </div>
          ) : null}
          {submitSuccess ? (
            <div className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
              {submitSuccess}
            </div>
          ) : null}
          <div>
            <label
              htmlFor="mobilePhone"
              className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              Mobile phone number
            </label>
            <input
              id="mobilePhone"
              name="mobilePhone"
              type="tel"
              value={formData.mobilePhone}
              onChange={handleChange}
              disabled={!isEditing || saving}
              placeholder=""
              className="w-full rounded-lg border border-slate-300 disabled:cursor-not-allowed disabled:opacity-70 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-3 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label
              htmlFor="accountHolderName"
              className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              Account Holder Name
            </label>
            <input
              id="accountHolderName"
              name="accountHolderName"
              type="text"
              value={formData.accountHolderName}
              onChange={handleChange}
              disabled={!isEditing || saving}
              placeholder=""
              className="w-full rounded-lg border border-slate-300 disabled:cursor-not-allowed disabled:opacity-70 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-3 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label
              htmlFor="accountNumber"
              className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              Bank/Card Number
            </label>
            <input
              id="accountNumber"
              name="accountNumber"
              type="text"
              inputMode="numeric"
              value={formData.accountNumber}
              onChange={handleChange}
              disabled={!isEditing || saving}
              placeholder="e.g. 4183 45..."
              className="w-full rounded-lg border border-slate-300 disabled:cursor-not-allowed disabled:opacity-70 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-3 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <div className="mt-2 flex items-center justify-between text-xs">
              <p className="text-slate-600 dark:text-slate-400">
                Detected: <span className="font-semibold text-slate-800 dark:text-slate-200">{cardEval.detectedBank}</span> •{" "}
                <span className="font-semibold text-slate-800 dark:text-slate-200">{cardEval.network}</span>
              </p>
              <p
                className={
                  "font-semibold " +
                  (cardEval.status === "Likely Valid"
                    ? "text-emerald-600 dark:text-emerald-400"
                    : cardEval.status === "Unknown BIN"
                      ? "text-amber-600 dark:text-amber-400"
                      : cardEval.status === "Mismatch"
                        ? "text-rose-600 dark:text-rose-400"
                        : "text-slate-600 dark:text-slate-400")
                }
              >
                {cardEval.status}
              </p>
            </div>
          </div>
          <div>
            <label
              htmlFor="bankName"
              className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              Bank name
            </label>
            <input
              id="bankName"
              name="bankName"
              type="text"
              value={formData.bankName}
              onChange={handleChange}
              disabled={!isEditing || saving}
              placeholder="Optional (used to detect mismatch)"
              className="w-full rounded-lg border border-slate-300 disabled:cursor-not-allowed disabled:opacity-70 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-3 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label
              htmlFor="branch"
              className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              Branch
            </label>
            <input
              id="branch"
              name="branch"
              type="text"
              value={formData.branch}
              onChange={handleChange}
              disabled={!isEditing || saving}
              placeholder=""
              className="w-full rounded-lg border border-slate-300 disabled:cursor-not-allowed disabled:opacity-70 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-3 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label
              htmlFor="routingNumber"
              className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              Routing Number
            </label>
            <input
              id="routingNumber"
              name="routingNumber"
              type="text"
              inputMode="numeric"
              value={formData.routingNumber}
              onChange={handleChange}
              disabled={!isEditing || saving}
              placeholder=""
              className="w-full rounded-lg border border-slate-300 disabled:cursor-not-allowed disabled:opacity-70 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-3 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          {isEditing ? (
            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-lg bg-orange-500 py-3.5 text-base font-semibold text-white shadow hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-70 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
            >
              {saving ? "Saving..." : hasSavedCard ? "Update Card Information" : "Confirm"}
            </button>
          ) : null}

          {hasSavedCard ? (
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => {
                  setSubmitError("");
                  setSubmitSuccess("");
                  setIsEditing(true);
                }}
                className="w-full rounded-lg border border-slate-900 bg-slate-900 py-3.5 text-base font-semibold leading-normal text-white shadow hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200 dark:focus:ring-offset-slate-900"
              >
                Change Card Information
              </button>

              <button
                type="button"
                disabled={unlinking || saving}
                onClick={async () => {
                  const withdrawalPassword = window.prompt("Enter withdrawal password to unlink card") || "";
                  if (!withdrawalPassword.trim()) return;
                  const confirmed = window.confirm("Are you sure you want to unlink and delete card information?");
                  if (!confirmed) return;
                  setSubmitError("");
                  setSubmitSuccess("");
                  setUnlinking(true);
                  const res = await userApi.unlinkWalletCard(withdrawalPassword);
                  setUnlinking(false);
                  if (res.error) {
                    setSubmitError(res.error);
                    return;
                  }
                  setFormData(emptyForm);
                  setHasSavedCard(false);
                  setIsEditing(true);
                  setSubmitSuccess("Card information unlinked successfully.");
                }}
                className="w-full rounded-lg border border-rose-700 bg-rose-700 py-3.5 text-base font-semibold text-white shadow hover:bg-rose-800 disabled:cursor-not-allowed disabled:opacity-70 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
              >
                {unlinking ? "Unlinking..." : "Unlink Bank Detail"}
              </button>
            </div>
          ) : null}
          </form>
        </div>
      </div>
    </main>
  );
}
