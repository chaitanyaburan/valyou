"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { holdings, wallet, projects, computeProjectHealth, getDisputeStatus } from "@/lib/data";
import Avatar from "@/components/Avatar";
import { BatchTimelineCompact } from "@/components/BatchTimeline";

const fmt = new Intl.NumberFormat("en-IN", {
  maximumFractionDigits: 2,
});

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
};

const summaryCards = [
  { label: "Total Invested", value: wallet.invested, color: "text-foreground", pnl: false },
  { label: "Current Value", value: wallet.currentValue, color: "text-foreground", pnl: false },
  { label: "Total P&L", value: wallet.pnl, color: "text-gain", pnl: true },
];

export default function PortfolioPage() {
  return (
    <section className="py-8">
      <motion.h1
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-3xl font-bold tracking-tight"
      >
        Portfolio
      </motion.h1>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3"
      >
        {summaryCards.map((card) => (
          <motion.div
            key={card.label}
            variants={item}
            className="glass-card flex flex-col gap-1 p-5"
          >
            <span className="text-sm text-muted">{card.label}</span>
            <span className={`text-2xl font-bold tabular-nums ${card.color}`}>
              {card.pnl && (
                <span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-gain live-dot-green" />
              )}
              {fmt.format(card.value)} <span className="text-sm text-muted">VALU</span>
              {card.pnl && (
                <span className="ml-2 text-base font-semibold">
                  (+{wallet.pnlPercent.toFixed(2)}%)
                </span>
              )}
            </span>
          </motion.div>
        ))}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.25 }}
        className="glass-card mt-8 overflow-x-auto"
      >
        <table className="w-full min-w-[900px] text-sm">
          <thead>
            <tr className="border-b border-card-border text-left text-xs text-muted">
              <th className="px-5 py-3 font-medium">Project</th>
              <th className="px-4 py-3 font-medium">Timeline</th>
              <th className="px-4 py-3 font-medium text-center">Status</th>
              <th className="px-4 py-3 font-medium text-right">Shares</th>
              <th className="px-4 py-3 font-medium text-right">Current Price</th>
              <th className="px-4 py-3 font-medium text-right">Invested</th>
              <th className="px-4 py-3 font-medium text-right">Current Value</th>
              <th className="px-4 py-3 font-medium text-right">Gain/Loss</th>
            </tr>
          </thead>
          <motion.tbody variants={container} initial="hidden" animate="show">
            {holdings.map((h) => {
              const gl = h.currentValue - h.invested;
              const glPct = h.invested === 0 ? 0 : (gl / h.invested) * 100;
              const positive = gl >= 0;
              const proj = projects.find((p) => p.id === h.projectId);
              const health = proj ? computeProjectHealth(proj) : null;
              const dStatus = proj ? getDisputeStatus(proj) : "none";

              return (
                <motion.tr
                  key={h.projectId}
                  variants={item}
                  className={`border-b border-card-border/50 transition-colors hover:bg-white/[0.03] ${
                    dStatus === "open" ? "bg-amber-500/[0.02]" : dStatus === "confirmed" ? "bg-red/[0.02]" : ""
                  } ${health?.batchStatus === "overdue" ? "bg-red/[0.02]" : ""}`}
                >
                  <td className="px-5 py-4">
                    <Link href={`/trade/${h.projectId}`} className="flex items-center gap-3 hover:underline">
                      <Avatar initials={h.avatar} size="sm" />
                      <div>
                        <p className="font-medium leading-tight">{h.title}</p>
                        <p className="text-xs text-muted">by {h.creatorName}</p>
                      </div>
                    </Link>
                  </td>
                  <td className="px-4 py-4">
                    {proj && health && (
                      <BatchTimelineCompact
                        batches={proj.batches}
                        currentBatchTitle={health.currentBatch?.title ?? null}
                        batchProgress={`${health.completedCount}/${health.totalBatches}`}
                        batchStatus={health.batchStatus}
                      />
                    )}
                  </td>
                  <td className="px-4 py-4 text-center">
                    <div className="flex items-center justify-center gap-1.5 flex-wrap">
                      {health?.batchStatus === "overdue" && (
                        <span className="inline-flex items-center gap-0.5 rounded-full bg-red/10 border border-red/20 px-1.5 py-0.5 text-[9px] font-semibold text-red">
                          {health.overdueDays}d late
                        </span>
                      )}
                      {health?.batchStatus === "on_track" && (
                        <span className="inline-flex items-center gap-0.5 rounded-full bg-gain/10 border border-gain/20 px-1.5 py-0.5 text-[9px] font-semibold text-gain">
                          On track
                        </span>
                      )}
                      {health?.batchStatus === "all_done" && (
                        <span className="inline-flex items-center gap-0.5 rounded-full bg-gain/10 border border-gain/20 px-1.5 py-0.5 text-[9px] font-semibold text-gain">
                          Complete
                        </span>
                      )}
                      {(dStatus === "open" || dStatus === "confirmed") && (
                        <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 text-[9px] font-semibold text-amber-400">
                          Disputed
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-right tabular-nums">{h.quantity}</td>
                  <td className="px-4 py-4 text-right tabular-nums">{fmt.format(h.currentPrice)}</td>
                  <td className="px-4 py-4 text-right tabular-nums">{fmt.format(h.invested)}</td>
                  <td className="px-4 py-4 text-right tabular-nums">{fmt.format(h.currentValue)}</td>
                  <td className={`px-4 py-4 text-right font-medium tabular-nums ${positive ? "text-gain" : "text-loss"}`}>
                    {positive ? "+" : ""}{fmt.format(gl)}{" "}
                    <span className="text-xs">({positive ? "+" : ""}{glPct.toFixed(2)}%)</span>
                  </td>
                </motion.tr>
              );
            })}
          </motion.tbody>
        </table>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.4 }}
        className="mt-8 text-center"
      >
        <Link
          href="/market"
          className="inline-block rounded-full bg-accent px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-light"
        >
          Explore Projects &rarr;
        </Link>
      </motion.div>
    </section>
  );
}
