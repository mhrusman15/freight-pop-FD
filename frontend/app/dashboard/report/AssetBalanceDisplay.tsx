"use client";

import { useAssetBalance } from "@/lib/use-asset-balance";

export function AssetBalanceDisplay() {
  const { formatted } = useAssetBalance();
  return <span className="text-xl font-semibold text-slate-900">{formatted}</span>;
}
