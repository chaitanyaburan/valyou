"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import Avatar from "@/components/Avatar";
import { projectFeed, stories, type ProjectPost, type TradeRecord, type Story } from "@/lib/social";
import { projects, wallet } from "@/lib/data";

const fmt = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
const fmtCompact = new Intl.NumberFormat("en-IN", { notation: "compact", maximumFractionDigits: 1 });
const fmtShort = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 });

const container = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };
const item = { hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" as const } } };

const topProjects = [...projects].sort((a, b) => b.creator.score - a.creator.score).slice(0, 5);
const trendingProjects = [...projects].sort((a, b) => b.changePercent - a.changePercent).slice(0, 8);

function AnimatedNumber({ value, prefix = "", suffix = "" }: { value: number; prefix?: string; suffix?: string }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let start = 0;
    const end = value;
    const duration = 1200;
    const startTime = performance.now();
    function tick(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      start = Math.round(eased * end);
      setDisplay(start);
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }, [value]);
  return <>{prefix}{display.toLocaleString("en-IN")}{suffix}</>;
}

function TierBadge({ tier }: { tier: string }) {
  const colors: Record<string, string> = {
    Diamond: "from-cyan-400 to-blue-500 text-white",
    Platinum: "from-indigo-400 to-purple-500 text-white",
    Gold: "from-amber-400 to-orange-500 text-white",
    Silver: "from-gray-300 to-gray-400 text-gray-800",
    Bronze: "from-orange-300 to-amber-400 text-amber-900",
  };
  return (
    <span className={`inline-flex items-center rounded-full bg-gradient-to-r ${colors[tier] || colors.Silver} px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider shadow-sm`}>
      {tier}
    </span>
  );
}

function StoryViewer({ story, onClose }: { story: Story; onClose: () => void }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md" onClick={onClose}>
      <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.85, opacity: 0 }} transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
        className={`relative mx-3 flex h-[80vh] sm:h-[85vh] w-full max-w-[420px] flex-col rounded-2xl sm:rounded-3xl bg-gradient-to-br ${story.gradient} p-5 sm:p-6 shadow-2xl`}
        onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 h-1 w-full overflow-hidden rounded-full bg-white/20">
          <motion.div className="h-full rounded-full bg-white/90" initial={{ width: "0%" }} animate={{ width: "100%" }} transition={{ duration: 8, ease: "linear" }} />
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3"><Avatar initials={story.userAvatar} size="sm" /><div><p className="text-sm font-semibold text-white">{story.userName}</p><p className="text-[10px] text-white/60">Just now</p></div></div>
          <button onClick={onClose} className="rounded-full p-2 text-white/70 transition hover:bg-white/10 hover:text-white"><svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>
        </div>
        <div className="flex flex-1 items-center justify-center px-2 sm:px-4"><p className="text-center text-xl sm:text-2xl font-bold leading-relaxed text-white drop-shadow-lg">{story.content}</p></div>
        <div className="flex items-center justify-center gap-4 pt-4">
          <Link href={story.projectId ? `/trade/${story.projectId}` : `/profile/${story.userId}`} className="rounded-full bg-white/20 px-6 py-2.5 text-sm font-semibold text-white backdrop-blur-sm transition hover:bg-white/30" onClick={onClose}>{story.projectId ? "View Project" : "View Profile"}</Link>
        </div>
      </motion.div>
    </motion.div>
  );
}

function QuickInvestPanel({ project, onInvest, onClose }: { project: ProjectPost; onInvest: (s: number) => void; onClose: () => void }) {
  const [shares, setShares] = useState(5);
  const total = shares * project.pricePerShare;
  return (
    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden">
      <div className="border-t border-card-border bg-gradient-to-b from-accent/5 to-transparent px-4 sm:px-5 py-4">
        <div className="flex items-center justify-between mb-3">
          <div><p className="text-[10px] text-muted uppercase tracking-wider">Price per share</p><p className="text-lg font-bold text-foreground">{fmtShort.format(project.pricePerShare)} <span className="text-xs text-muted">VALU</span></p></div>
          <button onClick={onClose} className="rounded-lg p-1 text-muted hover:text-foreground transition"><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg></button>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="flex items-center rounded-xl border border-card-border bg-card overflow-hidden">
              <button onClick={() => setShares(Math.max(1, shares - 1))} className="px-3 py-2.5 text-muted hover:text-foreground hover:bg-card-border/50 transition text-sm font-bold">-</button>
              <input type="number" min={1} max={100} value={shares} onChange={(e) => setShares(Math.max(1, Math.min(100, Number(e.target.value) || 1)))} className="w-12 bg-transparent text-center text-sm font-bold text-foreground outline-none" />
              <button onClick={() => setShares(Math.min(100, shares + 1))} className="px-3 py-2.5 text-muted hover:text-foreground hover:bg-card-border/50 transition text-sm font-bold">+</button>
            </div>
            <div className="flex gap-1">{[1, 5, 10, 25].map((n) => (<button key={n} onClick={() => setShares(n)} className={`rounded-lg px-2.5 py-2 text-[10px] font-bold transition ${shares === n ? "bg-accent text-white shadow-md shadow-accent/20" : "bg-card border border-card-border text-muted hover:text-foreground"}`}>{n}</button>))}</div>
          </div>
          <div className="sm:ml-auto text-right"><p className="text-[10px] text-muted">Total</p><p className="text-sm font-bold text-foreground">{fmtShort.format(total)} <span className="text-[10px] text-muted">VALU</span></p></div>
        </div>
        <motion.button whileTap={{ scale: 0.97 }} onClick={() => onInvest(shares)} className="mt-3 w-full rounded-xl bg-gradient-to-r from-gain via-emerald-500 to-green-400 py-3 text-sm font-bold text-white shadow-lg shadow-gain/25 transition hover:shadow-gain/40 hover:brightness-110">
          Invest {shares} {shares === 1 ? "share" : "shares"} · {fmtShort.format(total)} VALU
        </motion.button>
      </div>
    </motion.div>
  );
}

function ProjectCard({ project, onInvest }: { project: ProjectPost; onInvest: (id: string, s: number) => void }) {
  const [showInvest, setShowInvest] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(project.likes);
  const fundedPct = Math.round((project.fundingRaised / project.fundingGoal) * 100);
  const toggleLike = () => { setLiked((p) => !p); setLikeCount((p) => (liked ? p - 1 : p + 1)); };

  return (
    <motion.div variants={item} className="glass-card overflow-hidden group">
      {/* Cover with gradient overlay */}
      <div className={`relative flex h-36 sm:h-44 items-center justify-center bg-gradient-to-br ${project.coverGradient}`}>
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        <svg className="h-14 w-14 sm:h-20 sm:w-20 text-white/[0.07]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={0.8}><path strokeLinecap="round" strokeLinejoin="round" d={project.coverIcon} /></svg>

        <div className="absolute top-3 left-3 flex items-center gap-1.5">
          <span className="rounded-full bg-black/50 px-2.5 py-0.5 text-[10px] font-semibold text-white backdrop-blur-md">{project.category}</span>
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold backdrop-blur-md ${project.priceChange24h > 0 ? "bg-gain/25 text-gain" : "bg-loss/25 text-loss"}`}>
            {project.priceChange24h > 0 ? "+" : ""}{project.priceChange24h}%
          </span>
        </div>

        <div className="absolute top-3 right-3 flex items-center gap-1.5 rounded-full bg-black/50 px-2.5 py-1 backdrop-blur-md">
          <div className="h-1.5 w-1.5 rounded-full bg-gain live-dot-green" />
          <span className="text-[10px] font-semibold text-white">{project.daysLeft}d left</span>
        </div>

        {/* Price pill — bottom left */}
        <div className="absolute bottom-3 left-3">
          <Link href={`/trade/${project.id}`} className="flex items-center gap-2 rounded-xl bg-black/60 pl-1.5 pr-3 py-1.5 backdrop-blur-md transition hover:bg-black/70">
            <div className={`flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br ${project.coverGradient} text-[9px] font-bold text-white`}>{project.title.split(" ").map(w => w[0]).join("").slice(0, 2)}</div>
            <div><p className="text-[9px] text-white/50 uppercase tracking-wider leading-none">Share Price</p><p className="text-sm font-bold text-white leading-tight">{fmtShort.format(project.pricePerShare)} <span className="text-[9px] text-white/50">VALU</span></p></div>
          </Link>
        </div>

        {/* Backers pill — bottom right */}
        <div className="absolute bottom-3 right-3 flex items-center gap-1 rounded-full bg-black/50 px-2 py-1 backdrop-blur-md">
          <svg className="h-3 w-3 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>
          <span className="text-[10px] font-medium text-white/70">{fmtCompact.format(project.backers)}</span>
        </div>
      </div>

      {/* Creator + info */}
      <div className="px-4 sm:px-5 pt-3.5 sm:pt-4">
        <div className="flex items-start gap-2.5">
          <Link href={`/profile/${project.creatorId}`} className="shrink-0 group/avatar"><Avatar initials={project.creatorAvatar} size="sm" /></Link>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
              <Link href={`/profile/${project.creatorId}`} className="text-sm font-semibold text-foreground hover:text-accent-light transition">{project.creatorName}</Link>
              <TierBadge tier={project.creatorTier} />
              <span className="text-xs text-muted">· {project.timeAgo}</span>
            </div>
            <p className="text-[10px] text-muted mt-0.5">Credibility: <span className="text-foreground/70 font-medium">{project.creatorScore}/100</span></p>
          </div>
          <button className="shrink-0 rounded-lg p-1.5 text-muted/50 transition hover:bg-card-border/30 hover:text-muted"><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM12.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM18.75 12a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" /></svg></button>
        </div>

        <div className="mt-3">
          <Link href={`/trade/${project.id}`}><h3 className="text-base sm:text-lg font-bold text-foreground leading-tight hover:text-accent-light transition">{project.title}</h3></Link>
          <p className="mt-0.5 text-xs text-accent-light/80 font-medium">{project.tagline}</p>
        </div>
        <p className="mt-2 text-[13px] leading-relaxed text-foreground/70 line-clamp-2 sm:line-clamp-3">{project.description}</p>
        <div className="mt-2.5 flex flex-wrap gap-1.5">{project.tags.map((t) => (<span key={t} className="rounded-full bg-accent/[0.06] border border-accent/10 px-2.5 py-0.5 text-[10px] font-medium text-accent-light/70">{t}</span>))}</div>
      </div>

      {/* Funding bar */}
      <div className="mx-4 sm:mx-5 mt-3.5 rounded-xl bg-card/80 border border-card-border/60 p-3">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="text-muted">Funding</span>
          <span className={`font-bold tabular-nums ${fundedPct >= 80 ? "text-gain" : "text-accent-light"}`}>{fundedPct}%</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-card-border/80">
          <motion.div className={`h-full rounded-full ${fundedPct >= 80 ? "bg-gradient-to-r from-gain to-emerald-400" : "bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"}`} initial={{ width: 0 }} animate={{ width: `${fundedPct}%` }} transition={{ duration: 1.2, ease: [0.25, 0.46, 0.45, 0.94], delay: 0.2 }} />
        </div>
        <div className="mt-2 flex items-center justify-between text-[10px]">
          <span className="text-foreground/60 tabular-nums">{fmt.format(project.fundingRaised)} <span className="text-muted">raised</span></span>
          <span className="text-muted tabular-nums">of {fmt.format(project.fundingGoal)}</span>
        </div>
        <div className="mt-1.5 flex items-center gap-1.5"><svg className="h-3 w-3 text-gain/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75" /></svg><span className="text-[10px] text-foreground/50">{project.milestone}</span></div>
      </div>

      {/* Engagement + actions */}
      <div className="mx-4 sm:mx-5 mt-2.5 flex items-center gap-3 text-[11px] text-muted/70"><span>{likeCount.toLocaleString()} likes</span><span>{project.comments} comments</span></div>
      <div className="mx-4 sm:mx-5 mt-2 flex items-center border-t border-card-border/50">
        {[
          { action: toggleLike, active: liked, activeColor: "text-loss", icon: <svg className={`h-[18px] w-[18px] transition ${liked ? "fill-loss" : "fill-none"}`} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" /></svg>, label: "Like" },
          { action: () => {}, active: false, activeColor: "", icon: <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 01-.923 1.785A5.969 5.969 0 006 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337z" /></svg>, label: "Comment" },
          { action: () => {}, active: false, activeColor: "", icon: <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" /></svg>, label: "Share" },
        ].map(({ action, active, activeColor, icon, label }) => (
          <motion.button key={label} whileTap={{ scale: 0.9 }} onClick={action} className={`flex flex-1 items-center justify-center gap-1.5 py-2.5 sm:py-3 text-xs font-medium transition ${active ? activeColor : "text-muted/60 hover:text-muted"}`}>{icon}<span className="hidden sm:inline">{label}</span></motion.button>
        ))}
        <motion.button whileTap={{ scale: 0.95 }} onClick={() => setShowInvest(!showInvest)} className={`flex flex-1 items-center justify-center gap-1.5 py-2.5 sm:py-3 text-xs font-bold transition ${showInvest ? "text-gain" : "text-gain/60 hover:text-gain"}`}>
          <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" /></svg>
          <span className="hidden sm:inline">Invest</span>
        </motion.button>
      </div>
      <AnimatePresence>{showInvest && (<QuickInvestPanel project={project} onInvest={(s) => { onInvest(project.id, s); setShowInvest(false); }} onClose={() => setShowInvest(false)} />)}</AnimatePresence>
    </motion.div>
  );
}

function TradeHistorySidebar({ trades, onConfirm, onCancel }: { trades: TradeRecord[]; onConfirm: (id: string) => void; onCancel: (id: string) => void }) {
  const pending = trades.filter((t) => t.status === "pending");
  const confirmed = trades.filter((t) => t.status === "confirmed");
  const cancelled = trades.filter((t) => t.status === "cancelled");

  return (
    <div className="flex flex-col gap-4">
      {/* Wallet card */}
      <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4, delay: 0.1 }} className="glass-card-strong p-4 card-glow-accent">
        <div className="flex items-center gap-3"><Avatar initials="AK" size="md" /><div><p className="font-semibold text-sm">Arjun Kapoor</p><p className="text-[10px] text-muted">@arjunkapoor</p></div></div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="rounded-xl bg-card/80 border border-card-border/40 px-3 py-2.5"><p className="text-[10px] text-muted">Balance</p><p className="text-sm font-bold tabular-nums">{wallet.balance.toLocaleString()} <span className="text-[9px] text-muted">VALU</span></p></div>
          <div className="rounded-xl bg-card/80 border border-card-border/40 px-3 py-2.5"><p className="text-[10px] text-muted">P&L</p><p className="text-sm font-bold text-gain tabular-nums">+{wallet.pnlPercent}%</p></div>
        </div>
      </motion.div>

      {/* Trade history */}
      <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4, delay: 0.2 }} className="glass-card p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold flex items-center gap-2"><svg className="h-4 w-4 text-accent-light" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>Trades</h3>
          {trades.length > 0 && <span className="text-[10px] text-muted">{trades.length}</span>}
        </div>
        {trades.length === 0 ? (
          <div className="flex flex-col items-center py-8 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/5 border border-accent/10 mb-3"><svg className="h-5 w-5 text-accent-light/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" /></svg></div>
            <p className="text-xs text-muted">No trades yet</p><p className="text-[10px] text-muted/50 mt-0.5">Invest in a project to start</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2 max-h-[calc(100vh-420px)] overflow-y-auto scrollbar-none">
            {pending.map((t) => (
              <motion.div key={t.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="rounded-xl border border-amber-500/15 bg-amber-500/5 p-3">
                <div className="flex items-center gap-2"><Avatar initials={t.creatorAvatar} size="sm" /><div className="min-w-0 flex-1"><p className="text-xs font-semibold truncate">{t.projectTitle}</p><p className="text-[10px] text-muted">{t.timestamp}</p></div><p className="text-xs font-bold tabular-nums">{t.shares}×</p></div>
                <div className="mt-2 flex gap-2">
                  <motion.button whileTap={{ scale: 0.95 }} onClick={() => onConfirm(t.id)} className="flex-1 rounded-lg bg-gain/15 py-1.5 text-[10px] font-bold text-gain hover:bg-gain/25 transition">Confirm</motion.button>
                  <motion.button whileTap={{ scale: 0.95 }} onClick={() => onCancel(t.id)} className="flex-1 rounded-lg bg-loss/15 py-1.5 text-[10px] font-bold text-loss hover:bg-loss/25 transition">Cancel</motion.button>
                </div>
              </motion.div>
            ))}
            {confirmed.map((t) => (
              <div key={t.id} className="rounded-xl border border-gain/10 bg-gain/5 p-3">
                <div className="flex items-center gap-2"><Avatar initials={t.creatorAvatar} size="sm" /><div className="min-w-0 flex-1"><p className="text-xs font-semibold truncate">{t.projectTitle}</p></div><p className="text-xs font-bold text-gain tabular-nums">{t.shares}×</p></div>
                <div className="mt-1 flex items-center gap-1"><svg className="h-2.5 w-2.5 text-gain" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75" /></svg><span className="text-[9px] text-gain">On-chain</span></div>
              </div>
            ))}
            {cancelled.map((t) => (<div key={t.id} className="rounded-xl border border-card-border bg-card/30 p-3 opacity-40"><div className="flex items-center gap-2"><Avatar initials={t.creatorAvatar} size="sm" /><p className="text-xs truncate line-through flex-1">{t.projectTitle}</p></div></div>))}
          </div>
        )}
      </motion.div>

      {/* Top projects */}
      <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4, delay: 0.3 }} className="glass-card p-4">
        <div className="mb-3 flex items-center justify-between"><h3 className="text-sm font-bold">Top Projects</h3><Link href="/market" className="text-[10px] font-medium text-accent-light hover:text-accent transition">All →</Link></div>
        <div className="flex flex-col gap-2">{topProjects.map((p, i) => (
          <Link key={p.id} href={`/trade/${p.id}`} className="flex items-center gap-2.5 rounded-lg px-1 py-1 -mx-1 transition hover:bg-card-border/20">
            <span className="text-[10px] text-muted/50 w-3 tabular-nums">{i + 1}</span>
            <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${p.coverGradient} text-[9px] font-bold text-white/80`}>{p.title.split(" ").map(w => w[0]).join("").slice(0, 2)}</div>
            <div className="min-w-0 flex-1"><p className="text-xs font-medium truncate">{p.title}</p><p className="text-[10px] text-muted">{p.creator.name}</p></div>
            <span className={`text-[10px] font-bold tabular-nums ${p.changePercent >= 0 ? "text-gain" : "text-loss"}`}>{p.changePercent >= 0 ? "+" : ""}{p.changePercent}%</span>
          </Link>
        ))}</div>
      </motion.div>

      <div className="px-2 py-2 text-[10px] text-muted/30"><p>About · Terms · Privacy</p><p className="mt-0.5">Valyou &copy; 2026</p></div>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// HOMEPAGE
// ═══════════════════════════════════════════════════

export default function HomePage() {
  const [activeStory, setActiveStory] = useState<Story | null>(null);
  const [trades, setTrades] = useState<TradeRecord[]>([]);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => { setToastMsg(msg); setTimeout(() => setToastMsg(null), 3000); }, []);

  const handleInvest = useCallback((projectId: string, shares: number) => {
    const project = projectFeed.find((p) => p.id === projectId);
    if (!project) return;
    setTrades((prev) => [{ id: `tr-${Date.now()}`, projectId: project.id, projectTitle: project.title, creatorName: project.creatorName, creatorAvatar: project.creatorAvatar, type: "invest", amount: shares * project.pricePerShare, shares, pricePerShare: project.pricePerShare, timestamp: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }), status: "pending" }, ...prev]);
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

  const totalRaised = useMemo(() => projects.reduce((s, p) => s + p.fundingRaised, 0), []);
  const totalBackers = useMemo(() => projects.reduce((s, p) => s + p.backers, 0), []);

  return (
    <section className="py-4 sm:py-6">

      {/* ═══ HERO SECTION ═══ */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }} className="relative overflow-hidden rounded-2xl sm:rounded-3xl mb-5 sm:mb-8">
        {/* Background layers */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-950/80 via-background to-purple-950/60" />
        <div className="absolute top-0 right-0 w-72 h-72 sm:w-96 sm:h-96 rounded-full bg-indigo-500/10 blur-3xl animate-glow-pulse" />
        <div className="absolute bottom-0 left-0 w-56 h-56 sm:w-80 sm:h-80 rounded-full bg-purple-500/10 blur-3xl animate-glow-pulse" style={{ animationDelay: "1.5s" }} />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(99,102,241,0.08),transparent_60%)]" />

        <div className="relative px-5 sm:px-8 md:px-12 py-8 sm:py-12 md:py-16">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}>
            <div className="flex items-center gap-2 mb-4">
              <div className="h-1.5 w-1.5 rounded-full bg-gain live-dot-green" />
              <span className="text-[11px] sm:text-xs font-medium text-gain">{projects.length} projects live now</span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold leading-[1.1] tracking-tight">
              <span className="text-foreground">Invest in </span>
              <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-gradient-x">
                Ideas That Ship
              </span>
            </h1>
            <p className="mt-3 sm:mt-4 text-sm sm:text-base md:text-lg text-muted max-w-xl leading-relaxed">
              Back real projects by real builders. Trade shares, track progress, and earn returns when ideas become products.
            </p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.25 }} className="flex flex-wrap gap-3 mt-5 sm:mt-6">
            <Link href="/market" className="inline-flex items-center gap-2 rounded-xl bg-accent px-5 sm:px-6 py-2.5 sm:py-3 text-sm font-semibold text-white shadow-lg shadow-accent/20 transition hover:bg-accent-light hover:shadow-accent/30 hover:scale-[1.02] active:scale-[0.98]">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" /></svg>
              Explore Market
            </Link>
            <Link href="/discover" className="inline-flex items-center gap-2 rounded-xl border border-card-border bg-card/50 px-5 sm:px-6 py-2.5 sm:py-3 text-sm font-semibold text-foreground backdrop-blur-sm transition hover:border-accent/30 hover:bg-card hover:scale-[1.02] active:scale-[0.98]">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" /></svg>
              Discover
            </Link>
          </motion.div>

          {/* Stats row */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.4 }} className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 mt-8 sm:mt-10 pt-6 sm:pt-8 border-t border-white/[0.04]">
            {[
              { label: "Total Raised", value: totalRaised, prefix: "₹", color: "text-gain" },
              { label: "Active Backers", value: totalBackers, color: "text-foreground" },
              { label: "Live Projects", value: projects.length, color: "text-foreground" },
              { label: "Your Returns", value: wallet.pnlPercent, suffix: "%", prefix: "+", color: "text-gain" },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="text-[10px] sm:text-xs text-muted/60 uppercase tracking-wider mb-1">{stat.label}</p>
                <p className={`text-xl sm:text-2xl md:text-3xl font-bold tabular-nums ${stat.color}`}>
                  <AnimatedNumber value={stat.value} prefix={stat.prefix} suffix={stat.suffix} />
                </p>
              </div>
            ))}
          </motion.div>
        </div>
      </motion.div>

      {/* ═══ TRENDING ═══ */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.15 }} className="mb-5 sm:mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/10"><svg className="h-3.5 w-3.5 text-accent-light" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" /></svg></div>
            <h2 className="text-base sm:text-lg font-bold">Trending</h2>
          </div>
          <Link href="/market" className="text-xs font-medium text-accent-light/70 hover:text-accent-light transition">View all →</Link>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-3 scrollbar-none -mx-3 px-3 sm:-mx-0 sm:px-0">
          {trendingProjects.map((p, i) => (
            <Link key={p.id} href={`/trade/${p.id}`} className="shrink-0">
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.05 }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className={`w-44 sm:w-52 rounded-2xl overflow-hidden border border-white/[0.04] bg-gradient-to-br ${p.coverGradient} transition-shadow hover:shadow-xl hover:shadow-accent/5`}
              >
                <div className="p-3.5 sm:p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm text-[10px] font-bold text-white">{p.title.split(" ").map(w => w[0]).join("").slice(0, 2)}</div>
                    <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${p.changePercent >= 0 ? "bg-gain/20 text-gain" : "bg-loss/20 text-loss"}`}>{p.changePercent >= 0 ? "+" : ""}{p.changePercent.toFixed(1)}%</span>
                  </div>
                  <p className="text-[13px] font-bold text-white truncate">{p.title}</p>
                  <p className="text-[10px] text-white/50 truncate mt-0.5">{p.creator.name}</p>
                  <div className="flex items-baseline gap-1 mt-3">
                    <p className="text-lg font-bold text-white tabular-nums">{p.price.toFixed(2)}</p>
                    <span className="text-[9px] text-white/40">VALU</span>
                  </div>
                  {/* Tiny progress bar */}
                  <div className="mt-2 h-0.5 w-full rounded-full bg-white/10 overflow-hidden">
                    <div className="h-full rounded-full bg-white/30" style={{ width: `${Math.round((p.fundingRaised / p.fundingGoal) * 100)}%` }} />
                  </div>
                  <p className="text-[9px] text-white/40 mt-1 tabular-nums">{Math.round((p.fundingRaised / p.fundingGoal) * 100)}% funded</p>
                </div>
              </motion.div>
            </Link>
          ))}
        </div>
      </motion.div>

      {/* ═══ MAIN LAYOUT ═══ */}
      <div className="flex gap-6">
        <div className="min-w-0 flex-1 max-w-2xl mx-auto lg:mx-0">

          {/* Stories */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }} className="glass-card p-3 sm:p-4">
            <div className="flex gap-3 sm:gap-3.5 overflow-x-auto pb-1 scrollbar-none">
              <button className="flex shrink-0 flex-col items-center gap-1">
                <div className="relative flex h-14 w-14 sm:h-[60px] sm:w-[60px] items-center justify-center rounded-full border-2 border-dashed border-card-border/60 transition hover:border-accent/40">
                  <svg className="h-5 w-5 text-muted/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                </div>
                <span className="text-[9px] text-muted/60">Add</span>
              </button>
              {stories.map((story) => (
                <motion.button key={story.id} whileTap={{ scale: 0.93 }} onClick={() => setActiveStory(story)} className={`flex shrink-0 flex-col items-center gap-1 transition ${story.viewed ? "opacity-40" : ""}`}>
                  <div className={`rounded-full bg-gradient-to-br ${story.gradient} p-[2px]`}>
                    <div className="rounded-full bg-background p-[1.5px]">
                      <div className="flex h-[48px] w-[48px] sm:h-[52px] sm:w-[52px] items-center justify-center rounded-full bg-gradient-to-br from-indigo-500/80 to-purple-600/80 text-xs sm:text-sm font-semibold text-white">{story.userAvatar}</div>
                    </div>
                  </div>
                  <span className="max-w-[52px] sm:max-w-[60px] truncate text-[9px] text-foreground/60">{story.userName.split(" ")[0]}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Composer */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.25 }} className="glass-card mt-3 sm:mt-4 p-3 sm:p-4">
            <div className="flex items-center gap-2.5">
              <Avatar initials="AK" size="sm" />
              <input type="text" placeholder="Share a project idea..." className="flex-1 rounded-xl bg-card/80 border border-card-border/50 px-3 sm:px-4 py-2.5 text-sm text-foreground placeholder:text-muted/40 outline-none focus:border-accent/40 transition-colors" readOnly />
              <button className="shrink-0 rounded-xl bg-gradient-to-r from-accent to-purple-500 px-4 sm:px-5 py-2.5 text-xs font-semibold text-white shadow-md shadow-accent/15 transition hover:shadow-accent/25 hover:brightness-110">Publish</button>
            </div>
          </motion.div>

          {/* Pending banner */}
          <AnimatePresence>
            {pendingCount > 0 && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mt-3 overflow-hidden">
                <div className="flex items-center gap-2.5 rounded-xl border border-amber-500/15 bg-amber-500/[0.06] px-3 sm:px-4 py-2.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-500/15 shrink-0"><svg className="h-3.5 w-3.5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></div>
                  <p className="text-xs font-medium text-amber-400 flex-1">{pendingCount} pending trade{pendingCount > 1 ? "s" : ""}</p>
                  <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Feed */}
          <motion.div className="mt-3 sm:mt-4 flex flex-col gap-4 sm:gap-5" variants={container} initial="hidden" animate="show">
            {projectFeed.map((project) => (<ProjectCard key={project.id} project={project} onInvest={handleInvest} />))}
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center gap-2 text-sm text-muted/40">
                {[0, 0.2, 0.4].map((d) => (<div key={d} className="h-1 w-1 animate-pulse rounded-full bg-accent/40" style={{ animationDelay: `${d}s` }} />))}
                <span className="ml-2">Loading more...</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Sidebar */}
        <div className="hidden lg:block w-80 shrink-0">
          <div className="sticky top-20"><TradeHistorySidebar trades={trades} onConfirm={confirmTrade} onCancel={cancelTrade} /></div>
        </div>
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div initial={{ opacity: 0, y: 40, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 40, scale: 0.95 }} className="fixed bottom-20 lg:bottom-6 left-1/2 z-[90] -translate-x-1/2 w-[calc(100%-2rem)] sm:w-auto max-w-md">
            <div className="flex items-center gap-2.5 rounded-2xl border border-gain/15 bg-background/95 px-5 py-3 shadow-2xl shadow-black/40 backdrop-blur-xl">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gain/15"><svg className="h-3.5 w-3.5 text-gain" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75" /></svg></div>
              <p className="text-xs sm:text-sm font-medium text-foreground truncate">{toastMsg}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>{activeStory && <StoryViewer story={activeStory} onClose={() => setActiveStory(null)} />}</AnimatePresence>
    </section>
  );
}
