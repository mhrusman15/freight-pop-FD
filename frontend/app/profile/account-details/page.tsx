"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { userApi, type UserTaskActivityEntry } from "@/lib/api";

type FilterType = "all" | "pending" | "completed";

function formatAmount(value: number): string {
  const fixed = Number(value || 0).toFixed(2);
  return `Rs${fixed}`;
}

function formatOrderTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const mi = String(date.getMinutes()).padStart(2, "0");
  const ss = String(date.getSeconds()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`;
}

export default function AccountDetailsPage() {
  const router = useRouter();
  const [entries, setEntries] = useState<UserTaskActivityEntry[]>([]);
  const [filter, setFilter] = useState<FilterType>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    userApi
      .getTaskActivity()
      .then((res) => {
        if (cancelled) return;
        if (res.error || !res.data?.entries) {
          setError(res.error || "Failed to load account details.");
          setEntries([]);
          return;
        }
        setEntries(res.data.entries);
      })
      .catch(() => {
        if (cancelled) return;
        setError("Failed to load account details.");
        setEntries([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredEntries = useMemo(() => {
    if (filter === "all") return entries;
    return entries.filter((entry) => entry.status === filter);
  }, [entries, filter]);

  return (
    <main className="min-h-screen bg-[#d8edf8] pb-6">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white px-4 py-4">
        <div className="mx-auto flex w-full max-w-md items-center justify-between">
          <button
            type="button"
            onClick={() => router.back()}
            className="text-slate-700"
            aria-label="Back"
          >
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <h1 className="text-2xl font-semibold text-black">Account Details</h1>
          <div className="relative">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as FilterType)}
              className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm text-slate-700"
              aria-label="Filters"
            >
              <option value="all">Filters: All</option>
              <option value="pending">Filters: Pending</option>
              <option value="completed">Filters: Completed</option>
            </select>
          </div>
        </div>
      </header>

      <section className="mx-auto mt-4 w-full max-w-md space-y-4 px-3">
        {loading ? <p className="text-center text-sm text-slate-600">Loading history...</p> : null}
        {error ? <p className="rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</p> : null}
        {!loading && !error && filteredEntries.length === 0 ? (
          <p className="rounded-md bg-white p-4 text-center text-sm text-slate-600">No activity history found.</p>
        ) : null}

        {filteredEntries.map((entry) => (
          <article key={entry.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="text-xl font-semibold leading-tight text-black sm:text-2xl">{entry.title || "Activity"}</h2>
            <div className="my-3 h-px w-full bg-slate-200" />

            <div className="space-y-2 text-sm leading-tight text-black sm:text-base">
              <div className="flex items-center justify-between gap-3">
                <span>Order Number</span>
                <span className="text-right">{entry.orderNumber || "-"}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span>Balance before changes</span>
                <span className="text-right">{formatAmount(Number(entry.quantityRs || 0))}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span>Order Time</span>
                <span className="text-right">{formatOrderTime(entry.createdAt)}</span>
              </div>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}

