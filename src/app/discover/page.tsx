"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import Link from "next/link";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useTransform,
} from "framer-motion";
import { computeProjectHealth, getDisputeStatus } from "@/lib/data";
import type { ProjectStock } from "@/lib/data";
import { apiGetProjects } from "@/lib/api-client";
import Avatar from "@/components/Avatar";
import SparklineChart from "@/components/SparklineChart";
import { BatchTimelineCompact } from "@/components/BatchTimeline";

import { formatAlgo } from "@/lib/algo";

// ── Preference options ──

const interestOptions = [
  { id: "ai", label: "AI / ML", icon: "M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z", gradient: "from-violet-500/20 to-purple-500/20", border: "border-violet-500/30" },
  { id: "web3", label: "Web3 / DeFi", icon: "M21 12a9 9 0 11-18 0 9 9 0 0118 0z M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33", gradient: "from-emerald-500/20 to-teal-500/20", border: "border-emerald-500/30" },
  { id: "saas", label: "SaaS / Tools", icon: "M11.42 15.17l-5.648-3.014m0 0A11.944 11.944 0 015 12c0-3.597 1.592-6.821 4.11-9.016m1.162 12.186l5.48 2.927m0 0A11.944 11.944 0 0119 12c0-3.597-1.592-6.821-4.11-9.016m-1.162 12.186l.48-7.37", gradient: "from-blue-500/20 to-cyan-500/20", border: "border-blue-500/30" },
  { id: "devops", label: "DevOps / Infra", icon: "M5.25 14.25h13.5m-13.5 0a3 3 0 01-3-3m3 3a3 3 0 100 6h13.5a3 3 0 100-6m-16.5-3a3 3 0 013-3h13.5a3 3 0 013 3m-19.5 0a4.5 4.5 0 01.9-2.7L5.737 5.1a3.375 3.375 0 012.7-1.35h7.126c1.062 0 2.062.5 2.7 1.35l2.587 3.45a4.5 4.5 0 01.9 2.7m0 0a3 3 0 01-3 3m0 3h.008v.008h-.008v-.008zm0-6h.008v.008h-.008v-.008zm-3 6h.008v.008h-.008v-.008zm0-6h.008v.008h-.008v-.008z", gradient: "from-slate-500/20 to-gray-500/20", border: "border-slate-500/30" },
  { id: "edtech", label: "EdTech", icon: "M4.26 10.147a60.438 60.438 0 00-.491 6.347A48.62 48.62 0 0112 20.904a48.62 48.62 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.636 50.636 0 00-2.658-.813A59.906 59.906 0 0112 3.493a59.903 59.903 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5", gradient: "from-amber-500/20 to-orange-500/20", border: "border-amber-500/30" },
  { id: "design", label: "Design / UX", icon: "M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42", gradient: "from-pink-500/20 to-rose-500/20", border: "border-pink-500/30" },
];

const styleOptions = [
  { id: "conservative", label: "Conservative", desc: "Prefer proven projects with stable returns", icon: "🛡️", color: "from-blue-500/15 to-indigo-500/15", border: "border-blue-500/25" },
  { id: "balanced", label: "Balanced", desc: "Mix of safe bets and emerging projects", icon: "⚖️", color: "from-purple-500/15 to-violet-500/15", border: "border-purple-500/25" },
  { id: "aggressive", label: "Aggressive", desc: "High-risk, high-reward early-stage plays", icon: "🔥", color: "from-orange-500/15 to-red-500/15", border: "border-orange-500/25" },
];

const budgetOptions = [
  { id: "small", label: "Under 100 ALGO", value: 1000, desc: "Explore with small stakes" },
  { id: "medium", label: "100 – 500 ALGO", value: 5000, desc: "Moderate investment per project" },
  { id: "large", label: "500 – 2,000 ALGO", value: 20000, desc: "Serious backing for favorites" },
  { id: "whale", label: "2,000+ ALGO", value: 50000, desc: "Go big on conviction bets" },
];

interface Preferences {
  interests: string[];
  style: string;
  budget: string;
}

// ── Category mapping ──

const categoryToInterest: Record<string, string> = {
  "AI / SaaS": "ai",
  "Design / Tools": "design",
  "Blockchain / HR Tech": "web3",
  "EdTech / AI": "edtech",
  "DevOps / Tools": "devops",
  "AI / HR Tech": "ai",
  "DeFi / Blockchain": "web3",
  "Infrastructure / DB": "devops",
};

function computeMatchScore(project: ProjectStock, prefs: Preferences): number {
  let score = 50;
  const interest = categoryToInterest[project.category];
  if (prefs.interests.includes(interest)) score += 30;
  if (prefs.style === "conservative" && project.changePercent >= 0 && project.milestoneProgress >= 60) score += 15;
  if (prefs.style === "balanced" && project.milestoneProgress >= 40) score += 10;
  if (prefs.style === "aggressive" && project.filterCategory === "new") score += 15;
  if (project.fundingRaised / project.fundingGoal > 0.5) score += 5;

  const health = computeProjectHealth(project);
  if (health.batchStatus === "overdue") score -= 15;
  if (health.overdueDays > 7) score -= 10;

  const dStatus = getDisputeStatus(project);
  if (dStatus === "open") score -= 20;
  if (dStatus === "confirmed") score -= 40;

  return Math.max(5, Math.min(score, 99));
}

// ═══════════════════════════════════════════
// PREFERENCE WIZARD
// ═══════════════════════════════════════════

function PreferenceWizard({ onComplete }: { onComplete: (prefs: Preferences) => void }) {
  const [step, setStep] = useState(0);
  const [interests, setInterests] = useState<string[]>([]);
  const [style, setStyle] = useState("");
  const [budget, setBudget] = useState("");

  const toggleInterest = (id: string) => {
    setInterests((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]);
  };

  const canProceed = step === 0 ? interests.length > 0 : step === 1 ? style !== "" : budget !== "";

  const handleNext = () => {
    if (step < 2) setStep(step + 1);
    else onComplete({ interests, style, budget });
  };

  const steps = [
    { title: "What excites you?", subtitle: "Pick the categories you want to explore" },
    { title: "Your investment style?", subtitle: "This helps us rank projects for you" },
    { title: "Budget per project?", subtitle: "We'll tailor recommendations to your range" },
  ];

  return (
    <section className="py-6 sm:py-10">
      {/* Background glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/3 w-80 h-80 rounded-full bg-accent/5 blur-3xl animate-glow-pulse" />
        <div className="absolute bottom-1/4 right-1/3 w-64 h-64 rounded-full bg-purple-500/5 blur-3xl animate-glow-pulse" style={{ animationDelay: "1.5s" }} />
      </div>

      <div className="relative max-w-lg mx-auto">
        {/* Progress bar */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-8 sm:mb-10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted">Step {step + 1} of 3</span>
            <span className="text-xs text-accent-light font-medium">{Math.round(((step + 1) / 3) * 100)}%</span>
          </div>
          <div className="h-1 w-full rounded-full bg-card-border/50 overflow-hidden">
            <motion.div className="h-full rounded-full bg-gradient-to-r from-accent to-purple-500" animate={{ width: `${((step + 1) / 3) * 100}%` }} transition={{ duration: 0.4, ease: "easeOut" }} />
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.35 }}
          >
            {/* Header */}
            <div className="text-center mb-6 sm:mb-8">
              <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-2xl sm:text-3xl font-bold tracking-tight">
                {steps[step].title}
              </motion.h1>
              <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="mt-1.5 text-sm text-muted">
                {steps[step].subtitle}
              </motion.p>
            </div>

            {/* Step 0: Interests */}
            {step === 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {interestOptions.map((opt, i) => {
                  const selected = interests.includes(opt.id);
                  return (
                    <motion.button
                      key={opt.id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.05 * i }}
                      onClick={() => toggleInterest(opt.id)}
                      className={`relative flex flex-col items-center gap-2.5 rounded-2xl border p-4 sm:p-5 transition-all ${
                        selected
                          ? `bg-gradient-to-br ${opt.gradient} ${opt.border} shadow-lg shadow-accent/5`
                          : "border-card-border/50 bg-card/40 hover:border-card-border hover:bg-card/60"
                      }`}
                    >
                      {selected && (
                        <motion.div layoutId="check-ring" className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-accent">
                          <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                        </motion.div>
                      )}
                      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${selected ? "bg-white/10" : "bg-card-border/30"}`}>
                        <svg className={`h-5 w-5 ${selected ? "text-accent-light" : "text-muted"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d={opt.icon} /></svg>
                      </div>
                      <span className={`text-xs sm:text-sm font-semibold ${selected ? "text-foreground" : "text-muted"}`}>{opt.label}</span>
                    </motion.button>
                  );
                })}
              </div>
            )}

            {/* Step 1: Style */}
            {step === 1 && (
              <div className="flex flex-col gap-3">
                {styleOptions.map((opt, i) => {
                  const selected = style === opt.id;
                  return (
                    <motion.button
                      key={opt.id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.05 * i }}
                      onClick={() => setStyle(opt.id)}
                      className={`relative flex items-center gap-4 rounded-2xl border p-4 sm:p-5 text-left transition-all ${
                        selected
                          ? `bg-gradient-to-r ${opt.color} ${opt.border} shadow-lg shadow-accent/5`
                          : "border-card-border/50 bg-card/40 hover:border-card-border hover:bg-card/60"
                      }`}
                    >
                      <span className="text-2xl">{opt.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm sm:text-base font-semibold ${selected ? "text-foreground" : "text-muted"}`}>{opt.label}</p>
                        <p className="text-xs text-muted/70 mt-0.5">{opt.desc}</p>
                      </div>
                      <div className={`flex h-5 w-5 items-center justify-center rounded-full border-2 transition ${selected ? "border-accent bg-accent" : "border-card-border"}`}>
                        {selected && <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>}
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            )}

            {/* Step 2: Budget */}
            {step === 2 && (
              <div className="grid grid-cols-2 gap-3">
                {budgetOptions.map((opt, i) => {
                  const selected = budget === opt.id;
                  return (
                    <motion.button
                      key={opt.id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.05 * i }}
                      onClick={() => setBudget(opt.id)}
                      className={`relative flex flex-col items-center gap-2 rounded-2xl border p-4 sm:p-5 text-center transition-all ${
                        selected
                          ? "bg-gradient-to-br from-accent/10 to-purple-500/10 border-accent/30 shadow-lg shadow-accent/5"
                          : "border-card-border/50 bg-card/40 hover:border-card-border hover:bg-card/60"
                      }`}
                    >
                      <p className={`text-base sm:text-lg font-bold ${selected ? "text-accent-light" : "text-foreground/70"}`}>{opt.label}</p>
                      <p className="text-[10px] sm:text-xs text-muted/60">{opt.desc}</p>
                    </motion.button>
                  );
                })}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="flex items-center justify-between mt-8 sm:mt-10">
          <button
            onClick={() => step > 0 && setStep(step - 1)}
            className={`flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-medium transition ${step > 0 ? "text-muted hover:text-foreground" : "opacity-0 pointer-events-none"}`}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
            Back
          </button>

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleNext}
            disabled={!canProceed}
            className={`flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold transition ${
              canProceed
                ? "bg-gradient-to-r from-accent to-purple-500 text-white shadow-lg shadow-accent/20 hover:shadow-accent/30 hover:brightness-110"
                : "bg-card-border/30 text-muted/40 cursor-not-allowed"
            }`}
          >
            {step === 2 ? "Start Discovering" : "Continue"}
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
          </motion.button>
        </motion.div>

        {/* Skip */}
        <div className="text-center mt-4">
          <button onClick={() => onComplete({ interests: interestOptions.map(o => o.id), style: "balanced", budget: "medium" })} className="text-xs text-muted/40 hover:text-muted transition underline underline-offset-2">
            Skip and show everything
          </button>
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════
// SWIPE CARD
// ═══════════════════════════════════════════

const SWIPE_THRESHOLD = 100;

function SwipeCard({
  project,
  matchScore,
  onSwipe,
}: {
  project: ProjectStock;
  matchScore: number;
  onSwipe: (dir: "left" | "right") => void;
}) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-8, 8]);
  const skipOpacity = useTransform(x, [-150, -50, 0], [1, 0.5, 0]);
  const investOpacity = useTransform(x, [0, 50, 150], [0, 0.5, 1]);
  const fundedPct = Math.round((project.fundingRaised / project.fundingGoal) * 100);

  return (
    <motion.div
      className="glass-card-strong relative mx-auto w-full max-w-sm cursor-grab overflow-hidden active:cursor-grabbing card-glow-accent"
      style={{ x, rotate }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.7}
      onDragEnd={(_, info) => {
        if (info.offset.x < -SWIPE_THRESHOLD) onSwipe("left");
        else if (info.offset.x > SWIPE_THRESHOLD) onSwipe("right");
      }}
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: -20 }}
      transition={{ duration: 0.4, ease: "easeOut" as const }}
    >
      {/* Swipe labels */}
      <motion.div className="pointer-events-none absolute left-5 top-7 z-20 rounded-xl border-2 border-loss/80 bg-loss/10 px-4 py-2 text-lg font-black tracking-wider text-loss backdrop-blur-sm" style={{ opacity: skipOpacity, rotate: -12 }}>SKIP</motion.div>
      <motion.div className="pointer-events-none absolute right-5 top-7 z-20 rounded-xl border-2 border-gain/80 bg-gain/10 px-4 py-2 text-lg font-black tracking-wider text-gain backdrop-blur-sm" style={{ opacity: investOpacity, rotate: 12 }}>INVEST</motion.div>

      {/* Cover */}
      <div className={`relative h-28 sm:h-32 bg-gradient-to-br ${project.coverGradient} overflow-hidden`}>
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
        <svg className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-16 w-16 text-white/[0.06]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={0.8}><path strokeLinecap="round" strokeLinejoin="round" d={project.coverIcon} /></svg>

        {/* Match badge */}
        <div className="absolute top-3 right-3">
          <div className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 backdrop-blur-md ${matchScore >= 80 ? "bg-gain/25 border border-gain/30" : matchScore >= 60 ? "bg-accent/25 border border-accent/30" : "bg-white/10 border border-white/10"}`}>
            <svg className={`h-3 w-3 ${matchScore >= 80 ? "text-gain" : matchScore >= 60 ? "text-accent-light" : "text-white/60"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.562.562 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" /></svg>
            <span className={`text-[10px] font-bold ${matchScore >= 80 ? "text-gain" : matchScore >= 60 ? "text-accent-light" : "text-white/60"}`}>{matchScore}% match</span>
          </div>
        </div>

        <div className="absolute bottom-3 left-3 flex items-center gap-1.5">
          <span className="rounded-full bg-black/50 px-2.5 py-0.5 text-[10px] font-medium text-white backdrop-blur-md">{project.category}</span>
        </div>
      </div>

      {/* Content */}
      <div className="px-5 sm:px-6 py-4 sm:py-5">
        {/* Title + project icon */}
        <div className="flex items-start gap-3 mb-3">
          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${project.coverGradient} text-sm font-bold text-white shadow-md`}>
            {project.title.split(" ").map(w => w[0]).join("").slice(0, 2)}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-bold leading-tight">{project.title}</h2>
            <p className="text-xs text-accent-light/80 font-medium mt-0.5">{project.tagline}</p>
          </div>
        </div>

        {/* Creator */}
        <div className="flex items-center gap-2 mb-4">
          <Avatar initials={project.creator.avatar} size="xs" />
          <span className="text-xs text-muted">{project.creator.name}</span>
          <span className="ml-auto rounded-full bg-accent/10 border border-accent/15 px-2 py-0.5 text-[10px] font-semibold text-accent-light tabular-nums">{project.creator.score}/100</span>
        </div>

        {/* Price + Chart */}
        <div className="flex items-center gap-4 mb-4">
          <div>
            <p className="text-xl font-bold tabular-nums">{formatAlgo(project.price, 2)}</p>
            <span className={`text-xs font-semibold ${project.changePercent >= 0 ? "text-gain" : "text-loss"}`}>
              {project.changePercent >= 0 ? "+" : ""}{project.changePercent.toFixed(1)}% today
            </span>
          </div>
          <div className="flex-1 ml-2">
            <SparklineChart data={project.sparkline} positive={project.change >= 0} />
          </div>
        </div>

        {/* Funding */}
        <div className="rounded-xl bg-card/60 border border-card-border/40 p-3 mb-4">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-muted">Funding Progress</span>
            <span className={`font-bold tabular-nums ${fundedPct >= 80 ? "text-gain" : "text-accent-light"}`}>{fundedPct}%</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-card-border/60 overflow-hidden">
            <motion.div className={`h-full rounded-full ${fundedPct >= 80 ? "bg-gradient-to-r from-gain to-emerald-400" : "bg-gradient-to-r from-accent to-purple-400"}`} initial={{ width: 0 }} animate={{ width: `${fundedPct}%` }} transition={{ duration: 1, ease: "easeOut" as const, delay: 0.2 }} />
          </div>
          <div className="mt-1.5 flex items-center justify-between text-[10px] text-muted">
            <span>{formatAlgo(project.fundingRaised)} raised</span>
            <span>{project.backers.toLocaleString()} backers · {project.daysLeft}d left</span>
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5">
          {project.tags.map((tag) => (
            <span key={tag} className="rounded-full bg-accent/[0.06] border border-accent/10 px-2.5 py-0.5 text-[10px] font-medium text-accent-light/60">{tag}</span>
          ))}
        </div>

        {/* Batch timeline + badges */}
        {(() => {
          const health = computeProjectHealth(project);
          const dStatus = getDisputeStatus(project);
          return (
            <div className="mt-3 flex items-center gap-2 flex-wrap">
              <BatchTimelineCompact
                batches={project.batches}
                currentBatchTitle={health.currentBatch?.title ?? null}
                batchProgress={`${health.completedCount}/${health.totalBatches}`}
                batchStatus={health.batchStatus}
                projectId={project.id}
              />
              {health.batchStatus === "overdue" && (
                <span className="flex items-center gap-1 rounded-full bg-red/10 border border-red/20 px-2 py-0.5 text-[9px] font-semibold text-red">
                  {health.overdueDays}d overdue
                </span>
              )}
              {(dStatus === "open" || dStatus === "confirmed") && (
                <span className="flex items-center gap-1 rounded-full bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-[9px] font-semibold text-amber-400">
                  Disputed
                </span>
              )}
            </div>
          );
        })()}
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════
// DISCOVER PAGE
// ═══════════════════════════════════════════

export default function DiscoverPage() {
  const [projects, setProjects] = useState<ProjectStock[]>([]);
  const [prefs, setPrefs] = useState<Preferences | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [invested, setInvested] = useState<string[]>([]);
  const [skipped, setSkipped] = useState<string[]>([]);

  useEffect(() => {
    apiGetProjects().then(setProjects).catch(() => setProjects([]));
  }, []);

  const sortedProjects = useMemo(() => {
    if (!prefs) return projects;
    return [...projects].sort((a, b) => computeMatchScore(b, prefs) - computeMatchScore(a, prefs));
  }, [prefs]);

  const currentProject = sortedProjects[currentIndex % sortedProjects.length];
  const matchScore = prefs && currentProject ? computeMatchScore(currentProject, prefs) : 50;

  const handleSwipe = useCallback((direction: "left" | "right") => {
    if (!currentProject) return;
    if (direction === "right") setInvested((p) => [...p, currentProject.id]);
    else setSkipped((p) => [...p, currentProject.id]);
    setCurrentIndex((p) => p + 1);
  }, [currentProject]);

  if (!prefs) {
    return <PreferenceWizard onComplete={setPrefs} />;
  }

  return (
    <section className="py-4 sm:py-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Discover</h1>
          <p className="text-sm text-muted mt-0.5">Personalized for you</p>
        </div>
        <button onClick={() => { setPrefs(null); setCurrentIndex(0); setInvested([]); setSkipped([]); }} className="flex items-center gap-1.5 rounded-xl border border-card-border bg-card/50 px-3 py-2 text-xs font-medium text-muted hover:text-foreground hover:border-card-border transition">
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" /></svg>
          Preferences
        </button>
      </motion.div>

      {/* Stats bar */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="flex items-center justify-center gap-6 sm:gap-8 mb-6 sm:mb-8">
        <div className="text-center">
          <p className="text-lg sm:text-xl font-bold text-gain tabular-nums">{invested.length}</p>
          <p className="text-[10px] text-muted">Invested</p>
        </div>
        <div className="h-8 w-px bg-card-border/50" />
        <div className="text-center">
          <p className="text-lg sm:text-xl font-bold text-muted tabular-nums">{skipped.length}</p>
          <p className="text-[10px] text-muted">Skipped</p>
        </div>
        <div className="h-8 w-px bg-card-border/50" />
        <div className="text-center">
          <p className="text-lg sm:text-xl font-bold text-foreground tabular-nums">{sortedProjects.length - currentIndex % sortedProjects.length}</p>
          <p className="text-[10px] text-muted">Remaining</p>
        </div>
      </motion.div>

      {/* Swipe area */}
      <div className="relative flex flex-col items-center">
        <AnimatePresence mode="wait">
          {currentProject && (
            <SwipeCard key={currentProject.id + currentIndex} project={currentProject} matchScore={matchScore} onSwipe={handleSwipe} />
          )}
        </AnimatePresence>

        {/* Action buttons */}
        <div className="flex items-center gap-5 sm:gap-8 mt-6 sm:mt-8">
          <motion.button whileTap={{ scale: 0.85 }} onClick={() => handleSwipe("left")} className="flex h-14 w-14 items-center justify-center rounded-2xl border border-loss/20 bg-loss/[0.06] text-loss transition hover:border-loss/40 hover:bg-loss/10 shadow-lg shadow-loss/5">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </motion.button>

          <Link href={`/trade/${currentProject?.id || ""}`}>
            <motion.div whileTap={{ scale: 0.9 }} className="flex h-10 w-10 items-center justify-center rounded-xl border border-accent/20 bg-accent/[0.06] text-accent-light transition hover:border-accent/40 hover:bg-accent/10">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" /></svg>
            </motion.div>
          </Link>

          <motion.button whileTap={{ scale: 0.85 }} onClick={() => handleSwipe("right")} className="flex h-14 w-14 items-center justify-center rounded-2xl border border-gain/20 bg-gain/[0.06] text-gain transition hover:border-gain/40 hover:bg-gain/10 shadow-lg shadow-gain/5">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
          </motion.button>
        </div>

        <p className="mt-4 text-[11px] text-muted/40">Swipe right to invest · Swipe left to skip</p>
      </div>
    </section>
  );
}
