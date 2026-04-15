"use client";

import { useEffect, useMemo, useState } from "react";
import {
  PublicKey,
  SystemProgram,
  Transaction,
  type TransactionSignature,
} from "@solana/web3.js";
import { WalletProvider, useWallet } from "@/components/providers/WalletProvider";
import { DEMO_RECEIVER_WALLET, DEVNET_CONNECTION, LAMPORTS, SOL_TO_INR } from "@/lib/solana";
import type { StartupProject } from "@/lib/mock-store";

type Investment = {
  user_wallet: string;
  project_id: string;
  tokens_owned: number;
  transaction_hash: string;
};

const inrFormat = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });

function PortfolioDashboard() {
  const { walletAddress, connectWallet, connecting, balanceSol, requestAirdrop, refreshBalance } =
    useWallet();
  const [projects, setProjects] = useState<StartupProject[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [sellingSol, setSellingSol] = useState(false);
  const [withdrawingHash, setWithdrawingHash] = useState<string | null>(null);
  const [investingProjectId, setInvestingProjectId] = useState<string | null>(null);
  const [sellSolAmount, setSellSolAmount] = useState(0.1);
  const [activeInvestProject, setActiveInvestProject] = useState<StartupProject | null>(null);
  const [draftShares, setDraftShares] = useState(1);
  const [confirmingPurchase, setConfirmingPurchase] = useState(false);
  const [inrBalance, setInrBalance] = useState(0);
  const [txState, setTxState] = useState<string>("");
  const [hasPhantom, setHasPhantom] = useState(false);

  useEffect(() => {
    setHasPhantom(Boolean(window?.solana?.isPhantom));
  }, []);

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
    if (!walletAddress) return;
    const value = localStorage.getItem(`valyou-inr-${walletAddress}`);
    setInrBalance(value ? Number(value) : 0);
  }, [walletAddress]);

  const investmentRows = useMemo(() => {
    return investments.map((investment) => {
      const project = projects.find((item) => item.id === investment.project_id);
      const basePrice = project?.price_per_token ?? 0;
      const utilization = project ? project.sold_tokens / project.total_tokens : 0;
      const currentPrice = basePrice * (1 + utilization * 0.2);
      const investedSol = basePrice * investment.tokens_owned;
      const currentValueSol = currentPrice * investment.tokens_owned;
      return {
        ...investment,
        projectName: project?.name ?? investment.project_id,
        basePrice,
        currentPrice,
        investedSol,
        currentValueSol,
        pnlSol: currentValueSol - investedSol,
      };
    });
  }, [investments, projects]);

  const totalInvestedSol = investmentRows.reduce((sum, item) => sum + item.investedSol, 0);
  const totalCurrentValueSol = investmentRows.reduce((sum, item) => sum + item.currentValueSol, 0);
  const totalPnlSol = totalCurrentValueSol - totalInvestedSol;

  async function handleBuySol() {
    try {
      await requestAirdrop(1);
      setToast("Added 1 SOL using Devnet faucet (simulated buy).");
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Airdrop failed");
    }
  }

  async function handleConnectWallet() {
    try {
      await connectWallet();
    } catch (error) {
      setToast(
        error instanceof Error ? error.message : "Unable to connect wallet. Please try again.",
      );
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

      // Simulate receiving withdrawn amount back to wallet on Devnet.
      await requestAirdrop(Math.min(1, Math.max(0.1, row.currentValueSol)));

      const refreshed = await fetch(`/api/investments?wallet=${walletAddress}`);
      const data = (await refreshed.json()) as { investments: Investment[] };
      setInvestments(data.investments);
      setToast("Withdrawal complete. Value added back to wallet (Devnet simulation).");
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Withdrawal failed");
    } finally {
      setWithdrawingHash(null);
    }
  }

  async function handleInvest(project: StartupProject, shares: number) {
    if (!walletAddress || !window.solana?.publicKey) {
      setToast("Phantom wallet not found. Install Phantom extension.");
      return;
    }

    const safeShares = Math.max(1, shares);
    const totalCostSol = safeShares * project.price_per_token;
    const totalCostInr = totalCostSol * SOL_TO_INR;
    if (balanceSol < totalCostSol) {
      setToast(
        `Insufficient SOL. Need ${totalCostSol.toFixed(4)} SOL (₹${inrFormat.format(totalCostInr)}).`,
      );
      return;
    }

    setInvestingProjectId(project.id);
    setTxState("Preparing transaction...");
    try {
      const lamports = Math.floor(totalCostSol * LAMPORTS);
      const fromPubkey = new PublicKey(walletAddress);
      const latestBlockhash = await DEVNET_CONNECTION.getLatestBlockhash("confirmed");

      const tx = new Transaction({
        feePayer: fromPubkey,
        recentBlockhash: latestBlockhash.blockhash,
      }).add(
        SystemProgram.transfer({
          fromPubkey,
          toPubkey: DEMO_RECEIVER_WALLET,
          lamports,
        }),
      );

      setTxState("Waiting for wallet approval...");
      const signed = await window.solana.signTransaction(tx);
      const signature: TransactionSignature = await DEVNET_CONNECTION.sendRawTransaction(
        signed.serialize(),
      );
      setTxState("Confirming on Solana network...");
      await DEVNET_CONNECTION.confirmTransaction(signature, "confirmed");

      await fetch("/api/investments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_wallet: walletAddress,
          project_id: project.id,
          tokens_owned: shares,
          transaction_hash: signature,
        }),
      });

      const refreshed = await fetch(`/api/investments?wallet=${walletAddress}`);
      const data = (await refreshed.json()) as { investments: Investment[] };
      setInvestments(data.investments);
      await refreshBalance();
      setTxState("Transaction successful ✅");
      setToast(`Invested in ${project.name}: ${safeShares} shares (${totalCostSol.toFixed(4)} SOL).`);
      setActiveInvestProject(null);
      setConfirmingPurchase(false);
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Investment transaction failed");
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

  async function handleSellSolForInr() {
    if (!walletAddress || !window.solana?.publicKey) {
      setToast("Connect Phantom wallet first.");
      return;
    }
    if (sellSolAmount <= 0) {
      setToast("Enter a valid SOL amount.");
      return;
    }
    if (sellSolAmount >= balanceSol) {
      setToast("Not enough SOL balance.");
      return;
    }

    setSellingSol(true);
    try {
      // Real Devnet transfer to demo treasury represents selling SOL.
      const lamports = Math.floor(sellSolAmount * LAMPORTS);
      const fromPubkey = new PublicKey(walletAddress);
      const latestBlockhash = await DEVNET_CONNECTION.getLatestBlockhash("confirmed");

      const tx = new Transaction({
        feePayer: fromPubkey,
        recentBlockhash: latestBlockhash.blockhash,
      }).add(
        SystemProgram.transfer({
          fromPubkey,
          toPubkey: DEMO_RECEIVER_WALLET,
          lamports,
        }),
      );

      const signed = await window.solana.signTransaction(tx);
      const signature: TransactionSignature = await DEVNET_CONNECTION.sendRawTransaction(
        signed.serialize(),
      );
      await DEVNET_CONNECTION.confirmTransaction(signature, "confirmed");

      const creditedInr = sellSolAmount * SOL_TO_INR;
      const nextInr = inrBalance + creditedInr;
      setInrBalance(nextInr);
      localStorage.setItem(`valyou-inr-${walletAddress}`, String(nextInr));
      await refreshBalance();
      setToast(`Sold ${sellSolAmount.toFixed(3)} SOL and credited ₹${inrFormat.format(creditedInr)}.`);
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Sell transaction failed");
    } finally {
      setSellingSol(false);
    }
  }

  return (
    <section className="py-8 space-y-5">
      <h1 className="text-3xl font-bold tracking-tight">User Dashboard</h1>
      {txState && (
        <div className="glass-card border border-accent/40 p-3 text-sm text-accent-light">{txState}</div>
      )}

      <div className="glass-card p-4">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => void handleConnectWallet()}
            disabled={!hasPhantom || Boolean(walletAddress) || connecting}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent-light disabled:opacity-60"
          >
            {walletAddress ? "Wallet Connected" : connecting ? "Connecting..." : "Connect Phantom"}
          </button>
          <button
            onClick={() => void handleBuySol()}
            disabled={!walletAddress}
            className="rounded-lg bg-gain px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
          >
            Buy SOL (Devnet)
          </button>
        </div>
        {!hasPhantom && (
          <p className="mt-3 text-xs text-amber-300">
            Phantom wallet not found. Install Phantom extension to connect wallet.
          </p>
        )}
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-card-border p-3">
            <p className="text-xs text-muted">SOL Wallet Balance</p>
            <p className="text-lg font-semibold">{balanceSol.toFixed(4)} SOL</p>
          </div>
          <div className="rounded-lg border border-card-border p-3">
            <p className="text-xs text-muted">INR Equivalent</p>
            <p className="text-lg font-semibold">₹{inrFormat.format(balanceSol * SOL_TO_INR)}</p>
          </div>
          <div className="rounded-lg border border-card-border p-3">
            <p className="text-xs text-muted">INR Account (after selling SOL)</p>
            <p className="text-lg font-semibold">₹{inrFormat.format(inrBalance)}</p>
          </div>
        </div>
      </div>

      <div className="glass-card p-4">
        <h2 className="text-sm font-semibold">Sell SOL → INR</h2>
        <p className="mt-1 text-xs text-muted">
          Performs a real Devnet transfer and credits INR in your simulated account.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <input
            type="number"
            min={0.01}
            step={0.01}
            value={sellSolAmount}
            onChange={(event) => setSellSolAmount(Number(event.target.value) || 0)}
            className="w-32 rounded-lg border border-card-border bg-card px-3 py-2 text-sm outline-none focus:border-accent/60"
          />
          <button
            onClick={() => void handleSellSolForInr()}
            disabled={!walletAddress || sellingSol}
            className="rounded-lg border border-accent/60 px-4 py-2 text-sm font-semibold text-accent-light transition hover:bg-accent/10 disabled:opacity-60"
          >
            {sellingSol ? "Selling..." : "Sell SOL"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="glass-card p-4">
          <p className="text-xs text-muted">Total Invested</p>
          <p className="text-xl font-semibold">{totalInvestedSol.toFixed(4)} SOL</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-xs text-muted">Current Value</p>
          <p className="text-xl font-semibold">{totalCurrentValueSol.toFixed(4)} SOL</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-xs text-muted">P&L</p>
          <p className={`text-xl font-semibold ${totalPnlSol >= 0 ? "text-gain" : "text-loss"}`}>
            {totalPnlSol >= 0 ? "+" : ""}
            {totalPnlSol.toFixed(4)} SOL
          </p>
        </div>
      </div>

      <div className="glass-card p-4">
        <h2 className="text-sm font-semibold">All Projects (Invest Using SOL)</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {projects.map((project) => {
            return (
              <div key={project.id} className="rounded-lg border border-card-border p-3">
                <div className="flex items-center justify-between">
                  <p className="font-semibold">{project.name}</p>
                  <span className="text-xs text-muted">{project.id}</span>
                </div>
                <p className="mt-1 text-xs text-muted">{project.description}</p>
                <p className="mt-2 text-xs">
                  Price / Share: <span className="font-semibold">{project.price_per_token.toFixed(4)} SOL</span>{" "}
                  · <span className="font-semibold">₹{inrFormat.format(project.price_per_token * SOL_TO_INR)}</span>
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
            );
          })}
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
                  No investments yet. Select any project above and invest using SOL.
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
                  <td className="px-4 py-4 text-right">{row.basePrice.toFixed(4)} SOL</td>
                  <td className="px-4 py-4 text-right">{row.currentPrice.toFixed(4)} SOL</td>
                  <td className="px-4 py-4 text-right">
                    <p>{row.currentValueSol.toFixed(4)} SOL</p>
                    <p className={`text-xs ${row.pnlSol >= 0 ? "text-gain" : "text-loss"}`}>
                      {row.pnlSol >= 0 ? "+" : ""}
                      {row.pnlSol.toFixed(4)} SOL
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
                  <p className="font-semibold">
                    {activeInvestProject.price_per_token.toFixed(4)} SOL · ₹
                    {inrFormat.format(activeInvestProject.price_per_token * SOL_TO_INR)}
                  </p>
                </div>
                <div className="rounded-lg border border-card-border p-3">
                  <p className="text-muted">Account Balance</p>
                  <p className="font-semibold">
                    {balanceSol.toFixed(4)} SOL · ₹{inrFormat.format(balanceSol * SOL_TO_INR)}
                  </p>
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
                  {(draftShares * activeInvestProject.price_per_token).toFixed(4)} SOL · ₹
                  {inrFormat.format(draftShares * activeInvestProject.price_per_token * SOL_TO_INR)}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => void handleBuySol()}
                  disabled={!walletAddress}
                  className="rounded-lg border border-gain/60 px-3 py-2 text-xs font-semibold text-gain transition hover:bg-gain/10 disabled:opacity-60"
                >
                  Add Balance (Get 1 SOL)
                </button>
                {!confirmingPurchase ? (
                  <button
                    onClick={() => setConfirmingPurchase(true)}
                    disabled={!walletAddress}
                    className="ml-auto rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-white transition hover:bg-accent-light disabled:opacity-60"
                  >
                    Buy Shares
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
  return (
    <WalletProvider>
      <PortfolioDashboard />
    </WalletProvider>
  );
}
