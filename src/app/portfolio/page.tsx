"use client";

import { useEffect, useMemo, useState } from "react";
import { usePeraTestnet } from "@/components/providers/PeraTestnetProvider";
import { useWalletConnectionMode } from "@/components/providers/WalletConnectionModeProvider";
import { useWallet } from "@/components/providers/WalletProvider";
import { formatAlgo, formatAlgoShort } from "@/lib/algo";
import { TESTNET_FAUCET_URL, algoToMicro, clampPaymentMicro, microToAlgo } from "@/lib/algorand-constants";
import { signAndSubmitTestnetPayment } from "@/lib/testnet-investment-client";
import type { StartupProject } from "@/lib/mock-store";

type Investment = {
  user_wallet: string;
  project_id: string;
  tokens_owned: number;
  transaction_hash: string;
};

function mockTxId(): string {
  return `algo-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function PortfolioDashboard() {
  const mock = useWallet();
  const { mode, setMode } = useWalletConnectionMode();
  const pera = usePeraTestnet();
  const [testnetReady, setTestnetReady] = useState(false);

  const walletAddress = mode === "demo" ? mock.walletAddress : pera.activeAccount;

  const [projects, setProjects] = useState<StartupProject[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [withdrawingHash, setWithdrawingHash] = useState<string | null>(null);
  const [investingProjectId, setInvestingProjectId] = useState<string | null>(null);
  const [activeInvestProject, setActiveInvestProject] = useState<StartupProject | null>(null);
  const [draftShares, setDraftShares] = useState(1);
  const [confirmingPurchase, setConfirmingPurchase] = useState(false);
  const [txState, setTxState] = useState("");

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    void (async () => {
      const response = await fetch("/api/projects");
      const data = (await response.json()) as { projects: StartupProject[] };
      setProjects(data.projects);
    })();
  }, []);

  useEffect(() => {
    if (!walletAddress) return;
    void (async () => {
      const response = await fetch(`/api/investments?wallet=${walletAddress}`);
      const data = (await response.json()) as { investments: Investment[] };
      setInvestments(data.investments);
    })();
  }, [walletAddress]);

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

  const investmentRows = useMemo(() => {
    return investments.map((investment) => {
      const project = projects.find((item) => item.id === investment.project_id);
      const basePrice = project?.price_per_token ?? 0;
      const utilization = project ? project.sold_tokens / project.total_tokens : 0;
      const currentPrice = basePrice * (1 + utilization * 0.2);
      const investedAlgo = basePrice * investment.tokens_owned;
      const currentValueAlgo = currentPrice * investment.tokens_owned;
      return {
        ...investment,
        projectName: project?.name ?? investment.project_id,
        basePrice,
        currentPrice,
        investedAlgo,
        currentValueAlgo,
        pnlAlgo: currentValueAlgo - investedAlgo,
      };
    });
  }, [investments, projects]);

  const totalInvestedAlgo = investmentRows.reduce((sum, item) => sum + item.investedAlgo, 0);
  const totalCurrentValueAlgo = investmentRows.reduce((sum, item) => sum + item.currentValueAlgo, 0);
  const totalPnlAlgo = totalCurrentValueAlgo - totalInvestedAlgo;

  const balanceLabel =
    mode === "demo"
      ? formatAlgo(mock.balanceAlgo)
      : pera.balanceMicro != null
        ? formatAlgoShort(microToAlgo(pera.balanceMicro))
        : "Loading…";

  const isWalletConnected = mode === "demo" ? Boolean(mock.walletAddress) : Boolean(pera.activeAccount);
  const isWalletBusy = mode === "demo" ? mock.connecting : pera.connecting;

  async function handleAddBalance() {
    if (mode === "demo") {
      try {
        await mock.requestAirdrop(10);
        setToast(`Added ${formatAlgo(10)} to your wallet (demo).`);
      } catch (error) {
        setToast(error instanceof Error ? error.message : "Could not add balance.");
      }
      return;
    }
    setToast("Use the TestNet faucet to add ALGO, then tap refresh in the nav wallet.");
    window.open(TESTNET_FAUCET_URL, "_blank", "noopener,noreferrer");
    await pera.refreshBalance();
  }

  async function handleConnectWallet() {
    try {
      if (mode === "demo") await mock.connectWallet();
      else await pera.connect();
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Unable to connect wallet.");
    }
  }

  async function handleWithdrawInvestment(row: (typeof investmentRows)[number]) {
    if (!walletAddress) {
      setToast("Connect wallet first.");
      return;
    }

    setWithdrawingHash(row.transaction_hash);
    try {
      await fetch("/api/investments", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_wallet: walletAddress,
          project_id: row.project_id,
          tokens_owned: row.tokens_owned,
          transaction_hash: row.transaction_hash,
        }),
      });

      if (mode === "demo") mock.creditAlgo(row.currentValueAlgo);

      const refreshed = await fetch(`/api/investments?wallet=${walletAddress}`);
      const data = (await refreshed.json()) as { investments: Investment[] };
      setInvestments(data.investments);
      await (mode === "demo" ? mock.refreshBalance() : pera.refreshBalance());
      setToast(
        mode === "demo"
          ? `Withdrawn ${formatAlgo(row.currentValueAlgo)} back to your wallet.`
          : "Removed from portfolio. (TestNet ALGO was already sent on-chain; this only updates the app.)",
      );
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Withdrawal failed");
    } finally {
      setWithdrawingHash(null);
    }
  }

  async function handleInvest(project: StartupProject, shares: number) {
    if (!walletAddress) {
      setToast("Connect wallet first.");
      return;
    }

    const safeShares = Math.max(1, shares);
    const totalCost = safeShares * project.price_per_token;

    if (mode === "demo") {
      if (!mock.trySpendAlgo(totalCost)) {
        setToast(`Insufficient balance. You need ${formatAlgo(totalCost)}.`);
        return;
      }
    } else {
      if (!testnetReady) {
        setToast("TestNet is not configured. Set ALGORAND_DEMO_RECEIVER in .env.local.");
        return;
      }
      if (!pera.activeAccount) {
        setToast("Connect Pera Wallet first (TestNet).");
        return;
      }
      const needMicro = clampPaymentMicro(algoToMicro(totalCost)) + 3000;
      if (pera.balanceMicro != null && pera.balanceMicro < needMicro) {
        setToast(`Insufficient on-chain balance. Need about ${formatAlgo(totalCost)} plus fees.`);
        return;
      }
    }

    setInvestingProjectId(project.id);
    setTxState(mode === "demo" ? "Processing purchase..." : "Building transaction…");
    try {
      let signature: string;
      if (mode === "demo") {
        signature = mockTxId();
      } else {
        setTxState("Waiting for signature in Pera…");
        signature = await signAndSubmitTestnetPayment({
          sender: pera.activeAccount!,
          costAlgo: totalCost,
          note: { app: "valyou-portfolio", projectId: project.id, tokens: safeShares },
          signTransactionGroup: pera.signTransactionGroup,
        });
        setTxState("Confirming on Algorand…");
      }

      await fetch("/api/investments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_wallet: walletAddress,
          project_id: project.id,
          tokens_owned: safeShares,
          transaction_hash: signature,
        }),
      });

      const refreshed = await fetch(`/api/investments?wallet=${walletAddress}`);
      const data = (await refreshed.json()) as { investments: Investment[] };
      setInvestments(data.investments);
      await (mode === "demo" ? mock.refreshBalance() : pera.refreshBalance());
      setTxState("Purchase complete ✅");
      setToast(`Invested in ${project.name}: ${safeShares} shares for ${formatAlgo(totalCost)}.`);
      setActiveInvestProject(null);
      setConfirmingPurchase(false);
    } catch (error) {
      if (mode === "demo") mock.creditAlgo(totalCost);
      setToast(error instanceof Error ? error.message : "Purchase failed");
      setTxState("");
    } finally {
      setTimeout(() => setTxState(""), 1500);
      setInvestingProjectId(null);
    }
  }

  function openInvestModal(project: StartupProject) {
    setActiveInvestProject(project);
    setDraftShares(1);
    setConfirmingPurchase(false);
  }

  return (
    <section className="py-8 space-y-5">
      <h1 className="text-3xl font-bold tracking-tight">User Dashboard</h1>
      {txState && (
        <div className="glass-card border border-accent/40 p-3 text-sm text-accent-light">{txState}</div>
      )}

      <div className="glass-card p-4 space-y-4">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setMode("demo")}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              mode === "demo" ? "bg-accent text-white" : "border border-card-border text-muted hover:text-foreground"
            }`}
          >
            Demo wallet
          </button>
          <button
            type="button"
            title={testnetReady ? "" : "Set ALGORAND_DEMO_RECEIVER in .env.local"}
            onClick={() => setMode("testnet")}
            disabled={!testnetReady}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              mode === "testnet" ? "bg-accent text-white" : "border border-card-border text-muted hover:text-foreground"
            } disabled:cursor-not-allowed disabled:opacity-40`}
          >
            Pera TestNet
          </button>
        </div>

        {mode === "testnet" && !testnetReady ? (
          <p className="text-sm text-amber-200/90">
            TestNet payments need <code className="rounded bg-black/20 px-1">ALGORAND_DEMO_RECEIVER</code> in{" "}
            <code className="rounded bg-black/20 px-1">.env.local</code>, then restart the dev server.
          </p>
        ) : null}

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void handleConnectWallet()}
            disabled={isWalletConnected || isWalletBusy}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent-light disabled:opacity-60"
          >
            {isWalletConnected
              ? mode === "demo"
                ? "Demo wallet connected"
                : "Pera connected"
              : isWalletBusy
                ? "Connecting…"
                : mode === "demo"
                  ? "Connect demo wallet"
                  : "Connect Pera (TestNet)"}
          </button>
          {mode === "testnet" && pera.connected ? (
            <button
              type="button"
              onClick={() => void pera.disconnect()}
              className="rounded-lg border border-card-border px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-card"
            >
              Disconnect Pera
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => void handleAddBalance()}
            disabled={!isWalletConnected}
            className="rounded-lg bg-gain px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
          >
            {mode === "demo" ? "Add balance (+10 ALGO)" : "Faucet + refresh balance"}
          </button>
          {mode === "testnet" ? (
            <button
              type="button"
              onClick={() => void pera.refreshBalance()}
              disabled={!pera.activeAccount}
              className="rounded-lg border border-card-border px-4 py-2 text-sm font-semibold transition hover:bg-card disabled:opacity-50"
            >
              Refresh on-chain balance
            </button>
          ) : null}
        </div>

        <div className="rounded-lg border border-card-border p-3">
          <p className="text-xs text-muted">
            {mode === "demo" ? "Demo balance (stored in this browser)" : "On-chain balance (Algorand TestNet)"}
          </p>
          <p className="text-lg font-semibold">{balanceLabel}</p>
          {walletAddress ? (
            <p className="mt-1 break-all text-[10px] text-muted">{walletAddress}</p>
          ) : (
            <p className="mt-1 text-[10px] text-muted">
              {mode === "demo" ? "Not connected" : "Connect Pera to see your TestNet address"}
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="glass-card p-4">
          <p className="text-xs text-muted">Total Invested</p>
          <p className="text-xl font-semibold">{formatAlgo(totalInvestedAlgo)}</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-xs text-muted">Current Value</p>
          <p className="text-xl font-semibold">{formatAlgo(totalCurrentValueAlgo)}</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-xs text-muted">P&L</p>
          <p className={`text-xl font-semibold ${totalPnlAlgo >= 0 ? "text-gain" : "text-loss"}`}>
            {totalPnlAlgo >= 0 ? "+" : ""}
            {formatAlgo(totalPnlAlgo)}
          </p>
        </div>
      </div>

      <div className="glass-card p-4">
        <h2 className="text-sm font-semibold">All Projects</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {projects.map((project) => (
            <div key={project.id} className="rounded-lg border border-card-border p-3">
              <div className="flex items-center justify-between">
                <p className="font-semibold">{project.name}</p>
                <span className="text-xs text-muted">{project.id}</span>
              </div>
              <p className="mt-1 text-xs text-muted">{project.description}</p>
              <p className="mt-2 text-xs">
                Price / Share:{" "}
                <span className="font-semibold">{formatAlgo(project.price_per_token)}</span>
              </p>
              <div className="mt-3 flex items-center gap-2">
                <button
                  onClick={() => openInvestModal(project)}
                  className="rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-accent-light"
                >
                  Invest
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-card overflow-x-auto">
        <table className="w-full min-w-[880px] text-sm">
          <thead>
            <tr className="border-b border-card-border text-left text-xs text-muted">
              <th className="px-4 py-3 font-medium">Project</th>
              <th className="px-4 py-3 font-medium text-right">Tokens</th>
              <th className="px-4 py-3 font-medium text-right">Buy Price</th>
              <th className="px-4 py-3 font-medium text-right">Current Price</th>
              <th className="px-4 py-3 font-medium text-right">Current Value</th>
              <th className="px-4 py-3 font-medium text-right">Withdraw</th>
            </tr>
          </thead>
          <tbody>
            {investmentRows.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-sm text-muted" colSpan={6}>
                  No investments yet. Pick a project above and invest with ALGO.
                </td>
              </tr>
            ) : (
              investmentRows.map((row) => (
                <tr
                  key={row.transaction_hash}
                  className="border-b border-card-border/50 transition-colors hover:bg-white/[0.03]"
                >
                  <td className="px-4 py-4">
                    <p className="font-medium">{row.projectName}</p>
                    <p className="text-xs text-muted">{row.project_id}</p>
                  </td>
                  <td className="px-4 py-4 text-right">{row.tokens_owned}</td>
                  <td className="px-4 py-4 text-right">{formatAlgo(row.basePrice)}</td>
                  <td className="px-4 py-4 text-right">{formatAlgo(row.currentPrice)}</td>
                  <td className="px-4 py-4 text-right">
                    <p>{formatAlgo(row.currentValueAlgo)}</p>
                    <p className={`text-xs ${row.pnlAlgo >= 0 ? "text-gain" : "text-loss"}`}>
                      {row.pnlAlgo >= 0 ? "+" : ""}
                      {formatAlgo(row.pnlAlgo)}
                    </p>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <button
                      onClick={() => void handleWithdrawInvestment(row)}
                      disabled={withdrawingHash === row.transaction_hash || !walletAddress}
                      className="rounded-lg border border-gain/60 px-3 py-1.5 text-xs font-semibold text-gain transition hover:bg-gain/10 disabled:opacity-60"
                    >
                      {withdrawingHash === row.transaction_hash ? "Withdrawing..." : "Withdraw"}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {toast && (
        <div className="fixed bottom-20 left-1/2 z-50 -translate-x-1/2 rounded-xl border border-card-border bg-background/95 px-4 py-2 text-sm shadow-xl">
          {toast}
        </div>
      )}

      {activeInvestProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-card-border bg-background p-5">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold">Invest in {activeInvestProject.name}</h3>
                <p className="mt-1 text-xs text-muted">{activeInvestProject.description}</p>
              </div>
              <button
                onClick={() => {
                  setActiveInvestProject(null);
                  setConfirmingPurchase(false);
                }}
                className="rounded-md px-2 py-1 text-sm text-muted transition hover:text-foreground"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-lg border border-card-border p-3">
                  <p className="text-muted">Price / Share</p>
                  <p className="font-semibold">{formatAlgo(activeInvestProject.price_per_token)}</p>
                </div>
                <div className="rounded-lg border border-card-border p-3">
                  <p className="text-muted">Account balance</p>
                  <p className="font-semibold">{balanceLabel}</p>
                </div>
              </div>

              <div>
                <p className="mb-1 text-xs text-muted">Number of shares</p>
                <input
                  type="number"
                  min={1}
                  value={draftShares}
                  onChange={(event) => setDraftShares(Math.max(1, Number(event.target.value) || 1))}
                  className="w-32 rounded-lg border border-card-border bg-card px-3 py-2 text-sm outline-none focus:border-accent/60"
                />
              </div>

              <div className="rounded-lg border border-card-border p-3 text-sm">
                <p className="text-muted">Total price</p>
                <p className="font-semibold">
                  {formatAlgo(draftShares * activeInvestProject.price_per_token)}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => void handleAddBalance()}
                  disabled={!walletAddress}
                  className="rounded-lg border border-gain/60 px-3 py-2 text-xs font-semibold text-gain transition hover:bg-gain/10 disabled:opacity-60"
                >
                  Add balance (+10 ALGO)
                </button>
                {!confirmingPurchase ? (
                  <button
                    onClick={() => setConfirmingPurchase(true)}
                    disabled={!walletAddress}
                    className="ml-auto rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-white transition hover:bg-accent-light disabled:opacity-60"
                  >
                    Buy shares
                  </button>
                ) : (
                  <div className="ml-auto flex items-center gap-2">
                    <span className="text-xs text-muted">Do you agree to buy?</span>
                    <button
                      onClick={() => setConfirmingPurchase(false)}
                      className="rounded-lg border border-card-border px-3 py-2 text-xs font-semibold"
                    >
                      No
                    </button>
                    <button
                      onClick={() => void handleInvest(activeInvestProject, draftShares)}
                      disabled={investingProjectId === activeInvestProject.id}
                      className="rounded-lg bg-gain px-3 py-2 text-xs font-semibold text-white disabled:opacity-60"
                    >
                      {investingProjectId === activeInvestProject.id ? "Buying..." : "Yes"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

export default function PortfolioPage() {
  return <PortfolioDashboard />;
}
