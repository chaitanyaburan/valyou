"use client";

import { useParams } from "next/navigation";
import { useMemo, useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RTooltip,
  BarChart,
  Bar,
} from "recharts";
import Link from "next/link";
import {
  getProjectById,
  getChartData,
  getOrderBook,
  getRecentTrades,
  get24hStats,
  projects,
} from "@/lib/data";
import Avatar from "@/components/Avatar";
import PriceChange from "@/components/PriceChange";
import SparklineChart from "@/components/SparklineChart";
import { BatchTimelineFull } from "@/components/BatchTimeline";
import DisputeBanner from "@/components/DisputeBanner";
import DisputeModal from "@/components/DisputeModal";

const fmt = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });
const fmtCompact = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

const periods = ["1D", "1W", "1M", "3M", "1Y"] as const;

function sliceByPeriod(
  data: ReturnType<typeof getChartData>,
  period: string
) {
  switch (period) {
    case "1D": return data.slice(-2);
    case "1W": return data.slice(-7);
    case "1M": return data.slice(-30);
    case "1Y": return data;
    default: return data;
  }
}

const quickAmounts = [100, 500, 1000, 5000];

const stakingConfig: Record<string, { bg: string; text: string; border: string; glow: string }> = {
  Diamond: { bg: "bg-cyan-500/10", text: "text-cyan-400", border: "border-cyan-500/20", glow: "shadow-cyan-500/10" },
  Platinum: { bg: "bg-violet-500/10", text: "text-violet-400", border: "border-violet-500/20", glow: "shadow-violet-500/10" },
  Gold: { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/20", glow: "shadow-amber-500/10" },
  Silver: { bg: "bg-zinc-400/10", text: "text-zinc-400", border: "border-zinc-400/20", glow: "shadow-zinc-400/10" },
  Bronze: { bg: "bg-orange-500/10", text: "text-orange-400", border: "border-orange-500/20", glow: "shadow-orange-500/10" },
};

/* eslint-disable @typescript-eslint/no-explicit-any */
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-card-border bg-card/95 px-4 py-3 shadow-2xl backdrop-blur-sm">
      <p className="mb-1 text-xs text-muted">{label}</p>
      <p className="text-lg font-bold text-foreground">{fmt.format(Number(payload[0].value))} ALGO</p>
      {payload[1] && (
        <p className="mt-1 text-xs text-muted">Vol: {payload[1].value?.toLocaleString("en-US")} ALGO</p>
      )}
    </div>
  );
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export default function TradePage() {
  const params = useParams();
  const id = params.id as string;
  const project = getProjectById(id);
  const fullChart = useMemo(() => getChartData(id), [id]);
  const orderBook = useMemo(() => getOrderBook(id), [id]);
  const recentTrades = useMemo(() => getRecentTrades(id), [id]);
  const stats24h = useMemo(() => get24hStats(id), [id]);

  const [period, setPeriod] = useState<string>("3M");
  const [tab, setTab] = useState<"buy" | "sell">("buy");
  const [orderType, setOrderType] = useState<"market" | "limit">("market");
  const [amount, setAmount] = useState("");
  const [limitPrice, setLimitPrice] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [sliderValue, setSliderValue] = useState(0);
  const [activeInfoTab, setActiveInfoTab] = useState<"orderbook" | "trades">("orderbook");
  const [chartReady, setChartReady] = useState(false);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  useEffect(() => setChartReady(true), []);

  useEffect(() => {
    if (!project) return;
    const scrollToTimeline = () => {
      if (typeof window === "undefined" || window.location.hash !== "#investor-timeline") return;
      requestAnimationFrame(() => {
        document.getElementById("investor-timeline")?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    };
    scrollToTimeline();
    window.addEventListener("hashchange", scrollToTimeline);
    return () => window.removeEventListener("hashchange", scrollToTimeline);
  }, [project?.id]);

  const relatedProjects = useMemo(
    () => projects.filter((p) => p.id !== id).slice(0, 4),
    [id]
  );

  if (!project) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card p-12 text-center"
        >
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-loss/10">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M15 9l-6 6M9 9l6 6" />
            </svg>
          </div>
          <p className="mb-2 text-2xl font-semibold">Project not found</p>
          <p className="mb-6 text-muted">The project you&apos;re looking for doesn&apos;t exist.</p>
          <Link
            href="/market"
            className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-light"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Back to Market
          </Link>
        </motion.div>
      </div>
    );
  }

  const chartData = sliceByPeriod(fullChart, period);
  const isPositive = project.changePercent >= 0;
  const strokeColor = isPositive ? "#22c55e" : "#ef4444";
  const effectivePrice = orderType === "limit" && limitPrice ? parseFloat(limitPrice) : project.price;
  const units = amount ? (parseFloat(amount) / effectivePrice).toFixed(4) : "0.0000";
  const staking = stakingConfig[project.creator.stakingLevel] || stakingConfig.Bronze;
  const maxBidTotal = Math.max(...orderBook.bids.map((b) => b.total));
  const maxAskTotal = Math.max(...orderBook.asks.map((a) => a.total));
  const fundedPct = Math.round((project.fundingRaised / project.fundingGoal) * 100);

  const handleOrder = useCallback(() => {
    if (!amount || parseFloat(amount) <= 0) return;
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2500);
    setAmount("");
    setSliderValue(0);
  }, [amount]);

  const handleSlider = useCallback(
    (pct: number) => {
      setSliderValue(pct);
      const walletBalance = 10000;
      setAmount(String(Math.floor((pct / 100) * walletBalance)));
    },
    []
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="py-4 space-y-5"
    >
      <div className="flex items-center gap-2 text-sm">
        <Link href="/market" className="text-muted transition hover:text-foreground">Market</Link>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-muted/50"><path d="M9 18l6-6-6-6" /></svg>
        <span className="text-foreground font-medium">{project.title}</span>
      </div>

      {/* ═══════════ HERO HEADER ═══════════ */}
      <motion.div className="glass-card overflow-hidden" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <div className="p-6 pb-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${project.coverGradient}`}>
                <svg className="h-7 w-7 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={project.coverIcon} />
                </svg>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold tracking-tight">{project.title}</h1>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Avatar initials={project.creator.avatar} size="xs" />
                  <span className="text-sm text-muted">{project.creator.name}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${staking.bg} ${staking.text} border ${staking.border}`}>
                    {project.creator.stakingLevel}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-end gap-6 sm:text-right">
              <div>
                <p className="text-xs text-muted uppercase tracking-wider mb-0.5">Share Price</p>
                <p className="text-3xl font-bold tabular-nums tracking-tight">{fmt.format(project.price)} <span className="text-sm text-muted">ALGO</span></p>
                <PriceChange value={project.change} percent={project.changePercent} />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-px border-t border-card-border bg-card-border sm:grid-cols-4 lg:grid-cols-8">
          {[
            { label: "24h Open", value: `${fmt.format(stats24h.open)} ALGO` },
            { label: "24h High", value: `${fmt.format(stats24h.high)} ALGO`, className: "text-gain" },
            { label: "24h Low", value: `${fmt.format(stats24h.low)} ALGO`, className: "text-loss" },
            { label: "24h Vol", value: stats24h.volume24h },
            { label: "Trades", value: stats24h.trades24h.toLocaleString("en-US") },
            { label: "Backers", value: stats24h.backers },
            { label: "ATH", value: `${fmtCompact.format(stats24h.allTimeHigh)} ALGO` },
            { label: "Rank", value: `#${stats24h.rank}` },
          ].map((s) => (
            <div key={s.label} className="bg-background/60 px-4 py-2.5">
              <p className="text-[10px] uppercase tracking-wider text-muted">{s.label}</p>
              <p className={`text-sm font-semibold tabular-nums ${s.className || "text-foreground"}`}>{s.value}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ═══════════ MAIN GRID ═══════════ */}
      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          {/* PRICE CHART */}
          <motion.div className="glass-card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div className="flex items-center justify-between border-b border-card-border px-6 py-4">
              <div className="flex items-center gap-3">
                <h2 className="text-base font-semibold">Price Chart</h2>
                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${isPositive ? "bg-gain/10 text-gain" : "bg-loss/10 text-loss"}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${isPositive ? "bg-gain" : "bg-loss"}`} />
                  LIVE
                </span>
              </div>
              <div className="flex gap-1 rounded-lg bg-card p-0.5">
                {periods.map((p) => (
                  <button
                    key={p}
                    onClick={() => setPeriod(p)}
                    className={`relative rounded-md px-3 py-1 text-xs font-medium transition-all ${period === p ? "text-white" : "text-muted hover:text-foreground"}`}
                  >
                    {period === p && (
                      <motion.span layoutId="chart-period" className="absolute inset-0 rounded-md bg-accent" transition={{ type: "spring", stiffness: 400, damping: 30 }} />
                    )}
                    <span className="relative z-10">{p}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="px-6 pt-4 pb-2">
              {chartReady ? (
                <ResponsiveContainer width="100%" height={380}>
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={strokeColor} stopOpacity={0.25} />
                        <stop offset="50%" stopColor={strokeColor} stopOpacity={0.08} />
                        <stop offset="100%" stopColor={strokeColor} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" vertical={false} />
                    <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: "#71717a", fontSize: 11 }} interval="preserveStartEnd" />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: "#71717a", fontSize: 11 }} domain={["auto", "auto"]} tickFormatter={(v) => `${v}`} width={50} />
                    <RTooltip content={<CustomTooltip />} cursor={{ stroke: "#6366f1", strokeWidth: 1, strokeDasharray: "4 4" }} />
                    <Area type="monotone" dataKey="price" stroke={strokeColor} strokeWidth={2} fill="url(#priceGradient)" animationDuration={800} animationEasing="ease-out" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[380px] w-full animate-pulse rounded-lg bg-card" />
              )}
            </div>

            <div className="px-6 pb-4">
              <p className="mb-1 text-[10px] uppercase tracking-wider text-muted">Volume</p>
              {chartReady ? (
                <ResponsiveContainer width="100%" height={50}>
                  <BarChart data={chartData} margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                    <Bar dataKey="volume" fill={isPositive ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)"} stroke={isPositive ? "rgba(34,197,94,0.4)" : "rgba(239,68,68,0.4)"} strokeWidth={1} radius={[2, 2, 0, 0]} animationDuration={600} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[50px] w-full animate-pulse rounded-lg bg-card" />
              )}
            </div>
          </motion.div>

          {/* ORDER BOOK + RECENT TRADES */}
          <motion.div className="glass-card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <div className="flex border-b border-card-border">
              {(["orderbook", "trades"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setActiveInfoTab(t)}
                  className={`relative px-6 py-3 text-sm font-medium transition ${activeInfoTab === t ? "text-foreground" : "text-muted hover:text-foreground"}`}
                >
                  {t === "orderbook" ? "Order Book" : "Recent Trades"}
                  {activeInfoTab === t && (
                    <motion.span layoutId="info-tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent" transition={{ type: "spring", stiffness: 400, damping: 30 }} />
                  )}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              {activeInfoTab === "orderbook" ? (
                <motion.div key="orderbook" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="grid grid-cols-2 gap-px bg-card-border">
                  <div className="bg-background/60 p-4">
                    <div className="mb-2 flex justify-between text-[10px] uppercase tracking-wider text-muted"><span>Price</span><span>Qty</span><span>Total</span></div>
                    <div className="space-y-0.5">
                      {orderBook.bids.map((b, i) => (
                        <div key={i} className="relative flex justify-between py-1 text-xs tabular-nums">
                          <div className="absolute inset-y-0 left-0 rounded-r bg-gain/8" style={{ width: `${(b.total / maxBidTotal) * 100}%` }} />
                          <span className="relative z-10 text-gain font-medium">{fmt.format(b.price)}</span>
                          <span className="relative z-10 text-foreground/70">{b.quantity}</span>
                          <span className="relative z-10 text-foreground/50">{b.total.toLocaleString("en-IN")}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-background/60 p-4">
                    <div className="mb-2 flex justify-between text-[10px] uppercase tracking-wider text-muted"><span>Price</span><span>Qty</span><span>Total</span></div>
                    <div className="space-y-0.5">
                      {orderBook.asks.map((a, i) => (
                        <div key={i} className="relative flex justify-between py-1 text-xs tabular-nums">
                          <div className="absolute inset-y-0 right-0 rounded-l bg-loss/8" style={{ width: `${(a.total / maxAskTotal) * 100}%` }} />
                          <span className="relative z-10 text-loss font-medium">{fmt.format(a.price)}</span>
                          <span className="relative z-10 text-foreground/70">{a.quantity}</span>
                          <span className="relative z-10 text-foreground/50">{a.total.toLocaleString("en-IN")}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div key="trades" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="p-4">
                  <div className="mb-2 grid grid-cols-5 text-[10px] uppercase tracking-wider text-muted">
                    <span>Time</span><span>Type</span><span className="text-right">Price</span><span className="text-right">Qty</span><span className="text-right">Trader</span>
                  </div>
                  <div className="max-h-[260px] overflow-y-auto space-y-0.5 scrollbar-thin">
                    {recentTrades.map((t) => (
                      <motion.div key={t.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2 }} className="grid grid-cols-5 items-center py-1.5 text-xs tabular-nums hover:bg-white/[0.02] rounded transition">
                        <span className="text-muted">{t.time}</span>
                        <span><span className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${t.type === "buy" ? "bg-gain/10 text-gain" : "bg-loss/10 text-loss"}`}>{t.type}</span></span>
                        <span className={`text-right font-medium ${t.type === "buy" ? "text-gain" : "text-loss"}`}>{fmt.format(t.price)}</span>
                        <span className="text-right text-foreground/70">{t.quantity}</span>
                        <span className="text-right text-muted">{t.user}</span>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* ─── RIGHT COLUMN ─── */}
        <div className="space-y-5">
          {/* BUY / SELL PANEL */}
          <motion.div className="glass-card" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}>
            <div className="flex border-b border-card-border">
              <button onClick={() => setTab("buy")} className={`relative flex-1 py-3 text-sm font-semibold transition ${tab === "buy" ? "text-gain" : "text-muted hover:text-foreground"}`}>
                Buy
                {tab === "buy" && <motion.span layoutId="trade-tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-gain" transition={{ type: "spring", stiffness: 400, damping: 30 }} />}
              </button>
              <button onClick={() => setTab("sell")} className={`relative flex-1 py-3 text-sm font-semibold transition ${tab === "sell" ? "text-loss" : "text-muted hover:text-foreground"}`}>
                Sell
                {tab === "sell" && <motion.span layoutId="trade-tab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-loss" transition={{ type: "spring", stiffness: 400, damping: 30 }} />}
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted">Available Balance</span>
                <span className="font-semibold text-foreground">10,000.00 ALGO</span>
              </div>

              <div className="flex gap-1 rounded-lg bg-card p-0.5">
                {(["market", "limit"] as const).map((ot) => (
                  <button key={ot} onClick={() => setOrderType(ot)} className={`flex-1 rounded-md py-1.5 text-xs font-medium capitalize transition-all ${orderType === ot ? "bg-card-border text-foreground" : "text-muted hover:text-foreground"}`}>{ot}</button>
                ))}
              </div>

              <AnimatePresence>
                {orderType === "limit" && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                    <label className="mb-1.5 block text-xs text-muted">Limit Price (ALGO)</label>
                    <input type="number" value={limitPrice} onChange={(e) => setLimitPrice(e.target.value)} placeholder={project.price.toFixed(2)} className="w-full rounded-lg border border-card-border bg-card px-4 py-2.5 text-sm text-foreground placeholder:text-muted/40 transition focus:border-accent focus:outline-none" />
                  </motion.div>
                )}
              </AnimatePresence>

              <div>
                <label className="mb-1.5 block text-xs text-muted">Amount (ALGO)</label>
                <input type="number" value={amount} onChange={(e) => { setAmount(e.target.value); const pct = Math.min(100, Math.max(0, (parseFloat(e.target.value) / 10000) * 100)); setSliderValue(isNaN(pct) ? 0 : pct); }} placeholder="Enter amount" className="w-full rounded-lg border border-card-border bg-card px-4 py-2.5 text-sm text-foreground placeholder:text-muted/40 transition focus:border-accent focus:outline-none" />
              </div>

              <div className="flex gap-1.5">
                {quickAmounts.map((qa) => (
                  <button key={qa} onClick={() => { setAmount(String(qa)); setSliderValue(Math.min(100, (qa / 10000) * 100)); }} className={`flex-1 rounded-md border py-1.5 text-[11px] font-medium transition ${amount === String(qa) ? tab === "buy" ? "border-gain/30 bg-gain/10 text-gain" : "border-loss/30 bg-loss/10 text-loss" : "border-card-border bg-card text-muted hover:text-foreground hover:border-accent/30"}`}>
                    {qa.toLocaleString()}
                  </button>
                ))}
              </div>

              <div className="space-y-2">
                <input type="range" min={0} max={100} value={sliderValue} onChange={(e) => handleSlider(Number(e.target.value))} className="slider-thumb w-full accent-accent" />
                <div className="flex justify-between">
                  {[0, 25, 50, 75, 100].map((pct) => (
                    <button key={pct} onClick={() => handleSlider(pct)} className={`rounded px-1.5 py-0.5 text-[10px] font-medium transition ${sliderValue === pct ? "bg-accent/20 text-accent-light" : "text-muted hover:text-foreground"}`}>{pct}%</button>
                  ))}
                </div>
              </div>

              <div className="space-y-2 rounded-lg bg-card p-3.5">
                <div className="flex justify-between text-xs"><span className="text-muted">Price per share</span><span className="tabular-nums">{fmt.format(effectivePrice)} ALGO</span></div>
                <div className="flex justify-between text-xs"><span className="text-muted">Shares</span><span className="tabular-nums">{units}</span></div>
                {orderType === "limit" && <div className="flex justify-between text-xs"><span className="text-muted">Order type</span><span className="text-accent">Limit Order</span></div>}
                <div className="flex justify-between border-t border-card-border pt-2 text-sm"><span className="text-muted">Total</span><span className="font-bold tabular-nums">{amount ? `${fmt.format(parseFloat(amount))} ALGO` : "0.00 ALGO"}</span></div>
              </div>

              <motion.button whileTap={{ scale: 0.97 }} whileHover={{ scale: 1.01 }} onClick={handleOrder} disabled={!amount || parseFloat(amount) <= 0} className={`w-full rounded-lg py-3.5 text-sm font-bold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed ${tab === "buy" ? "bg-gain shadow-lg shadow-gain/20 hover:shadow-gain/30" : "bg-loss shadow-lg shadow-loss/20 hover:shadow-loss/30"}`}>
                {tab === "buy" ? "Buy" : "Sell"} {project.title}
              </motion.button>

              <AnimatePresence>
                {showSuccess && (
                  <motion.div initial={{ opacity: 0, y: 8, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.95 }} className={`flex items-center justify-center gap-2 rounded-lg p-3 text-sm font-medium ${tab === "buy" ? "bg-gain/10 text-gain ring-1 ring-gain/20" : "bg-loss/10 text-loss ring-1 ring-loss/20"}`}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>
                    {tab === "buy" ? "Buy order placed!" : "Sell order placed!"}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* DISPUTE BANNER (if disputed) */}
          {project.dispute && (
            <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.18 }}>
              <DisputeBanner dispute={project.dispute} onViewDetails={() => setShowDisputeModal(true)} />
            </motion.div>
          )}

          {/* BATCH TIMELINE */}
          {project.batches.length > 0 && (
            <motion.div className="glass-card p-5" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
              <BatchTimelineFull batches={project.batches} timelineLocked={project.timelineLocked} />
            </motion.div>
          )}

          {/* PROJECT INFO + CREATOR METRICS */}
          <motion.div className="glass-card p-5 space-y-5" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.25 }}>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted">Project Details</h3>
            <p className="text-sm leading-relaxed text-foreground/80">{project.tagline}</p>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs"><span className="text-muted">Funding Progress</span><span className={`font-bold ${fundedPct >= 80 ? "text-gain" : "text-accent-light"}`}>{fundedPct}%</span></div>
              <div className="h-1.5 overflow-hidden rounded-full bg-card-border">
                <motion.div className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" initial={{ width: 0 }} animate={{ width: `${fundedPct}%` }} transition={{ duration: 1, delay: 0.3, ease: "easeOut" as const }} />
              </div>
              <div className="flex items-center justify-between text-[10px] text-muted">
                <span>{fmtCompact.format(project.fundingRaised)} raised</span>
                <span>Goal: {fmtCompact.format(project.fundingGoal)}</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {project.tags.map((tag) => (
                <span key={tag} className="rounded-full bg-card border border-card-border px-2.5 py-0.5 text-[10px] font-medium text-muted">{tag}</span>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <svg className="h-3 w-3 text-gain" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75" /></svg>
              <span className="text-xs text-foreground/70">{project.milestone}</span>
            </div>

            <div className="border-t border-card-border" />

            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted">Creator</h3>
            <div className="flex items-center gap-3">
              <Link href={`/profile/${project.creator.id}`}><Avatar initials={project.creator.avatar} size="md" /></Link>
              <div>
                <Link href={`/profile/${project.creator.id}`} className="font-semibold text-sm hover:underline">{project.creator.name}</Link>
                <p className="text-xs text-muted">{project.creator.username}</p>
              </div>
            </div>

            <div className="flex items-center gap-5">
              <div className="relative flex h-20 w-20 shrink-0 items-center justify-center">
                <svg viewBox="0 0 80 80" className="h-full w-full -rotate-90">
                  <circle cx="40" cy="40" r="34" fill="none" stroke="#1e1e2e" strokeWidth="6" />
                  <motion.circle cx="40" cy="40" r="34" fill="none" stroke="url(#scoreGrad)" strokeWidth="6" strokeLinecap="round" strokeDasharray={`${2 * Math.PI * 34}`} initial={{ strokeDashoffset: 2 * Math.PI * 34 }} animate={{ strokeDashoffset: 2 * Math.PI * 34 * (1 - project.creator.score / 100) }} transition={{ duration: 1.2, delay: 0.3, ease: "easeOut" }} />
                  <defs><linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="#6366f1" /><stop offset="100%" stopColor="#a855f7" /></linearGradient></defs>
                </svg>
                <span className="absolute text-lg font-bold">{project.creator.score}</span>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold">Credibility Score</p>
                <p className="text-xs text-muted">{project.creator.score >= 90 ? "Exceptional — Top tier" : project.creator.score >= 75 ? "Strong — Above average" : project.creator.score >= 60 ? "Good — Solid performance" : "Developing — Growing potential"}</p>
              </div>
            </div>

            <div>
              <div className="mb-2 flex justify-between text-xs"><span className="text-muted">Consistency</span><span className="font-semibold">{project.creator.consistency}%</span></div>
              <div className="h-1.5 overflow-hidden rounded-full bg-card">
                <motion.div className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500" initial={{ width: 0 }} animate={{ width: `${project.creator.consistency}%` }} transition={{ duration: 1, delay: 0.4, ease: "easeOut" as const }} />
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs text-muted">Staking Level</p>
              <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium shadow-lg ${staking.bg} ${staking.text} border ${staking.border} ${staking.glow}`}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" /></svg>
                {project.creator.stakingLevel}
              </div>
            </div>

            <div className="border-t border-card-border" />

            {!project.dispute && (
              <button
                onClick={() => setShowDisputeModal(true)}
                className="flex items-center gap-2 text-xs text-muted hover:text-amber-400 transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v1.5M3 21v-6m0 0l2.77-.693a9 9 0 016.208.682l.108.054a9 9 0 006.086.71l3.114-.732a48.524 48.524 0 01-.005-10.499l-3.11.732a9 9 0 01-6.085-.711l-.108-.054a9 9 0 00-6.208-.682L3 4.5M3 15V4.5" />
                </svg>
                Flag this project
              </button>
            )}
          </motion.div>
        </div>
      </div>

      {/* ═══════════ RELATED PROJECTS ═══════════ */}
      <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold">More Projects</h2>
          <Link href="/market" className="text-xs font-medium text-accent-light transition hover:text-accent">View All →</Link>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {relatedProjects.map((p, i) => (
            <motion.div key={p.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 + i * 0.05 }}>
              <Link href={`/trade/${p.id}`}>
                <div className="glass-card p-4 transition-transform duration-200 hover:scale-[1.02]">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${p.coverGradient}`}>
                      <svg className="h-4 w-4 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d={p.coverIcon} /></svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{p.title}</p>
                      <p className="text-xs text-muted">{p.creator.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold tabular-nums">{fmt.format(p.price)}</p>
                      <PriceChange value={p.change} percent={p.changePercent} />
                    </div>
                  </div>
                  <div className="mt-2">
                    <SparklineChart data={p.sparkline} positive={p.change >= 0} />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </motion.section>

      <DisputeModal
        isOpen={showDisputeModal}
        onClose={() => setShowDisputeModal(false)}
        projectTitle={project.title}
        existingDispute={project.dispute}
      />
    </motion.div>
  );
}
