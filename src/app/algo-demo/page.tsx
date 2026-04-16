"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { formatAlgo, formatAlgoShort } from "@/lib/algo";
import { TESTNET_FAUCET_URL, TESTNET_TX_EXPLORER, microToAlgo } from "@/lib/algorand-constants";
import { usePeraTestnet } from "@/components/providers/PeraTestnetProvider";
import { useWalletConnectionMode } from "@/components/providers/WalletConnectionModeProvider";
import { useWallet } from "@/components/providers/WalletProvider";
import { signAndSubmitTestnetPayment } from "@/lib/testnet-investment-client";
import type { StartupProject } from "@/lib/mock-store";

type Investment = {
  user_wallet: string;
  project_id: string;
  tokens_owned: number;
  transaction_hash: string;
  created_at?: string;
};

const mockTxStates = [
  "Preparing transfer...",
  "Debiting ALGO balance...",
  "Recording investment...",
  "Done ✅",
];

const testnetTxStates = [
  "Building transaction…",
  "Waiting for signature in Pera…",
  "Broadcasting to Algorand…",
  "Confirming transaction…",
  "Finalized ✅",
];

function isLikelyOnChainTxId(id: string): boolean {
  return /^[A-Z2-7]{52}$/.test(id);
}

function AlgoMvpInner() {
  const mock = useWallet();
  const pera = usePeraTestnet();
  const { mode, setMode } = useWalletConnectionMode();

  const [testnetReady, setTestnetReady] = useState(false);
  const [demoReceiver, setDemoReceiver] = useState<string | null>(null);

  const [projects, setProjects] = useState<StartupProject[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [tokensByProject, setTokensByProject] = useState<Record<string, number>>({});
  const [workingProjectId, setWorkingProjectId] = useState<string | null>(null);
  const [txState, setTxState] = useState<string>("");
  const [toast, setToast] = useState<string | null>(null);
  const [latestTxId, setLatestTxId] = useState<string | null>(null);
  const [showSkeleton, setShowSkeleton] = useState(true);

  const walletAddress = mode === "demo" ? mock.walletAddress : pera.activeAccount;
  const balanceAlgo =
    mode === "demo"
      ? mock.balanceAlgo
      : pera.balanceMicro != null
        ? microToAlgo(pera.balanceMicro)
        : null;

  async function loadProjects() {
    const response = await fetch("/api/projects");
    const data = (await response.json()) as { projects: StartupProject[] };
    setProjects(data.projects);
  }

  async function loadInvestments(wallet: string) {
    const response = await fetch(`/api/investments?wallet=${encodeURIComponent(wallet)}`);
    const data = (await response.json()) as { investments: Investment[] };
    setInvestments(data.investments);
  }

  useEffect(() => {
    void loadProjects();
    const timer = setTimeout(() => setShowSkeleton(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/algorand/config");
        const data = (await res.json()) as {
          testnetReady?: boolean;
          demoReceiver?: string | null;
        };
        setTestnetReady(Boolean(data.testnetReady));
        setDemoReceiver(data.demoReceiver ?? null);
      } catch {
        setTestnetReady(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!walletAddress) return;
    void loadInvestments(walletAddress);
  }, [walletAddress]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4200);
    return () => clearTimeout(timer);
  }, [toast]);

  const totalInvestedAlgo = useMemo(
    () =>
      investments.reduce((sum, investment) => {
        const project = projects.find((item) => item.id === investment.project_id);
        return sum + (project?.price_per_token ?? 0) * investment.tokens_owned;
      }, 0),
    [investments, projects],
  );

  const handleConnectMock = useCallback(async () => {
    try {
      await mock.connectWallet();
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Unable to connect.");
    }
  }, [mock]);

  const handleConnectPera = useCallback(async () => {
    try {
      await pera.connect();
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Pera connection cancelled or failed.");
    }
  }, [pera]);

  async function handleInvestMock(project: StartupProject) {
    if (!mock.walletAddress) {
      setToast("Connect your wallet first.");
      return;
    }

    const tokens = Math.max(1, tokensByProject[project.id] ?? 1);
    const costAlgo = tokens * project.price_per_token;
    setWorkingProjectId(project.id);
    setTxState(mockTxStates[0]!);

    try {
      await new Promise((r) => setTimeout(r, 200));
      setTxState(mockTxStates[1]!);
      const ok = mock.trySpendAlgo(costAlgo);
      if (!ok) {
        setToast(`Not enough ALGO. Need ${formatAlgo(costAlgo)}.`);
        setTxState("");
        return;
      }

      setTxState(mockTxStates[2]!);
      const txId = `ALGO-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
      await fetch("/api/investments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_wallet: mock.walletAddress,
          project_id: project.id,
          tokens_owned: tokens,
          transaction_hash: txId,
        }),
      });

      setLatestTxId(txId);
      setTxState(mockTxStates[3]!);
      setToast(`Purchase: ${tokens} tokens for ${formatAlgo(costAlgo)}.`);

      await Promise.all([mock.refreshBalance(), loadProjects(), loadInvestments(mock.walletAddress)]);
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Something went wrong");
      setTxState("");
    } finally {
      setTimeout(() => {
        setWorkingProjectId(null);
        setTxState("");
      }, 900);
    }
  }

  async function handleInvestTestnet(project: StartupProject) {
    if (!pera.activeAccount) {
      setToast("Connect Pera Wallet on TestNet first.");
      return;
    }
    if (!testnetReady) {
      setToast("TestNet receiver is not configured. Set ALGORAND_DEMO_RECEIVER in .env.local.");
      return;
    }

    const tokens = Math.max(1, tokensByProject[project.id] ?? 1);
    const costAlgo = tokens * project.price_per_token;

    setWorkingProjectId(project.id);
    setTxState(testnetTxStates[0]!);

    try {
      setTxState(testnetTxStates[1]!);
      const txId = await signAndSubmitTestnetPayment({
        sender: pera.activeAccount!,
        costAlgo,
        note: { app: "valyou-demo", projectId: project.id, tokens },
        signTransactionGroup: pera.signTransactionGroup,
      });

      await fetch("/api/investments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_wallet: pera.activeAccount,
          project_id: project.id,
          tokens_owned: tokens,
          transaction_hash: txId,
        }),
      });

      setLatestTxId(txId);
      setTxState(testnetTxStates[4]!);
      setToast(`On-chain payment ${formatAlgo(costAlgo)} — ${tokens} tokens recorded.`);

      await Promise.all([pera.refreshBalance(), loadProjects(), loadInvestments(pera.activeAccount)]);
    } catch (error) {
      setToast(error instanceof Error ? error.message : "Transaction failed");
      setTxState("");
    } finally {
      setTimeout(() => {
        setWorkingProjectId(null);
        setTxState("");
      }, 1200);
    }
  }

  return (
    <section className="py-6 space-y-5">
      <div className="glass-card p-5">
        <h1 className="text-2xl font-bold">ALGO demo</h1>
        <p className="mt-2 text-sm text-muted">
          Switch between a local mock wallet or Pera Wallet on Algorand TestNet. Investments can post a real payment
          to your configured demo receiver, then store the same investment record as before.
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setMode("demo")}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
              mode === "demo"
                ? "bg-accent text-white"
                : "border border-card-border bg-card text-muted hover:text-foreground"
            }`}
          >
            Demo wallet
          </button>
          <button
            type="button"
            onClick={() => setMode("testnet")}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
              mode === "testnet"
                ? "bg-accent text-white"
                : "border border-card-border bg-card text-muted hover:text-foreground"
            }`}
          >
            Pera + TestNet
          </button>
        </div>

        {mode === "demo" ? (
          <>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void handleConnectMock()}
                disabled={Boolean(mock.walletAddress) || mock.connecting}
                className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent-light disabled:cursor-not-allowed disabled:opacity-60"
              >
                {mock.walletAddress ? "Wallet connected" : mock.connecting ? "Connecting..." : "Connect demo wallet"}
              </button>
              <button
                type="button"
                onClick={() => void mock.requestAirdrop()}
                disabled={!mock.walletAddress || mock.airdropLoading}
                className="rounded-xl bg-gain px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {mock.airdropLoading ? "Adding ALGO..." : "Add 10 ALGO (demo)"}
              </button>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-card-border p-3">
                <p className="text-xs text-muted">Wallet</p>
                <p className="mt-1 break-all text-sm">{mock.walletAddress ?? "Not connected"}</p>
              </div>
              <div className="rounded-xl border border-card-border p-3">
                <p className="text-xs text-muted">Balance</p>
                <p className="text-lg font-semibold">{formatAlgo(mock.balanceAlgo)}</p>
              </div>
            </div>
          </>
        ) : (
          <>
            {!testnetReady ? (
              <div className="mt-4 rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-100">
                TestNet payments are disabled until you set a valid{" "}
                <code className="rounded bg-black/20 px-1">ALGORAND_DEMO_RECEIVER</code> or{" "}
                <code className="rounded bg-black/20 px-1">NEXT_PUBLIC_ALGORAND_DEMO_RECEIVER</code> in{" "}
                <code className="rounded bg-black/20 px-1">.env.local</code> (a funded TestNet account you control),
                then restart <code className="rounded bg-black/20 px-1">npm run dev</code>.
              </div>
            ) : (
              <p className="mt-3 text-xs text-muted">
                Demo receiver (where ALGO is sent):{" "}
                <span className="break-all font-mono text-foreground/90">{demoReceiver}</span>
              </p>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void handleConnectPera()}
                disabled={pera.connected || pera.connecting}
                className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent-light disabled:cursor-not-allowed disabled:opacity-60"
              >
                {pera.connected ? "Pera connected" : pera.connecting ? "Opening Pera…" : "Connect Pera (TestNet)"}
              </button>
              <button
                type="button"
                onClick={() => void pera.disconnect()}
                disabled={!pera.connected}
                className="rounded-xl border border-card-border px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-card disabled:opacity-50"
              >
                Disconnect
              </button>
              <a
                href={TESTNET_FAUCET_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center rounded-xl bg-gain px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
              >
                Open TestNet faucet
              </a>
              <button
                type="button"
                onClick={() => void pera.refreshBalance()}
                disabled={!pera.activeAccount}
                className="rounded-xl border border-card-border px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-card disabled:opacity-50"
              >
                Refresh balance
              </button>
            </div>
            {pera.accounts.length > 1 ? (
              <label className="mt-3 flex flex-col gap-1 text-xs text-muted">
                Active account
                <select
                  value={pera.activeAccount ?? ""}
                  onChange={(e) => pera.setActiveAccount(e.target.value)}
                  className="max-w-md rounded-lg border border-card-border bg-card px-3 py-2 text-sm text-foreground"
                >
                  {pera.accounts.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-card-border p-3">
                <p className="text-xs text-muted">Wallet</p>
                <p className="mt-1 break-all text-sm">{pera.activeAccount ?? "Not connected"}</p>
              </div>
              <div className="rounded-xl border border-card-border p-3">
                <p className="text-xs text-muted">On-chain balance (TestNet)</p>
                <p className="text-lg font-semibold">
                  {pera.balanceMicro == null
                    ? "—"
                    : formatAlgoShort(microToAlgo(pera.balanceMicro))}
                </p>
              </div>
            </div>
          </>
        )}
      </div>

      {txState ? (
        <div className="glass-card border border-accent/40 p-3 text-sm text-accent-light">{txState}</div>
      ) : null}

      {latestTxId ? (
        <div className="glass-card p-4">
          <p className="text-sm text-muted">Latest transaction</p>
          <p className="mt-1 break-all font-mono text-xs sm:text-sm">{latestTxId}</p>
          {mode === "testnet" && isLikelyOnChainTxId(latestTxId) ? (
            <div className="mt-3">
              <a
                href={TESTNET_TX_EXPLORER(latestTxId)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex rounded-lg border border-accent/50 px-3 py-1.5 text-xs font-semibold text-accent-light transition hover:bg-accent/10"
              >
                View on AlgoExplorer
              </a>
            </div>
          ) : null}
        </div>
      ) : null}

      <div>
        <h2 className="mb-3 text-lg font-semibold">Startup tokens</h2>
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
                    <p className="font-semibold">{formatAlgo(project.price_per_token)} / token</p>
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
                  <p className="text-sm text-muted">Simulated cost: {formatAlgo(totalCost)}</p>
                  {mode === "testnet" ? (
                    <p className="w-full text-[11px] text-muted">
                      On-chain payment uses the same total in microAlgos (clamped for safety). You sign the exact
                      payment in Pera.
                    </p>
                  ) : null}
                  <button
                    type="button"
                    onClick={() =>
                      void (mode === "demo" ? handleInvestMock(project) : handleInvestTestnet(project))
                    }
                    disabled={
                      busy ||
                      !walletAddress ||
                      (mode === "testnet" && (!testnetReady || !pera.activeAccount))
                    }
                    className="ml-auto rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent-light disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {busy ? "Processing..." : mode === "demo" ? "Buy (demo)" : "Buy (TestNet)"}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </div>

      <div className="glass-card p-4">
        <h3 className="text-sm font-semibold">Your investments</h3>
        <p className="mt-1 text-xs text-muted">
          Total position value (at last known token price): {formatAlgo(totalInvestedAlgo)}
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
                <span className="text-muted">
                  {item.user_wallet.slice(0, 6)}…{item.user_wallet.slice(-4)}
                </span>
                {isLikelyOnChainTxId(item.transaction_hash) ? (
                  <a
                    href={TESTNET_TX_EXPLORER(item.transaction_hash)}
                    target="_blank"
                    rel="noreferrer"
                    className="ml-auto font-mono text-accent-light hover:underline"
                  >
                    {item.transaction_hash.slice(0, 8)}…
                  </a>
                ) : (
                  <span className="ml-auto font-mono text-muted">{item.transaction_hash}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {toast ? (
        <div className="fixed bottom-20 left-1/2 z-50 max-w-lg -translate-x-1/2 rounded-xl border border-card-border bg-background/95 px-4 py-2 text-sm shadow-xl">
          {toast}
        </div>
      ) : null}
    </section>
  );
}

export default function AlgoDemoPage() {
  return <AlgoMvpInner />;
}
