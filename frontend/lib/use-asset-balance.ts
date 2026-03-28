"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  getAssetBalance,
  formatAssetBalance,
  setAssetBalance,
  ASSET_BALANCE_UPDATED,
  ASSET_BALANCE_STORAGE_KEY,
} from "./asset-balance-store";
import { userApi } from "./api";
import { getUserToken } from "./auth-store";

/**
 * Returns current asset balance (number) and formatted string.
 * When user is logged in (`user_access_token`), balance is fetched from the API (database).
 * When not logged in, uses localStorage store. Re-renders on ASSET_BALANCE_UPDATED.
 */
const LIVE_SYNC_MS = 2000;
const MIN_FETCH_GAP_MS = 800;
let inFlightFetch: Promise<void> | null = null;
let lastFetchAt = 0;

async function syncBalanceFromApi(): Promise<void> {
  const token = getUserToken();
  if (!token) return;
  const now = Date.now();
  if (inFlightFetch) return inFlightFetch;
  if (now - lastFetchAt < MIN_FETCH_GAP_MS) return;
  inFlightFetch = (async () => {
    try {
      const res = await userApi.getBalance();
      if (res.data?.balance != null) {
        const b = Number(res.data.balance);
        if (Number.isFinite(b)) {
          setAssetBalance(b);
        }
      }
    } finally {
      lastFetchAt = Date.now();
      inFlightFetch = null;
    }
  })();
  return inFlightFetch;
}

export function useAssetBalance(): { balance: number; formatted: string; refetch: () => Promise<void> } {
  const [balance, setBalanceState] = useState(getAssetBalance);
  const isFetchingRef = useRef(false);

  const refetch = useCallback(async () => {
    if (isFetchingRef.current) return;
    const token = getUserToken();
    if (!token) {
      setBalanceState(getAssetBalance());
      return;
    }
    isFetchingRef.current = true;
    try {
      await syncBalanceFromApi();
      setBalanceState(getAssetBalance());
    } finally {
      isFetchingRef.current = false;
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (getUserToken()) {
      void refetch();
    } else {
      setBalanceState(getAssetBalance());
    }
    const handler = () => setBalanceState(getAssetBalance());
    window.addEventListener(ASSET_BALANCE_UPDATED, handler);
    const onStorage = (e: StorageEvent) => {
      if (e.key === ASSET_BALANCE_STORAGE_KEY) setBalanceState(getAssetBalance());
    };
    window.addEventListener("storage", onStorage);
    const focusHandler = () => {
      if (getUserToken()) void refetch();
    };
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible" && getUserToken()) {
        void refetch();
      }
    }, LIVE_SYNC_MS);
    window.addEventListener("focus", focusHandler);
    document.addEventListener("visibilitychange", focusHandler);
    return () => {
      window.removeEventListener(ASSET_BALANCE_UPDATED, handler);
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", focusHandler);
      document.removeEventListener("visibilitychange", focusHandler);
      window.clearInterval(interval);
    };
  }, [refetch]);

  return { balance, formatted: formatAssetBalance(balance), refetch };
}
