"use client";

import { useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import Avatar from "@/components/Avatar";
import { projectFeed, stories, type ProjectPost, type TradeRecord, type Story } from "@/lib/social";
import { projects, wallet } from "@/lib/data";
import { formatAlgo } from "@/lib/algo";

const fmtShort = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 });

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};
const item = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
};

const topProjects = [...projects].sort((a, b) => b.creator.score - a.creator.score).slice(0, 5);
const trendingProjects = [...projects].sort((a, b) => b.changePercent - a.changePercent).slice(0, 6);

function TierBadge({ tier }: { tier: string }) {
  const colors: Record<string, string> = {
    Diamond: "from-cyan-400 to-blue-500 text-white",
    Platinum: "from-indigo-400 to-purple-500 text-white",
    Gold: "from-amber-400 to-orange-500 text-white",
    Silver: "from-gray-300 to-gray-400 text-gray-800",
    Bronze: "from-orange-300 to-amber-400 text-amber-900",
  };
  return (
    <span className={`inline-flex items-center rounded-full bg-gradient-to-r ${colors[tier] || colors.Silver} px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider`}>
      {tier}
    </span>
  );
}

function priceLine(amount: number): string {
  return formatAlgo(amount);
}

function StoryViewer({ story, onClose }: { story: Story; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" as const }}
        className={`relative mx-3 flex h-[80vh] sm:h-[85vh] w-full max-w-[420px] flex-col rounded-2xl sm:rounded-3xl bg-gradient-to-br ${story.gradient} p-5 sm:p-6 shadow-2xl`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 h-1 w-full overflow-hidden rounded-full bg-white/20">
          <motion.div className="h-full rounded-full bg-white/90" initial={{ width: "0%" }} animate={{ width: "100%" }} transition={{ duration: 8, ease: "linear" }} />
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar initials={story.userAvatar} size="sm" />
            <div>
              <p className="text-sm font-semibold text-white">{story.userName}</p>
              <p className="text-[10px] text-white/60">Just now</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-full p-2 text-white/70 transition hover:bg-white/10 hover:text-white">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="flex flex-1 items-center justify-center px-2 sm:px-4">
          <p className="text-center text-xl sm:text-2xl font-bold leading-relaxed text-white drop-shadow-lg">{story.content}</p>
        </div>
        <div className="flex items-center justify-center gap-4 pt-4">
          <Link href={story.projectId ? `/trade/${story.projectId}` : `/profile/${story.userId}`} className="rounded-full bg-white/20 px-6 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/30" onClick={onClose}>
            {story.projectId ? "View Project" : `View Profile`}
          </Link>
        </div>
      </motion.div>
    </motion.div>
  );
}

function ProjectCard({
  project,
  onInvestClick,
}: {
  project: ProjectPost;
  onInvestClick: (project: ProjectPost) => void;
}) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(project.likes);
  const fundedPct = Math.round((project.fundingRaised / project.fundingGoal) * 100);

  const toggleLike = () => { setLiked((prev) => !prev); setLikeCount((prev) => (liked ? prev - 1 : prev + 1)); };

  return (
    <motion.div variants={item} className="glass-card overflow-hidden group">
      {/* Cover — shorter on mobile */}
      <div className={`relative flex h-32 sm:h-40 items-center justify-center bg-gradient-to-br ${project.coverGradient} border-b border-card-border`}>
        <svg className="h-12 w-12 sm:h-16 sm:w-16 text-white/10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
          <path strokeLinecap="round" strokeLinejoin="round" d={project.coverIcon} />
        </svg>
        <div className="absolute top-2.5 left-2.5 sm:top-3 sm:left-3 flex items-center gap-1.5 sm:gap-2">
          <span className="rounded-full bg-black/40 px-2 sm:px-2.5 py-0.5 sm:py-1 text-[9px] sm:text-[10px] font-semibold text-white backdrop-blur-sm">{project.category}</span>
          <span className={`rounded-full px-1.5 sm:px-2 py-0.5 sm:py-1 text-[9px] sm:text-[10px] font-bold backdrop-blur-sm ${project.priceChange24h > 0 ? "bg-gain/20 text-gain" : "bg-loss/20 text-loss"}`}>
            {project.priceChange24h > 0 ? "+" : ""}{project.priceChange24h}%
          </span>
        </div>
        <div className="absolute top-2.5 right-2.5 sm:top-3 sm:right-3 flex items-center gap-1.5 rounded-full bg-black/40 px-2 py-0.5 sm:px-2.5 sm:py-1 backdrop-blur-sm">
          <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-gain" />
          <span className="text-[9px] sm:text-[10px] font-semibold text-white">{project.daysLeft}d left</span>
        </div>
        <div className="absolute bottom-2.5 right-2.5 sm:bottom-3 sm:right-3">
          <div className="rounded-lg bg-black/50 px-2.5 py-1 sm:px-3 sm:py-1.5 backdrop-blur-sm text-right">
            <p className="text-[8px] sm:text-[9px] text-white/50 uppercase tracking-wider">Share Price</p>
            <p className="text-base sm:text-lg font-bold text-white">{priceLine(project.pricePerShare)}</p>
          </div>
        </div>
      </div>

      {/* Creator + project info */}
      <div className="px-4 sm:px-5 pt-3 sm:pt-4 pb-0">
        <div className="flex items-start gap-2.5 sm:gap-3">
          <Link href={`/profile/${project.creatorId}`} className="shrink-0">
            <Avatar initials={project.creatorAvatar} size="sm" />
          </Link>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-1.5 sm:gap-x-2 gap-y-0.5">
              <Link href={`/profile/${project.creatorId}`} className="text-sm font-semibold text-foreground hover:underline">{project.creatorName}</Link>
              <TierBadge tier={project.creatorTier} />
              <span className="hidden sm:inline text-xs text-muted">{project.creatorUsername}</span>
              <span className="text-xs text-muted">· {project.timeAgo}</span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-muted">Score: {project.creatorScore}/100</p>
          </div>
          <button className="shrink-0 rounded-lg p-1 sm:p-1.5 text-muted transition hover:bg-card hover:text-foreground">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM12.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM18.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" /></svg>
          </button>
        </div>

        <div className="mt-2.5 sm:mt-3">
          <Link href={`/trade/${project.id}`} className="hover:underline">
            <h3 className="text-base sm:text-lg font-bold text-foreground leading-tight">{project.title}</h3>
          </Link>
          <p className="mt-0.5 text-xs text-accent-light font-medium">{project.tagline}</p>
        </div>

        <p className="mt-2 text-sm leading-relaxed text-foreground/80 line-clamp-3 sm:line-clamp-none">{project.description}</p>

        <div className="mt-2.5 sm:mt-3 flex flex-wrap gap-1.5">
          {project.tags.map((tag) => (
            <span key={tag} className="rounded-full bg-card border border-card-border px-2 sm:px-2.5 py-0.5 text-[10px] font-medium text-muted">{tag}</span>
          ))}
        </div>
      </div>

      {/* Funding progress */}
      <div className="mx-4 sm:mx-5 mt-3 sm:mt-4 rounded-xl bg-card border border-card-border p-2.5 sm:p-3">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted">Funding Progress</span>
          <span className={`font-bold ${fundedPct >= 80 ? "text-gain" : "text-accent-light"}`}>{fundedPct}%</span>
        </div>
        <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-card-border">
          <motion.div className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" initial={{ width: 0 }} animate={{ width: `${fundedPct}%` }} transition={{ duration: 1, ease: "easeOut" as const, delay: 0.3 }} />
        </div>
        <div className="mt-1.5 sm:mt-2 flex items-center justify-between text-[10px] sm:text-[11px]">
          <span className="text-foreground/70">{formatAlgo(project.fundingRaised)} <span className="text-muted">raised</span></span>
          <span className="text-muted">Goal: {formatAlgo(project.fundingGoal)}</span>
        </div>
        <div className="mt-1 sm:mt-1.5 flex items-center gap-3 sm:gap-4 text-[10px] text-muted">
          <span>{project.backers.toLocaleString()} backers</span>
          <span>{project.daysLeft} days left</span>
        </div>
        <div className="mt-1.5 sm:mt-2 flex items-center gap-2">
          <svg className="h-3 w-3 text-gain" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75" /></svg>
          <span className="text-[10px] text-foreground/70">{project.milestone}</span>
        </div>
      </div>

      {/* Engagement */}
      <div className="mx-4 sm:mx-5 mt-2.5 sm:mt-3 flex items-center gap-4 text-[11px] text-muted">
        <span>{likeCount.toLocaleString()} likes</span>
        <span>{project.comments} comments</span>
      </div>

      {/* Action bar — icons only on mobile, icon+text on desktop */}
      <div className="mx-4 sm:mx-5 mt-2 flex items-center border-t border-card-border">
        <motion.button whileTap={{ scale: 0.9 }} onClick={toggleLike} className={`flex flex-1 items-center justify-center gap-1.5 py-2.5 sm:py-3 text-xs font-medium transition ${liked ? "text-loss" : "text-muted hover:text-loss"}`}>
          <svg className={`h-[18px] w-[18px] transition ${liked ? "fill-loss" : "fill-none"}`} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" /></svg>
          <span className="hidden sm:inline">Like</span>
        </motion.button>
        <button className="flex flex-1 items-center justify-center gap-1.5 py-2.5 sm:py-3 text-xs font-medium text-muted transition hover:text-accent-light">
          <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 01-.923 1.785A5.969 5.969 0 006 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337z" /></svg>
          <span className="hidden sm:inline">Comment</span>
        </button>
        <button className="flex flex-1 items-center justify-center gap-1.5 py-2.5 sm:py-3 text-xs font-medium text-muted transition hover:text-foreground">
          <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" /></svg>
          <span className="hidden sm:inline">Share</span>
        </button>
        <motion.button whileTap={{ scale: 0.95 }} onClick={() => onInvestClick(project)} className="flex flex-1 items-center justify-center gap-1.5 py-2.5 sm:py-3 text-xs font-bold text-gain/70 transition hover:text-gain">
          <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" /></svg>
          <span className="hidden xs:inline">Invest</span>
        </motion.button>
      </div>
    </motion.div>
  );
}

function TradeHistorySidebar({ trades, onConfirm, onCancel }: { trades: TradeRecord[]; onConfirm: (id: string) => void; onCancel: (id: string) => void }) {
  const pending = trades.filter((t) => t.status === "pending");
  const confirmed = trades.filter((t) => t.status === "confirmed");
  const cancelled = trades.filter((t) => t.status === "cancelled");
  const totalPending = pending.reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="flex flex-col gap-4">
      <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4, delay: 0.1 }} className="glass-card p-4">
        <div className="flex items-center gap-3">
          <Avatar initials="AK" size="md" />
          <div>
            <p className="font-semibold text-sm">Arjun Kapoor</p>
            <p className="text-[10px] text-muted">@arjunkapoor</p>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="rounded-lg bg-card px-3 py-2">
            <p className="text-[10px] text-muted">Balance</p>
            <p className="text-sm font-bold text-foreground">{priceLine(wallet.balance)}</p>
          </div>
          <div className="rounded-lg bg-card px-3 py-2">
            <p className="text-[10px] text-muted">Invested</p>
            <p className="text-sm font-bold text-foreground">{priceLine(wallet.invested)}</p>
          </div>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4, delay: 0.2 }} className="glass-card p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold flex items-center gap-2">
            <svg className="h-4 w-4 text-accent-light" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            Trade History
          </h3>
          {trades.length > 0 && <span className="text-[10px] text-muted">{trades.length} trades</span>}
        </div>

        {trades.length === 0 ? (
          <div className="flex flex-col items-center py-8 text-center">
            <svg className="h-10 w-10 text-muted/30 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" /></svg>
            <p className="text-xs text-muted">No trades yet</p>
            <p className="text-[10px] text-muted/60 mt-0.5">Invest in projects from the feed</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2 max-h-[calc(100vh-400px)] overflow-y-auto scrollbar-none">
            {pending.length > 0 && (
              <>
                <div className="flex items-center justify-between py-1"><span className="text-[10px] font-semibold text-amber-400 uppercase tracking-wider">Pending</span><span className="text-[10px] text-amber-400 font-bold">{priceLine(totalPending)}</span></div>
                {pending.map((trade) => (
                  <motion.div key={trade.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3">
                    <div className="flex items-center gap-2">
                      <Avatar initials={trade.creatorAvatar} size="sm" />
                      <div className="min-w-0 flex-1"><p className="text-xs font-semibold truncate">{trade.projectTitle}</p><p className="text-[10px] text-muted">{trade.creatorName} · {trade.timestamp}</p></div>
                      <div className="text-right shrink-0"><p className="text-xs font-bold text-foreground">{trade.shares} shares</p><p className="text-[10px] text-muted">{priceLine(trade.amount)}</p></div>
                    </div>
                    <div className="mt-2 flex gap-2">
                      <motion.button whileTap={{ scale: 0.95 }} onClick={() => onConfirm(trade.id)} className="flex-1 rounded-lg bg-gain/20 py-1.5 text-[10px] font-bold text-gain transition hover:bg-gain/30">Confirm</motion.button>
                      <motion.button whileTap={{ scale: 0.95 }} onClick={() => onCancel(trade.id)} className="flex-1 rounded-lg bg-loss/20 py-1.5 text-[10px] font-bold text-loss transition hover:bg-loss/30">Cancel</motion.button>
                    </div>
                  </motion.div>
                ))}
              </>
            )}
            {confirmed.length > 0 && (
              <>
                <div className="flex items-center gap-1.5 py-1 mt-1"><svg className="h-3 w-3 text-gain" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75" /></svg><span className="text-[10px] font-semibold text-gain uppercase tracking-wider">Confirmed</span></div>
                {confirmed.map((trade) => (
                  <motion.div key={trade.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-xl border border-gain/10 bg-gain/5 p-3">
                    <div className="flex items-center gap-2"><Avatar initials={trade.creatorAvatar} size="sm" /><div className="min-w-0 flex-1"><p className="text-xs font-semibold truncate">{trade.projectTitle}</p><p className="text-[10px] text-muted">{trade.creatorName}</p></div><div className="text-right shrink-0"><p className="text-xs font-bold text-gain">{trade.shares} shares</p></div></div>
                    <div className="mt-1.5 flex items-center gap-1"><svg className="h-2.5 w-2.5 text-gain" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75" /></svg><span className="text-[9px] text-gain">Saved on-chain</span></div>
                  </motion.div>
                ))}
              </>
            )}
            {cancelled.length > 0 && (
              <>
                <div className="flex items-center gap-1.5 py-1 mt-1"><svg className="h-3 w-3 text-loss" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg><span className="text-[10px] font-semibold text-loss/60 uppercase tracking-wider">Cancelled</span></div>
                {cancelled.map((trade) => (<div key={trade.id} className="rounded-xl border border-card-border bg-card/50 p-3 opacity-50"><div className="flex items-center gap-2"><Avatar initials={trade.creatorAvatar} size="sm" /><div className="min-w-0 flex-1"><p className="text-xs font-semibold truncate line-through">{trade.projectTitle}</p></div><p className="text-xs text-muted">{trade.shares} shares</p></div></div>))}
              </>
            )}
          </div>
        )}
      </motion.div>

      <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4, delay: 0.3 }} className="glass-card p-4">
        <div className="mb-3 flex items-center justify-between"><h3 className="text-sm font-semibold">Top Projects</h3><Link href="/market" className="text-[10px] font-medium text-accent-light hover:text-accent transition">View All</Link></div>
        <div className="flex flex-col gap-2.5">
          {topProjects.map((project) => (
            <div key={project.id} className="flex items-center gap-2.5">
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${project.coverGradient} text-[10px] font-bold text-white/80`}>{project.title.split(" ").map(w => w[0]).join("").slice(0, 2)}</div>
              <div className="min-w-0 flex-1"><Link href={`/trade/${project.id}`} className="block truncate text-xs font-medium hover:underline">{project.title}</Link><p className="text-[10px] text-muted">{project.creator.name}</p></div>
              <Link href={`/trade/${project.id}`} className="shrink-0 rounded-full border border-accent/30 px-2.5 py-0.5 text-[10px] font-semibold text-accent-light transition hover:bg-accent/10">Trade</Link>
            </div>
          ))}
        </div>
      </motion.div>

      <div className="px-2 text-[10px] text-muted/50"><p>About · Terms · Privacy · Careers</p><p className="mt-1">Valyou &copy; 2026 · Invest in Ideas</p></div>
    </div>
  );
}

// ═══════════════════════════════════════════════
// MAIN HOMEPAGE
// ═══════════════════════════════════════════════

export default function HomePage() {
  const [activeStory, setActiveStory] = useState<Story | null>(null);
  const [trades, setTrades] = useState<TradeRecord[]>([]);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [activeInvestProject, setActiveInvestProject] = useState<ProjectPost | null>(null);
  const [investShares, setInvestShares] = useState(1);
  const [confirmBuy, setConfirmBuy] = useState(false);

  const showToast = useCallback((msg: string) => { setToastMsg(msg); setTimeout(() => setToastMsg(null), 3000); }, []);

  const handleInvest = useCallback((projectId: string, shares: number) => {
    const project = projectFeed.find((p) => p.id === projectId);
    if (!project) return;
    const newTrade: TradeRecord = {
      id: `tr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      projectId: project.id, projectTitle: project.title, creatorName: project.creatorName, creatorAvatar: project.creatorAvatar,
      type: "invest", amount: shares * project.pricePerShare, shares, pricePerShare: project.pricePerShare,
      timestamp: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }), status: "pending",
    };
    setTrades((prev) => [newTrade, ...prev]);
    showToast(`Invested ${shares} shares in ${project.title}`);
  }, [showToast]);

  const confirmTrade = useCallback((id: string) => {
    setTrades((prev) => prev.map((t) => (t.id === id ? { ...t, status: "confirmed" as const } : t)));
    const trade = trades.find((t) => t.id === id);
    if (trade) showToast(`Confirmed: ${trade.shares} shares of ${trade.projectTitle}`);
  }, [trades, showToast]);

  const cancelTrade = useCallback((id: string) => {
    setTrades((prev) => prev.map((t) => (t.id === id ? { ...t, status: "cancelled" as const } : t)));
    showToast("Trade cancelled");
  }, [showToast]);

  const pendingCount = useMemo(() => trades.filter((t) => t.status === "pending").length, [trades]);

  const totalRaised = projects.reduce((sum, p) => sum + p.fundingRaised, 0);
  const totalBackers = projects.reduce((sum, p) => sum + p.backers, 0);

  return (
    <section className="py-4 sm:py-6">
      {/* ═══ HERO BANNER ═══ */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-4 sm:mb-6 overflow-hidden rounded-2xl border border-card-border bg-gradient-to-br from-[#0f1240] via-[#0a0a1f] to-[#1a1030]"
      >
        <div className="px-5 py-6 sm:px-8 sm:py-8">
          <div className="mb-4 inline-flex items-center gap-2 text-xs text-gain">
            <span className="h-2 w-2 rounded-full bg-gain" />
            {projects.length} projects live now
          </div>

          <h1 className="max-w-3xl text-3xl font-bold leading-tight text-white sm:text-5xl">
            Invest in <span className="bg-gradient-to-r from-indigo-300 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent">Ideas That Ship</span>
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-foreground/70 sm:text-xl">
            Back real projects by real builders. Trade shares, track progress, and earn returns
            when ideas become products.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link
              href="/market"
              className="rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-light"
            >
              Explore Market
            </Link>
            <Link
              href="/discover"
              className="rounded-xl border border-card-border bg-card/40 px-5 py-2.5 text-sm font-semibold text-foreground transition hover:border-accent/60"
            >
              Discover
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 border-t border-card-border/70 px-5 py-4 sm:grid-cols-4 sm:px-8">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted">Total Raised</p>
            <p className="text-2xl font-bold text-gain">{formatAlgo(totalRaised)}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted">Active Backers</p>
            <p className="text-2xl font-bold text-foreground">{totalBackers.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted">Live Projects</p>
            <p className="text-2xl font-bold text-foreground">{projects.length}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted">Your Returns</p>
            <p className="text-2xl font-bold text-gain">+{wallet.pnlPercent}%</p>
          </div>
        </div>
      </motion.div>

      {/* ═══ TRENDING PROJECTS SCROLL ═══ */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05 }}
        className="mb-4 sm:mb-6"
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm sm:text-base font-semibold">Trending Now</h2>
          <Link href="/market" className="text-xs font-medium text-accent-light hover:text-accent transition">See all →</Link>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none -mx-3 px-3 sm:-mx-0 sm:px-0">
          {trendingProjects.map((p) => (
            <Link key={p.id} href={`/trade/${p.id}`} className="shrink-0">
              <motion.div whileHover={{ scale: 1.03 }} className={`w-40 sm:w-48 rounded-xl bg-gradient-to-br ${p.coverGradient} p-3 sm:p-4 border border-white/5 transition-shadow hover:shadow-lg hover:shadow-accent/5`}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 text-[9px] font-bold text-white">
                    {p.title.split(" ").map(w => w[0]).join("").slice(0, 2)}
                  </div>
                  <span className={`ml-auto rounded-full px-1.5 py-0.5 text-[9px] font-bold ${p.changePercent >= 0 ? "bg-gain/20 text-gain" : "bg-loss/20 text-loss"}`}>
                    {p.changePercent >= 0 ? "+" : ""}{p.changePercent.toFixed(1)}%
                  </span>
                </div>
                <p className="text-xs font-bold text-white truncate">{p.title}</p>
                <p className="text-[10px] text-white/60 truncate">{p.creator.name}</p>
                <p className="mt-2 text-sm font-bold text-white tabular-nums">{priceLine(p.price)}</p>
              </motion.div>
            </Link>
          ))}
        </div>
      </motion.div>

      <div className="flex gap-6">
        {/* ═══ MAIN FEED ═══ */}
        <div className="min-w-0 flex-1 max-w-2xl mx-auto lg:mx-0">
          {/* Stories Bar */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }} className="glass-card p-3 sm:p-4">
            <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-1 scrollbar-none">
              <button className="flex shrink-0 flex-col items-center gap-1">
                <div className="relative flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full border-2 border-dashed border-card-border transition hover:border-accent/50">
                  <svg className="h-5 w-5 sm:h-6 sm:w-6 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                </div>
                <span className="text-[9px] sm:text-[10px] text-muted">Add</span>
              </button>
              {stories.map((story) => (
                <motion.button key={story.id} whileTap={{ scale: 0.95 }} onClick={() => setActiveStory(story)} className={`flex shrink-0 flex-col items-center gap-1 transition ${story.viewed ? "opacity-50" : ""}`}>
                  <div className={`rounded-full bg-gradient-to-br ${story.gradient} p-[2px]`}>
                    <div className="rounded-full bg-background p-[1.5px] sm:p-[2px]">
                      <div className="flex h-[48px] w-[48px] sm:h-[52px] sm:w-[52px] items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-xs sm:text-sm font-semibold text-white">{story.userAvatar}</div>
                    </div>
                  </div>
                  <span className="max-w-[56px] sm:max-w-[64px] truncate text-[9px] sm:text-[10px] text-foreground/80">{story.userName.split(" ")[0]}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Composer — simplified on mobile */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.15 }} className="glass-card mt-3 sm:mt-4 p-3 sm:p-4">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <Avatar initials="AK" size="sm" />
              <input type="text" placeholder="Upload a project..." className="flex-1 rounded-xl bg-card border border-card-border px-3 sm:px-4 py-2 sm:py-2.5 text-sm text-foreground placeholder:text-muted/60 outline-none focus:border-accent/50 transition-colors" readOnly />
              <button className="shrink-0 rounded-lg bg-accent px-3 sm:px-5 py-2 sm:py-1.5 text-xs font-semibold text-white transition hover:bg-accent-light">Publish</button>
            </div>
            <div className="hidden sm:flex mt-3 items-center border-t border-card-border pt-3 gap-1">
              {[
                { label: "Project", color: "text-purple-400", icon: "M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58" },
                { label: "Milestone", color: "text-amber-400", icon: "M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2z" },
                { label: "Demo", color: "text-gain", icon: "M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" },
              ].map((a) => (
                <button key={a.label} className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium ${a.color} transition hover:bg-card`}>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d={a.icon} /></svg>
                  {a.label}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Pending trades banner */}
          <AnimatePresence>
            {pendingCount > 0 && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mt-3 sm:mt-4 overflow-hidden">
                <div className="flex items-center gap-2.5 sm:gap-3 rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 sm:px-4 py-2.5 sm:py-3">
                  <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-amber-500/20 shrink-0">
                    <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-amber-400">{pendingCount} pending trade{pendingCount > 1 ? "s" : ""}</p>
                    <p className="text-[10px] text-muted hidden sm:block">Check the trade history panel to confirm or cancel</p>
                  </div>
                  <div className="h-2 w-2 animate-pulse rounded-full bg-amber-400 shrink-0" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Project Feed */}
          <motion.div className="mt-3 sm:mt-4 flex flex-col gap-4 sm:gap-5" variants={container} initial="hidden" animate="show">
            {projectFeed.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onInvestClick={(selectedProject) => {
                  setActiveInvestProject(selectedProject);
                  setInvestShares(1);
                  setConfirmBuy(false);
                }}
              />
            ))}
            <div className="flex items-center justify-center py-6 sm:py-8">
              <div className="flex items-center gap-2 text-sm text-muted">
                <div className="h-1 w-1 animate-pulse rounded-full bg-accent" />
                <div className="h-1 w-1 animate-pulse rounded-full bg-accent" style={{ animationDelay: "0.2s" }} />
                <div className="h-1 w-1 animate-pulse rounded-full bg-accent" style={{ animationDelay: "0.4s" }} />
                <span className="ml-2">Loading more projects...</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* ═══ RIGHT SIDEBAR ═══ */}
        <div className="hidden lg:block w-80 shrink-0">
          <div className="sticky top-20">
            <TradeHistorySidebar trades={trades} onConfirm={confirmTrade} onCancel={cancelTrade} />
          </div>
        </div>
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div initial={{ opacity: 0, y: 40, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 40, scale: 0.95 }} transition={{ duration: 0.3 }} className="fixed bottom-20 lg:bottom-6 left-1/2 z-[90] -translate-x-1/2 w-[calc(100%-2rem)] sm:w-auto max-w-sm">
            <div className="flex items-center gap-2 rounded-xl border border-gain/20 bg-background/95 px-4 sm:px-5 py-2.5 sm:py-3 shadow-2xl backdrop-blur-xl">
              <svg className="h-4 w-4 text-gain shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <p className="text-xs sm:text-sm font-medium text-foreground truncate">{toastMsg}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Story Viewer */}
      <AnimatePresence>
        {activeStory && <StoryViewer story={activeStory} onClose={() => setActiveStory(null)} />}
      </AnimatePresence>

      <AnimatePresence>
        {activeInvestProject && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[95] flex items-center justify-center bg-black/70 p-4"
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="w-full max-w-lg rounded-2xl border border-card-border bg-background p-5"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Invest in {activeInvestProject.title}</h3>
                  <p className="mt-1 text-xs text-muted">{activeInvestProject.tagline}</p>
                </div>
                <button
                  onClick={() => {
                    setActiveInvestProject(null);
                    setConfirmBuy(false);
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
                    <p className="font-semibold">{priceLine(activeInvestProject.pricePerShare)}</p>
                  </div>
                  <div className="rounded-lg border border-card-border p-3">
                    <p className="text-muted">Account Balance</p>
                    <p className="font-semibold">{formatAlgo(wallet.balance)}</p>
                  </div>
                </div>

                <div>
                  <p className="mb-1 text-xs text-muted">Number of shares</p>
                  <input
                    type="number"
                    min={1}
                    value={investShares}
                    onChange={(event) => setInvestShares(Math.max(1, Number(event.target.value) || 1))}
                    className="w-32 rounded-lg border border-card-border bg-card px-3 py-2 text-sm outline-none focus:border-accent/60"
                  />
                </div>

                <div className="rounded-lg border border-card-border p-3 text-sm">
                  <p className="text-muted">Total price</p>
                  <p className="font-semibold">
                    {priceLine(investShares * activeInvestProject.pricePerShare)}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => showToast("Use dashboard to add ALGO balance.")}
                    className="rounded-lg border border-gain/60 px-3 py-2 text-xs font-semibold text-gain transition hover:bg-gain/10"
                  >
                    Add Balance
                  </button>
                  {!confirmBuy ? (
                    <button
                      onClick={() => setConfirmBuy(true)}
                      className="ml-auto rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-white transition hover:bg-accent-light"
                    >
                      Buy Shares
                    </button>
                  ) : (
                    <div className="ml-auto flex items-center gap-2">
                      <span className="text-xs text-muted">Do you agree to buy?</span>
                      <button
                        onClick={() => setConfirmBuy(false)}
                        className="rounded-lg border border-card-border px-3 py-2 text-xs font-semibold"
                      >
                        No
                      </button>
                      <button
                        onClick={() => {
                          handleInvest(activeInvestProject.id, investShares);
                          setActiveInvestProject(null);
                          setConfirmBuy(false);
                        }}
                        className="rounded-lg bg-gain px-3 py-2 text-xs font-semibold text-white"
                      >
                        Yes
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
