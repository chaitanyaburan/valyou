"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { usePeraTestnet } from "@/components/providers/PeraTestnetProvider";
import { apiGetHoldings, apiGetOpenOrders, apiGetProjects, apiGetWallet, type WalletData } from "@/lib/api-client";
import { mergePostedWithApi, subscribeMarketProjects } from "@/lib/market-projects";
import type { Holding, ProjectStock, TradingOrder } from "@/lib/data";

const fmt = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 });

export default function PortfolioPage() {
  const pera = usePeraTestnet();
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [orders, setOrders] = useState<TradingOrder[]>([]);
  const [projects, setProjects] = useState<ProjectStock[]>([]);

  const load = useCallback(async () => {
    const [nextWallet, nextHoldings, nextOrders, apiProjects] = await Promise.all([
      apiGetWallet().catch(() => null),
      apiGetHoldings().catch(() => []),
      apiGetOpenOrders().catch(() => ({ userId: "demo", orders: [] })),
      apiGetProjects().catch(() => [] as ProjectStock[]),
    ]);
    setWallet(nextWallet);
    setHoldings(nextHoldings);
    setOrders(nextOrders.orders);
    setProjects(await mergePostedWithApi(apiProjects));
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

  const reservedShares = useMemo(
    () => holdings.reduce((sum, holding) => sum + (holding.reservedQuantity ?? 0), 0),
    [holdings],
  );
  const bestHolding = useMemo(
    () =>
      holdings.reduce<Holding | null>((best, current) => {
        if (!best) return current;
        return current.currentValue - current.invested > best.currentValue - best.invested ? current : best;
      }, null),
    [holdings],
  );

  return (
    <section className="space-y-5 py-6">
      <div className="glass-card overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-cyan-500/10 p-5 sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent-light">Portfolio</p>
              <h1 className="mt-2 text-2xl font-bold sm:text-3xl">Live ALGO Trading State</h1>
              <p className="mt-2 max-w-2xl text-sm text-muted">
                Your app wallet settles trades instantly while Pera stays visible for identity and funding context.
              </p>
              <Link
                href="/wallet"
                className="mt-3 inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-4 py-2 text-xs font-semibold text-accent-light transition hover:bg-accent/15"
              >
                Manage wallet →
              </Link>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:w-[420px]">
              <div className="rounded-2xl border border-card-border bg-background/70 p-4">
                <p className="text-xs text-muted">Pera wallet</p>
                <p className="mt-2 truncate font-mono text-sm">{pera.activeAccount ?? "Not connected"}</p>
              </div>
              <div className="rounded-2xl border border-card-border bg-background/70 p-4">
                <p className="text-xs text-muted">App wallet</p>
                <p className="mt-2 text-xl font-semibold">{fmt.format(wallet?.availableBalance ?? 0)} ALGO</p>
                <p className="mt-1 text-xs text-muted">Reserved {fmt.format(wallet?.reservedBalance ?? 0)} ALGO</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="glass-card p-4">
          <p className="text-xs text-muted">Available</p>
          <p className="mt-1 text-xl font-semibold">{fmt.format(wallet?.availableBalance ?? 0)} ALGO</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-xs text-muted">Reserved ALGO</p>
          <p className="mt-1 text-xl font-semibold">{fmt.format(wallet?.reservedBalance ?? 0)} ALGO</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-xs text-muted">Reserved shares</p>
          <p className="mt-1 text-xl font-semibold">{fmt.format(reservedShares)}</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-xs text-muted">Best holding</p>
          <p className="mt-1 text-sm font-semibold">{bestHolding ? bestHolding.title : "No holdings yet"}</p>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.3fr_0.9fr]">
        <div className="glass-card p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold">Holdings</h2>
              <p className="mt-1 text-xs text-muted">Live mark-to-market using current project price.</p>
            </div>
            <button
              type="button"
              onClick={() => void load()}
              className="rounded-lg border border-card-border px-3 py-1.5 text-xs font-semibold hover:border-accent/40"
            >
              Refresh
            </button>
          </div>
          {holdings.length === 0 ? (
            <div className="mt-4 rounded-xl border border-dashed border-card-border p-6 text-center text-sm text-muted">
              No holdings yet.
            </div>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="text-left text-xs text-muted">
                  <tr>
                    <th className="pb-3">Project</th>
                    <th className="pb-3 text-right">Shares</th>
                    <th className="pb-3 text-right">Reserved</th>
                    <th className="pb-3 text-right">Value</th>
                    <th className="pb-3 text-right">PnL</th>
                  </tr>
                </thead>
                <tbody>
                  {holdings.map((holding) => {
                    const pnl = holding.currentValue - holding.invested;
                    return (
                      <tr key={holding.projectId} className="border-t border-card-border">
                        <td className="py-3">
                          <Link href={`/trade/${holding.projectId}`} className="font-medium hover:underline">
                            {holding.title}
                          </Link>
                          <p className="text-xs text-muted">{holding.creatorName}</p>
                        </td>
                        <td className="py-3 text-right">{fmt.format(holding.quantity)}</td>
                        <td className="py-3 text-right">{fmt.format(holding.reservedQuantity ?? 0)}</td>
                        <td className="py-3 text-right">{fmt.format(holding.currentValue)} ALGO</td>
                        <td className={`py-3 text-right ${pnl >= 0 ? "text-gain" : "text-loss"}`}>
                          {pnl >= 0 ? "+" : ""}
                          {fmt.format(pnl)} ALGO
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="space-y-5">
          <div className="glass-card p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold">Open Orders</h2>
                <p className="mt-1 text-xs text-muted">Reserved capital stays locked until fill or cancel.</p>
              </div>
              <span className="rounded-full border border-card-border px-2.5 py-1 text-[11px] text-muted">
                {orders.length} open
              </span>
            </div>
            <div className="mt-4 space-y-3">
              {orders.length === 0 ? (
                <div className="rounded-xl border border-dashed border-card-border p-5 text-center text-sm text-muted">
                  No open orders.
                </div>
              ) : (
                orders.map((order) => (
                  <div key={order.id} className="rounded-xl border border-card-border bg-card/40 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold uppercase">{order.side}</p>
                        <p className="mt-1 text-xs text-muted">
                          {fmt.format(order.remainingQuantity)} / {fmt.format(order.quantity)} shares
                        </p>
                        <p className="mt-1 text-xs text-muted">
                          {order.type === "limit" ? `${fmt.format(order.limitPrice ?? 0)} ALGO limit` : "Market"}
                        </p>
                      </div>
                      <Link href={`/trade/${order.projectId}`} className="text-xs font-semibold text-accent-light hover:underline">
                        Manage
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="glass-card p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold">Watchlist</h2>
                <p className="mt-1 text-xs text-muted">Jump into active markets quickly.</p>
              </div>
              <span className="rounded-full border border-card-border px-2.5 py-1 text-[11px] text-muted">
                {projects.length} markets
              </span>
            </div>
            <div className="mt-4 space-y-3">
              {projects.slice(0, 4).map((project) => (
                <Link key={project.id} href={`/trade/${project.id}`} className="block rounded-xl border border-card-border bg-card/40 p-4 transition hover:border-accent/30">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold">{project.title}</p>
                      <p className="mt-1 text-xs text-muted">{project.tagline}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{fmt.format(project.price)} ALGO</p>
                      <p className={`text-xs ${project.changePercent >= 0 ? "text-gain" : "text-loss"}`}>
                        {project.changePercent >= 0 ? "+" : ""}
                        {fmt.format(project.changePercent)}%
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
