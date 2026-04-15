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
  created_at?: string;
};

const txStates = [
  "Preparing transaction...",
  "Waiting for wallet approval...",
  "Confirming on Solana network...",
  "Transaction successful ✅",
];

function SolanaMvpContent() {
  const {
    walletAddress,
    balanceSol,
    connectWallet,
    connecting,
    requestAirdrop,
    airdropLoading,
    refreshBalance,
  } = useWallet();

  const [projects, setProjects] = useState<StartupProject[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [tokensByProject, setTokensByProject] = useState<Record<string, number>>({});
  const [workingProjectId, setWorkingProjectId] = useState<string | null>(null);
  const [txState, setTxState] = useState<string>("");
  const [toast, setToast] = useState<string | null>(null);
  const [latestTxHash, setLatestTxHash] = useState<string | null>(null);
  const [showSkeleton, setShowSkeleton] = useState(true);

  async function loadProjects() {
    const response = await fetch("/api/projects");
    const data = (await response.json()) as { projects: StartupProject[] };
    setProjects(data.projects);
  }

  async function loadInvestments(wallet: string) {
    const response = await fetch(`/api/investments?wallet=${wallet}`);
    const data = (await response.json()) as { investments: Investment[] };
    setInvestments(data.investments);
  }

  useEffect(() => {
    void loadProjects();
    const timer = setTimeout(() => setShowSkeleton(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!walletAddress) return;
    void loadInvestments(walletAddress);
  }, [walletAddress]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(timer);
  }, [toast]);

  const totalInvestedSol = useMemo(
    () =>
      investments.reduce((sum, investment) => {
        const project = projects.find((item) => item.id === investment.project_id);
        return sum + (project?.price_per_token ?? 0) * investment.tokens_owned;
      }, 0),
    [investments, projects],
  );

  async function handleConnectWallet() {
    try {
      await connectWallet();
    } catch (error) {
      setToast(
        error instanceof Error ? error.message : "Unable to connect wallet. Please try again.",
      );
    }
  }

  async function handleInvest(project: StartupProject) {
    if (!walletAddress || !window.solana?.publicKey) {
      setToast("Please connect your Phantom wallet first.");
      return;
    }

    const tokens = Math.max(1, tokensByProject[project.id] ?? 1);
    const simulatedStockCost = tokens * project.price_per_token;
    setWorkingProjectId(project.id);
    setTxState(txStates[0]);

    try {
      // For demo safety: send a tiny fixed amount on Devnet only.
      const transferLamports = Math.floor(0.01 * LAMPORTS);
      const fromPubkey = new PublicKey(walletAddress);
      const toPubkey = DEMO_RECEIVER_WALLET;

      const latestBlockhash = await DEVNET_CONNECTION.getLatestBlockhash("confirmed");
      setTxState(txStates[1]);

      const transaction = new Transaction({
        feePayer: fromPubkey,
        recentBlockhash: latestBlockhash.blockhash,
      }).add(
        SystemProgram.transfer({
          fromPubkey,
          toPubkey,
          lamports: transferLamports,
        }),
      );

      const signed = await window.solana.signTransaction(transaction);
      const signature: TransactionSignature = await DEVNET_CONNECTION.sendRawTransaction(
        signed.serialize(),
      );

      setTxState(txStates[2]);
      await DEVNET_CONNECTION.confirmTransaction(signature, "confirmed");

      await fetch("/api/investments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_wallet: walletAddress,
          project_id: project.id,
          tokens_owned: tokens,
          transaction_hash: signature,
        }),
      });

      setLatestTxHash(signature);
      setTxState(txStates[3]);
      setToast(
        `Demo stock purchase successful: ${tokens} tokens (~${simulatedStockCost.toFixed(4)} SOL).`,
      );

      await Promise.all([refreshBalance(), loadProjects(), loadInvestments(walletAddress)]);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Transaction failed";
      setToast(message);
      setTxState("");
    } finally {
      setTimeout(() => {
        setWorkingProjectId(null);
        setTxState("");
      }, 900);
    }
  }

  return (
    <section className="py-6 space-y-5">
      <div className="glass-card p-5">
        <h1 className="text-2xl font-bold">Solana Stock MVP (Devnet Only)</h1>
        <p className="mt-2 text-sm text-muted">
          Hackathon-safe simulation: users "buy SOL" using Devnet faucet (airdrop) and then buy
          startup shares with SOL. No real money is involved.
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={() => void handleConnectWallet()}
            disabled={Boolean(walletAddress) || connecting}
            className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent-light disabled:cursor-not-allowed disabled:opacity-60"
          >
            {walletAddress ? "Wallet Connected" : connecting ? "Connecting..." : "Connect Phantom"}
          </button>
          <button
            onClick={() => void requestAirdrop()}
            disabled={!walletAddress || airdropLoading}
            className="rounded-xl bg-gain px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {airdropLoading ? "Buying SOL (simulated)..." : "Buy SOL (simulated via Devnet faucet)"}
          </button>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-card-border p-3">
            <p className="text-xs text-muted">Wallet</p>
            <p className="mt-1 break-all text-sm">{walletAddress ?? "Not connected"}</p>
          </div>
          <div className="rounded-xl border border-card-border p-3">
            <p className="text-xs text-muted">SOL Balance</p>
            <p className="text-lg font-semibold">{balanceSol.toFixed(4)} SOL</p>
          </div>
          <div className="rounded-xl border border-card-border p-3">
            <p className="text-xs text-muted">Approx INR</p>
            <p className="text-lg font-semibold">
              ₹{Math.round(balanceSol * SOL_TO_INR).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {txState && (
        <div className="glass-card border border-accent/40 p-3 text-sm text-accent-light">{txState}</div>
      )}

      {latestTxHash && (
        <div className="glass-card p-4">
          <p className="text-sm text-muted">Latest blockchain proof</p>
          <p className="mt-1 break-all text-xs sm:text-sm">{latestTxHash}</p>
          <div className="mt-3 flex items-center gap-2">
            <a
              href={`https://explorer.solana.com/tx/${latestTxHash}?cluster=devnet`}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg border border-accent/50 px-3 py-1.5 text-xs font-semibold text-accent-light transition hover:bg-accent/10"
            >
              View on Explorer
            </a>
            <span className="rounded-full bg-gain/20 px-2 py-1 text-[11px] text-gain">
              Blockchain Verified
            </span>
          </div>
        </div>
      )}

      <div>
        <h2 className="mb-3 text-lg font-semibold">Startup Stocks</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {projects.map((project) => {
            const tokens = Math.max(1, tokensByProject[project.id] ?? 1);
            const totalCost = tokens * project.price_per_token;
            const busy = workingProjectId === project.id;

            return (
              <article key={project.id} className="glass-card p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">{project.name}</h3>
                  <span className="text-xs text-muted">{project.id}</span>
                </div>
                <p className="mt-2 text-sm text-foreground/90">{project.description}</p>

                <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
                  <div className="rounded-lg border border-card-border p-2">
                    <p className="text-muted">Total</p>
                    <p className="font-semibold">{project.total_tokens.toLocaleString()}</p>
                  </div>
                  <div className="rounded-lg border border-card-border p-2">
                    <p className="text-muted">Price</p>
                    <p className="font-semibold">{project.price_per_token.toFixed(4)} SOL</p>
                  </div>
                  <div className="rounded-lg border border-card-border p-2">
                    <p className="text-muted">Sold</p>
                    <p className="font-semibold">{project.sold_tokens.toLocaleString()}</p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    value={tokens}
                    onChange={(event) =>
                      setTokensByProject((prev) => ({
                        ...prev,
                        [project.id]: Math.max(1, Number(event.target.value) || 1),
                      }))
                    }
                    className="w-28 rounded-lg border border-card-border bg-card px-3 py-2 text-sm outline-none focus:border-accent/60"
                  />
                  <p className="text-sm text-muted">Cost: {totalCost.toFixed(4)} SOL</p>
                  <button
                    onClick={() => void handleInvest(project)}
                    disabled={busy || !walletAddress}
                    className="ml-auto rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent-light disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {busy ? "Processing..." : "Buy Stock"}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </div>

      <div className="glass-card p-4">
        <h3 className="text-sm font-semibold">Your Transaction / Investment History</h3>
        <p className="mt-1 text-xs text-muted">
          Stored in backend with wallet, project, tokens owned and transaction hash.
        </p>
        {showSkeleton ? (
          <div className="mt-3 space-y-2">
            <div className="skeleton h-10 w-full" />
            <div className="skeleton h-10 w-full" />
            <div className="skeleton h-10 w-full" />
          </div>
        ) : investments.length === 0 ? (
          <p className="mt-3 text-sm text-muted">No investments yet.</p>
        ) : (
          <div className="mt-3 space-y-2">
            {investments.map((item) => (
              <div
                key={item.transaction_hash}
                className="flex flex-wrap items-center gap-2 rounded-lg border border-card-border px-3 py-2 text-xs"
              >
                <span className="font-semibold">{item.project_id}</span>
                <span className="text-muted">{item.tokens_owned} tokens</span>
                <span className="text-muted">{item.user_wallet.slice(0, 4)}...{item.user_wallet.slice(-4)}</span>
                <a
                  href={`https://explorer.solana.com/tx/${item.transaction_hash}?cluster=devnet`}
                  target="_blank"
                  rel="noreferrer"
                  className="ml-auto text-accent-light hover:underline"
                >
                  View on Explorer
                </a>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-200">
        This page runs on Solana Devnet only. "Buy SOL" is simulated via faucet airdrop and uses
        no real money.
      </div>

      {toast && (
        <div className="fixed bottom-20 left-1/2 z-50 -translate-x-1/2 rounded-xl border border-card-border bg-background/95 px-4 py-2 text-sm shadow-xl">
          {toast}
        </div>
      )}
    </section>
  );
}

export default function SolanaMvpPage() {
  return (
    <WalletProvider>
      <SolanaMvpContent />
    </WalletProvider>
  );
}
