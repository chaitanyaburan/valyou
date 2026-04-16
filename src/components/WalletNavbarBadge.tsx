"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { formatAlgo, formatAlgoShort } from "@/lib/algo";
import { microToAlgo } from "@/lib/algorand-constants";
import { usePeraTestnet } from "@/components/providers/PeraTestnetProvider";
import { useWallet } from "@/components/providers/WalletProvider";
import { useWalletConnectionMode } from "@/components/providers/WalletConnectionModeProvider";

export default function WalletNavbarBadge() {
  const { mode, setMode } = useWalletConnectionMode();
  const mock = useWallet();
  const pera = usePeraTestnet();
  const [testnetReady, setTestnetReady] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/algorand/config");
        const data = (await res.json()) as { testnetReady?: boolean };
        setTestnetReady(Boolean(data.testnetReady));
      } catch {
        setTestnetReady(false);
      }
    })();
  }, []);

  const isDemo = mode === "demo";
  const address = isDemo ? mock.walletAddress : pera.activeAccount;
  const balanceLabel = isDemo
    ? formatAlgo(mock.balanceAlgo)
    : pera.balanceMicro != null
      ? formatAlgoShort(microToAlgo(pera.balanceMicro))
      : "—";

  const shortAddr = address
    ? `${address.slice(0, 5)}…${address.slice(-4)}`
    : isDemo
      ? "Offline demo"
      : "Not connected";

  return (
    <div className="flex items-center gap-1.5 rounded-full border border-card-border bg-card/80 px-1.5 py-1 sm:px-2.5 sm:py-1.5 text-[10px] sm:text-xs">
      <span className="hidden text-muted sm:inline">Wallet:</span>
      <div className="flex rounded-full bg-background/80 p-0.5">
        <button
          type="button"
          onClick={() => setMode("demo")}
          className={`rounded-full px-2 py-0.5 font-semibold transition ${
            isDemo ? "bg-accent text-white" : "text-muted hover:text-foreground"
          }`}
        >
          Demo
        </button>
        <button
          type="button"
          title={testnetReady ? "Pera + Algorand TestNet" : "Configure ALGORAND_DEMO_RECEIVER in .env.local"}
          onClick={() => setMode("testnet")}
          disabled={!testnetReady}
          className={`rounded-full px-2 py-0.5 font-semibold transition ${
            !isDemo ? "bg-accent text-white" : "text-muted hover:text-foreground"
          } disabled:cursor-not-allowed disabled:opacity-40`}
        >
          TestNet
        </button>
      </div>
      <div className="hidden min-w-0 flex-col leading-tight sm:flex">
        <span className="truncate font-mono text-[10px] text-muted">{shortAddr}</span>
        <span className="truncate font-semibold tabular-nums text-foreground">{balanceLabel}</span>
      </div>
      <Link
        href="/portfolio"
        className="shrink-0 rounded-full border border-accent/40 px-2 py-0.5 text-[10px] font-semibold text-accent-light transition hover:bg-accent/10 sm:text-xs"
      >
        Manage
      </Link>
    </div>
  );
}
