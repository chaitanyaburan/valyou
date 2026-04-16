"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { usePeraTestnet } from "@/components/providers/PeraTestnetProvider";
import { useAuth } from "@/contexts/AuthContext";
import { formatAlgo, formatAlgoShort } from "@/lib/algo";
import { TESTNET_FAUCET_URL, microToAlgo } from "@/lib/algorand-constants";
import {
  apiCancelProjectOrder,
  apiCreateRazorpayWalletOrder,
  apiGetHoldings,
  apiGetOpenOrders,
  apiGetProjects,
  apiGetRazorpayWalletConfig,
  apiGetWallet,
  apiGetWalletActivity,
  apiPostWalletWithdraw,
  apiVerifyRazorpayWalletPayment,
  type WalletActivityFill,
  type WalletData,
} from "@/lib/api-client";
import type { Holding, ProjectStock, TradingOrder } from "@/lib/data";
import { mergePostedWithApi, subscribeMarketProjects } from "@/lib/market-projects";
import { emitAppWalletRefresh } from "@/lib/app-wallet-events";

const fmt = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 });
const inrPresets = [100, 500, 1000, 2000, 5000];

function loadRazorpayCheckoutScript(): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  if (window.Razorpay) return Promise.resolve(true);
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function WalletPage() {
  const { user, loading: authLoading } = useAuth();
  const pera = usePeraTestnet();

  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [orders, setOrders] = useState<TradingOrder[]>([]);
  const [projects, setProjects] = useState<ProjectStock[]>([]);
  const [fills, setFills] = useState<WalletActivityFill[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [inrTopUp, setInrTopUp] = useState("");
  const [ledgerBusy, setLedgerBusy] = useState(false);
  const [ledgerMessage, setLedgerMessage] = useState<string | null>(null);
  const [cancelBusyId, setCancelBusyId] = useState<string | null>(null);
  const [rzReady, setRzReady] = useState(false);
  const [rzKeyId, setRzKeyId] = useState<string | null>(null);
  const [algoPerInr, setAlgoPerInr] = useState(0.01);
  const [rzBusy, setRzBusy] = useState(false);

  const projectTitleById = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of projects) map.set(p.id, p.title);
    return map;
  }, [projects]);

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      const [w, h, o, apiProjects, a] = await Promise.all([
        apiGetWallet().catch(() => null),
        apiGetHoldings().catch(() => []),
        apiGetOpenOrders().catch(() => ({ userId: "demo", orders: [] })),
        apiGetProjects().catch(() => [] as ProjectStock[]),
        apiGetWalletActivity(50).catch(() => ({ userId: "demo", fills: [] })),
      ]);
      setWallet(w);
      setHoldings(h);
      setOrders(o.orders);
      setProjects(await mergePostedWithApi(apiProjects));
      setFills(a.fills);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Could not load wallet.");
    }
  }, []);

  useEffect(() => {
    const t = window.setTimeout(() => {
      void load();
    }, 0);
    const unsub = subscribeMarketProjects(() => {
      void load();
    });
    return () => {
      window.clearTimeout(t);
      unsub();
    };
  }, [load]);

  useEffect(() => {
    void apiGetRazorpayWalletConfig()
      .then((c) => {
        setRzReady(c.ready);
        setRzKeyId(c.keyId);
        setAlgoPerInr(c.algoPerInr);
      })
      .catch(() => {
        setRzReady(false);
        setRzKeyId(null);
      });
  }, []);

  const estimatedAlgoForInr = useMemo(() => {
    const n = Number(inrTopUp);
    if (!Number.isFinite(n) || n <= 0) return 0;
    return fmt.format(n * algoPerInr);
  }, [algoPerInr, inrTopUp]);

  const handleRazorpayTopUp = useCallback(async () => {
    if (!user) {
      setLedgerMessage("Sign in to pay with Razorpay.");
      return;
    }
    if (!rzReady || !rzKeyId) {
      setLedgerMessage("Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET on the server.");
      return;
    }
    const amountInr = Number(inrTopUp);
    if (!Number.isFinite(amountInr) || amountInr < 1) {
      setLedgerMessage("Enter at least ₹1 to top up.");
      return;
    }
    setRzBusy(true);
    setLedgerMessage(null);
    try {
      const scriptOk = await loadRazorpayCheckoutScript();
      if (!scriptOk || !window.Razorpay) {
        throw new Error("Could not load Razorpay checkout.");
      }
      const order = await apiCreateRazorpayWalletOrder(amountInr);
      const rz = new window.Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        order_id: order.orderId,
        name: "Valyou",
        description: `Wallet top-up · +${fmt.format(order.algoCredit)} ALGO`,
        prefill: {
          email: user.email,
          name: user.displayName,
        },
        theme: { color: "#6366f1" },
        handler: async (response) => {
          try {
            const out = await apiVerifyRazorpayWalletPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            setWallet(out.wallet);
            setInrTopUp("");
            setLedgerMessage(
              out.alreadyProcessed
                ? "Payment was already applied to your wallet."
                : `Success · credited ${fmt.format(out.algoCredited ?? order.algoCredit)} ALGO`,
            );
            await load();
            emitAppWalletRefresh();
          } catch (e) {
            setLedgerMessage(e instanceof Error ? e.message : "Verification failed.");
          } finally {
            setRzBusy(false);
          }
        },
        modal: {
          ondismiss: () => setRzBusy(false),
        },
      });
      rz.open();
    } catch (e) {
      setLedgerMessage(e instanceof Error ? e.message : "Could not start Razorpay.");
      setRzBusy(false);
    }
  }, [load, rzKeyId, rzReady, user, inrTopUp]);

  const reservedShares = useMemo(
    () => holdings.reduce((sum, h) => sum + (h.reservedQuantity ?? 0), 0),
    [holdings],
  );

  const handleWithdraw = useCallback(async () => {
    if (!user) {
      setLedgerMessage("Sign in to withdraw from your app wallet.");
      return;
    }
    const amount = Number(withdrawAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setLedgerMessage("Enter a valid amount to withdraw.");
      return;
    }
    setLedgerBusy(true);
    setLedgerMessage(null);
    try {
      const out = await apiPostWalletWithdraw(amount);
      setWallet(out.wallet);
      setWithdrawAmount("");
      setLedgerMessage(`Withdrew ${fmt.format(amount)} ALGO from your app wallet.`);
      await load();
    } catch (e) {
      setLedgerMessage(e instanceof Error ? e.message : "Could not withdraw.");
    } finally {
      setLedgerBusy(false);
    }
  }, [load, user, withdrawAmount]);

  const handleCancelOrder = useCallback(
    async (order: TradingOrder) => {
      setCancelBusyId(order.id);
      try {
        await apiCancelProjectOrder(order.projectId, order.id);
        await load();
        emitAppWalletRefresh();
      } catch (e) {
        setLedgerMessage(e instanceof Error ? e.message : "Could not cancel order.");
      } finally {
        setCancelBusyId(null);
      }
    },
    [load],
  );

  const peraBalance = pera.balanceMicro != null ? microToAlgo(pera.balanceMicro) : null;

  return (
    <section className="mx-auto max-w-5xl space-y-6 py-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent-light">Wallet</p>
          <h1 className="mt-1 text-2xl font-bold sm:text-3xl">Manage balances</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted">
            Your <strong className="text-foreground">app wallet</strong> holds ALGO for instant order matching. Connect{" "}
            <strong className="text-foreground">Pera</strong> for on-chain TestNet identity and funding.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/portfolio"
            className="rounded-xl border border-card-border bg-card px-4 py-2 text-sm font-semibold text-foreground transition hover:border-accent/40"
          >
            Portfolio
          </Link>
          <Link
            href="/market"
            className="rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent/90"
          >
            Trade
          </Link>
        </div>
      </div>

      {loadError && (
        <div className="rounded-xl border border-loss/30 bg-loss/10 px-4 py-3 text-sm text-loss">{loadError}</div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card overflow-hidden"
        >
          <div className="border-b border-card-border bg-gradient-to-br from-indigo-500/10 to-purple-500/10 px-5 py-4">
            <h2 className="text-sm font-semibold text-foreground">App wallet (trading)</h2>
            <p className="mt-1 text-xs text-muted">Used for buys, sells, and order reservations on Valyou.</p>
          </div>
          <div className="space-y-4 p-5">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-card-border bg-card/50 p-3">
                <p className="text-[10px] uppercase tracking-wider text-muted">Available</p>
                <p className="mt-1 text-lg font-bold tabular-nums">{fmt.format(wallet?.availableBalance ?? 0)}</p>
                <p className="text-[11px] text-muted">ALGO</p>
              </div>
              <div className="rounded-xl border border-card-border bg-card/50 p-3">
                <p className="text-[10px] uppercase tracking-wider text-muted">Reserved</p>
                <p className="mt-1 text-lg font-bold tabular-nums text-amber-200">{fmt.format(wallet?.reservedBalance ?? 0)}</p>
                <p className="text-[11px] text-muted">Open buy orders</p>
              </div>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-card-border bg-background/40 px-4 py-3 text-sm">
              <span className="text-muted">Total ledger</span>
              <span className="font-semibold tabular-nums">{fmt.format(wallet?.balance ?? 0)} ALGO</span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-lg border border-card-border/80 bg-card/30 px-3 py-2">
                <p className="text-muted">Invested (cost)</p>
                <p className="mt-0.5 font-semibold tabular-nums">{fmt.format(wallet?.invested ?? 0)} ALGO</p>
              </div>
              <div className="rounded-lg border border-card-border/80 bg-card/30 px-3 py-2">
                <p className="text-muted">Mark value</p>
                <p className="mt-0.5 font-semibold tabular-nums">{fmt.format(wallet?.currentValue ?? 0)} ALGO</p>
              </div>
              <div className="col-span-2 rounded-lg border border-card-border/80 bg-card/30 px-3 py-2">
                <p className="text-muted">PnL</p>
                <p className={`mt-0.5 font-semibold tabular-nums ${(wallet?.pnl ?? 0) >= 0 ? "text-gain" : "text-loss"}`}>
                  {(wallet?.pnl ?? 0) >= 0 ? "+" : ""}
                  {fmt.format(wallet?.pnl ?? 0)} ALGO ({(wallet?.pnlPercent ?? 0) >= 0 ? "+" : ""}
                  {fmt.format(wallet?.pnlPercent ?? 0)}%)
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-dashed border-card-border bg-card/20 p-4 space-y-4">
              <div>
                <p className="text-xs font-semibold text-foreground">Fund app wallet</p>
                <p className="mt-1 text-[11px] text-muted">
                  Top-ups are <strong className="text-foreground/90">only</strong> through Razorpay (INR). After payment is verified on the
                  server, your in-app <strong className="text-foreground/90">ALGO</strong> balance is credited. Withdrawals below still move
                  ALGO inside the app ledger only (not on-chain).
                </p>
              </div>

              {!user && !authLoading && (
                <p className="text-xs text-amber-200">
                  <Link href="/auth/sign-in" className="font-semibold text-accent-light underline">
                    Sign in
                  </Link>{" "}
                  to top up or withdraw.
                </p>
              )}

              {user && rzReady && (
                <div className="rounded-lg border border-card-border/80 bg-background/40 p-3 space-y-3">
                  <p className="text-[11px] font-semibold text-foreground">Razorpay (INR)</p>
                  <p className="text-[10px] text-muted">
                    Rate: 1 INR → {algoPerInr} ALGO (set <code className="text-accent-light/90">WALLET_ALGO_PER_INR</code> on
                    the server).
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {inrPresets.map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setInrTopUp(String(amt))}
                        className="rounded-lg border border-card-border bg-background/60 px-2.5 py-1 text-[11px] font-medium text-muted transition hover:border-accent/40 hover:text-foreground"
                      >
                        ₹{amt.toLocaleString("en-IN")}
                      </button>
                    ))}
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <input
                      type="number"
                      min={1}
                      step="any"
                      value={inrTopUp}
                      onChange={(e) => setInrTopUp(e.target.value)}
                      placeholder="Amount (INR)"
                      className="flex-1 rounded-lg border border-card-border bg-background px-3 py-2 text-sm"
                    />
                    <button
                      type="button"
                      disabled={rzBusy}
                      onClick={() => void handleRazorpayTopUp()}
                      className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition hover:bg-indigo-500 disabled:opacity-50"
                    >
                      {rzBusy ? "Opening…" : "Pay with Razorpay"}
                    </button>
                  </div>
                  {Number(inrTopUp) > 0 && (
                    <p className="text-[11px] text-muted">
                      Estimated credit: <span className="font-semibold text-foreground">{estimatedAlgoForInr} ALGO</span>
                    </p>
                  )}
                </div>
              )}

              {user && !rzReady && (
                <p className="rounded-lg border border-amber-400/20 bg-amber-500/10 px-3 py-2 text-[11px] text-amber-100">
                  Razorpay is not active. Add <code className="text-foreground/90">RAZORPAY_KEY_ID</code> and{" "}
                  <code className="text-foreground/90">RAZORPAY_KEY_SECRET</code> to your environment and restart the app.
                </p>
              )}

              {user && (
                <div className="space-y-3 border-t border-card-border/60 pt-3">
                  <p className="text-[11px] font-semibold text-muted">Withdraw (in-app ALGO)</p>
                  <p className="text-[10px] text-muted">Reduces your app wallet available balance only.</p>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <input
                      type="number"
                      min={0}
                      step="any"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      placeholder="Withdraw amount (ALGO)"
                      className="flex-1 rounded-lg border border-card-border bg-background px-3 py-2 text-sm"
                    />
                    <button
                      type="button"
                      disabled={ledgerBusy}
                      onClick={() => void handleWithdraw()}
                      className="rounded-lg border border-loss/40 bg-loss/10 px-4 py-2 text-sm font-semibold text-loss transition hover:bg-loss/20 disabled:opacity-50"
                    >
                      Withdraw
                    </button>
                  </div>
                </div>
              )}
              {ledgerMessage && <p className="text-xs text-foreground/90">{ledgerMessage}</p>}
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="glass-card overflow-hidden"
        >
          <div className="border-b border-card-border bg-gradient-to-br from-cyan-500/10 to-emerald-500/10 px-5 py-4">
            <h2 className="text-sm font-semibold text-foreground">Pera (TestNet)</h2>
            <p className="mt-1 text-xs text-muted">On-chain ALGO for identity and external transfers.</p>
          </div>
          <div className="space-y-4 p-5">
            <div className="rounded-xl border border-card-border bg-card/50 p-4">
              <p className="text-[10px] uppercase tracking-wider text-muted">Address</p>
              <p className="mt-1 break-all font-mono text-xs text-foreground">{pera.activeAccount ?? "Not connected"}</p>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-card-border bg-card/50 px-4 py-3">
              <span className="text-sm text-muted">Balance</span>
              <span className="text-lg font-bold tabular-nums">{peraBalance != null ? formatAlgo(peraBalance) : "—"}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void pera.connect()}
                disabled={pera.connecting}
                className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                {pera.activeAccount ? "Reconnect" : pera.connecting ? "Connecting…" : "Connect Pera"}
              </button>
              <button
                type="button"
                onClick={() => void pera.refreshBalance()}
                className="rounded-lg border border-card-border px-4 py-2 text-sm font-semibold text-foreground hover:border-accent/40"
              >
                Refresh
              </button>
              <button
                type="button"
                onClick={() => window.open(TESTNET_FAUCET_URL, "_blank", "noopener,noreferrer")}
                className="rounded-lg border border-card-border px-4 py-2 text-sm font-semibold text-foreground hover:border-accent/40"
              >
                Faucet
              </button>
            </div>
            <p className="text-[11px] leading-relaxed text-muted">
              Pera does not automatically fund the in-app ledger. Use <strong className="text-foreground/90">Add ALGO</strong>{" "}
              above for simulated app balance, or trade after topping up the app wallet from your session account.
            </p>
          </div>
        </motion.div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="glass-card p-5 lg:col-span-1"
        >
          <h3 className="text-sm font-semibold">Share liquidity</h3>
          <p className="mt-1 text-xs text-muted">Reserved for open sell orders.</p>
          <p className="mt-4 text-3xl font-bold tabular-nums">{fmt.format(reservedShares)}</p>
          <p className="text-xs text-muted">shares locked</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-5 lg:col-span-2"
        >
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold">Open orders</h3>
            <button
              type="button"
              onClick={() => void load()}
              className="text-xs font-semibold text-accent-light hover:underline"
            >
              Refresh
            </button>
          </div>
          {orders.length === 0 ? (
            <p className="mt-4 text-sm text-muted">No open orders. Place limit or market orders from a project trade page.</p>
          ) : (
            <ul className="mt-4 space-y-2">
              {orders.map((order) => (
                <li
                  key={order.id}
                  className="flex flex-col gap-2 rounded-xl border border-card-border bg-card/40 p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-medium text-foreground">
                      {projectTitleById.get(order.projectId) ?? order.projectId}
                    </p>
                    <p className="text-xs text-muted">
                      <span className="uppercase">{order.side}</span> · {order.type}
                      {order.type === "limit" ? ` @ ${fmt.format(order.limitPrice ?? 0)} ALGO` : ""} · remaining{" "}
                      {fmt.format(order.remainingQuantity)} / {fmt.format(order.quantity)} sh
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/trade/${order.projectId}`}
                      className="rounded-lg border border-card-border px-3 py-1.5 text-xs font-semibold hover:border-accent/40"
                    >
                      Trade
                    </Link>
                    <button
                      type="button"
                      disabled={cancelBusyId === order.id}
                      onClick={() => void handleCancelOrder(order)}
                      className="rounded-lg bg-loss/15 px-3 py-1.5 text-xs font-semibold text-loss hover:bg-loss/25 disabled:opacity-50"
                    >
                      {cancelBusyId === order.id ? "Cancelling…" : "Cancel"}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12 }}
        className="glass-card overflow-hidden"
      >
        <div className="flex items-center justify-between border-b border-card-border px-5 py-4">
          <h3 className="text-sm font-semibold">Recent fills</h3>
          <span className="text-xs text-muted">{fills.length} loaded</span>
        </div>
        {fills.length === 0 ? (
          <p className="p-5 text-sm text-muted">No executed trades yet for this account.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="border-b border-card-border text-left text-xs text-muted">
                <tr>
                  <th className="px-5 py-3">Project</th>
                  <th className="px-5 py-3">Side</th>
                  <th className="px-5 py-3 text-right">Qty</th>
                  <th className="px-5 py-3 text-right">Price</th>
                  <th className="px-5 py-3">Time</th>
                </tr>
              </thead>
              <tbody>
                {fills.map((f) => (
                  <tr key={f.id} className="border-b border-card-border/60">
                    <td className="px-5 py-3">
                      <Link href={`/trade/${f.projectId}`} className="font-medium hover:underline">
                        {projectTitleById.get(f.projectId) ?? f.projectId}
                      </Link>
                    </td>
                    <td className="px-5 py-3">
                      <span className={f.side === "buy" ? "text-gain" : "text-loss"}>{f.side}</span>
                      <span className="ml-1 text-[10px] text-muted">({f.role})</span>
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums">{fmt.format(f.quantity)}</td>
                    <td className="px-5 py-3 text-right tabular-nums">{fmt.format(f.price)} ALGO</td>
                    <td className="px-5 py-3 text-xs text-muted">{f.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {holdings.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.14 }}
          className="glass-card p-5"
        >
          <h3 className="text-sm font-semibold">Holdings snapshot</h3>
          <p className="mt-1 text-xs text-muted">Full detail on the portfolio page.</p>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {holdings.slice(0, 6).map((h) => (
              <li key={h.projectId} className="flex items-center justify-between rounded-lg border border-card-border bg-card/30 px-3 py-2">
                <Link href={`/trade/${h.projectId}`} className="truncate text-sm font-medium hover:underline">
                  {h.title}
                </Link>
                <span className="shrink-0 text-xs tabular-nums text-muted">
                  {formatAlgoShort(h.currentValue)} · {fmt.format(h.quantity)} sh
                </span>
              </li>
            ))}
          </ul>
        </motion.div>
      )}
    </section>
  );
}
