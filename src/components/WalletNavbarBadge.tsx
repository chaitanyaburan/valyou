"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { formatAlgoShort } from "@/lib/algo";
import { microToAlgo } from "@/lib/algorand-constants";
import { usePeraTestnet } from "@/components/providers/PeraTestnetProvider";
import { useWalletUserId } from "@/contexts/AuthContext";
import { apiGetWallet, type WalletData } from "@/lib/api-client";
import { APP_WALLET_REFRESH_EVENT } from "@/lib/app-wallet-events";

const POLL_MS = 8_000;

export default function WalletNavbarBadge() {
  const pera = usePeraTestnet();
  const walletUserId = useWalletUserId();
  const [appWallet, setAppWallet] = useState<WalletData | null>(null);

  const address = pera.activeAccount;
  const balanceLabel = pera.balanceMicro != null ? formatAlgoShort(microToAlgo(pera.balanceMicro)) : "—";

  const shortAddr = address ? `${address.slice(0, 5)}…${address.slice(-4)}` : "Pera not connected";

  const refreshPeraBalance = pera.refreshBalance;

  const refreshAppWallet = useCallback(async () => {
    try {
      const w = await apiGetWallet(walletUserId);
      setAppWallet(w);
    } catch {
      setAppWallet(null);
    }
  }, [walletUserId]);

  const refreshBoth = useCallback(async () => {
    await refreshAppWallet();
    await refreshPeraBalance();
  }, [refreshAppWallet, refreshPeraBalance]);

  useEffect(() => {
    void refreshBoth();
    const onCustom = () => {
      void refreshBoth();
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") void refreshBoth();
    };
    const onFocus = () => {
      void refreshBoth();
    };
    window.addEventListener(APP_WALLET_REFRESH_EVENT, onCustom);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("focus", onFocus);
    const intervalId = window.setInterval(() => {
      if (document.visibilityState === "visible") void refreshAppWallet();
    }, POLL_MS);
    return () => {
      window.removeEventListener(APP_WALLET_REFRESH_EVENT, onCustom);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("focus", onFocus);
      window.clearInterval(intervalId);
    };
  }, [refreshAppWallet, refreshBoth]);

  const appLabel = appWallet != null ? formatAlgoShort(appWallet.availableBalance) : "—";

  return (
    <div className="flex items-center gap-1.5 rounded-full border border-card-border bg-card/80 px-1.5 py-1 sm:px-2.5 sm:py-1.5 text-[10px] sm:text-xs">
      <span className="hidden text-muted sm:inline">Wallet:</span>
      <span className="rounded-full bg-accent px-2 py-0.5 font-semibold text-white">Pera</span>
      <div className="hidden min-w-0 flex-col leading-tight sm:flex">
        <span className="truncate font-mono text-[10px] text-muted">{shortAddr}</span>
        <span className="truncate font-semibold tabular-nums text-foreground">{balanceLabel}</span>
      </div>
      <span className="hidden h-4 w-px bg-card-border sm:block" aria-hidden />
      <div className="hidden min-w-0 flex-col leading-tight md:flex">
        <span className="flex items-center gap-1 text-[10px] text-muted">
          App
          <span className="inline-flex items-center gap-0.5 rounded-full bg-gain/15 px-1 py-px text-[8px] font-semibold uppercase tracking-wide text-gain">
            <span className="h-1 w-1 animate-pulse rounded-full bg-gain" aria-hidden />
            Live
          </span>
        </span>
        <span className="truncate font-semibold tabular-nums text-accent-light">{appLabel}</span>
      </div>
      <Link
        href="/wallet"
        className="shrink-0 rounded-full border border-accent/40 px-2 py-0.5 text-[10px] font-semibold text-accent-light transition hover:bg-accent/10 sm:text-xs"
      >
        Manage
      </Link>
      {!address && (
        <button
          type="button"
          onClick={() => void pera.connect()}
          disabled={pera.connecting}
          className="shrink-0 rounded-full border border-card-border px-2 py-0.5 text-[10px] font-semibold text-muted transition hover:border-accent/40 hover:text-foreground disabled:opacity-60 sm:text-xs"
        >
          {pera.connecting ? "…" : "Pera"}
        </button>
      )}
    </div>
  );
}
