"use client";

import { useState, useCallback } from "react";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useTransform,
} from "framer-motion";
import { projects } from "@/lib/data";
import type { ProjectStock } from "@/lib/data";
import Avatar from "@/components/Avatar";
import PriceChange from "@/components/PriceChange";
import SparklineChart from "@/components/SparklineChart";

const categoryMap: Record<string, string> = {
  "AI / SaaS": "AI",
  "Design / Tools": "Tools",
  "Blockchain / HR Tech": "Web3",
  "EdTech / AI": "AI",
  "DevOps / Tools": "Tools",
  "AI / HR Tech": "AI",
  "DeFi / Blockchain": "Web3",
  "Infrastructure / DB": "Infra",
};

const filters = [
  { label: "All", value: "all" },
  { label: "AI", value: "AI" },
  { label: "Web3", value: "Web3" },
  { label: "Tools", value: "Tools" },
  { label: "Infra", value: "Infra" },
] as const;

type FilterValue = (typeof filters)[number]["value"];

const SWIPE_THRESHOLD = 100;

const fmtPrice = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 });

function getFiltered(filter: FilterValue): ProjectStock[] {
  if (filter === "all") return projects;
  return projects.filter((p) => categoryMap[p.category] === filter);
}

export default function DiscoverPage() {
  const [active, setActive] = useState<FilterValue>("all");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [exitDirection, setExitDirection] = useState<"left" | "right" | null>(null);

  const list = getFiltered(active);
  const currentProject = list[currentIndex % list.length];

  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-10, 10]);
  const skipOpacity = useTransform(x, [-150, -50, 0], [1, 0.5, 0]);
  const investOpacity = useTransform(x, [0, 50, 150], [0, 0.5, 1]);

  const advance = useCallback(
    (direction: "left" | "right") => {
      setExitDirection(direction);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % list.length);
        setExitDirection(null);
      }, 300);
    },
    [list.length]
  );

  const handleFilterChange = (filter: FilterValue) => {
    setActive(filter);
    setCurrentIndex(0);
    setExitDirection(null);
  };

  const fundedPct = currentProject ? Math.round((currentProject.fundingRaised / currentProject.fundingGoal) * 100) : 0;

  return (
    <section className="py-8">
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <h1 className="text-3xl font-bold tracking-tight">Discover</h1>
        <p className="mt-1 text-muted">Find your next project to invest in</p>
      </motion.div>

      <div className="mt-6 flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f.value}
            onClick={() => handleFilterChange(f.value)}
            className={`relative rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${active === f.value ? "text-white" : "border border-card-border bg-card text-muted hover:text-foreground"}`}
          >
            {active === f.value && (
              <motion.span layoutId="discover-pill" className="absolute inset-0 rounded-full bg-accent" transition={{ type: "spring", stiffness: 400, damping: 30 }} />
            )}
            <span className="relative z-10">{f.label}</span>
          </button>
        ))}
      </div>

      <div className="relative mt-10 flex flex-col items-center">
        <AnimatePresence mode="wait">
          {currentProject && !exitDirection && (
            <motion.div
              key={currentProject.id + currentIndex}
              className="glass-card relative mx-auto w-full max-w-sm cursor-grab overflow-hidden active:cursor-grabbing"
              style={{ x, rotate, minHeight: 480 }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.8}
              onDragEnd={(_, info) => {
                if (info.offset.x < -SWIPE_THRESHOLD) advance("left");
                else if (info.offset.x > SWIPE_THRESHOLD) advance("right");
              }}
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{
                opacity: 0,
                x: exitDirection === "left" ? -300 : 300,
                rotate: exitDirection === "left" ? -15 : 15,
                transition: { duration: 0.3, ease: "easeOut" as const },
              }}
              transition={{ duration: 0.4, ease: "easeOut" as const }}
            >
              <motion.div className="pointer-events-none absolute left-6 top-8 z-20 rounded-lg border-2 border-loss px-4 py-2 text-xl font-black tracking-wider text-loss" style={{ opacity: skipOpacity, rotate: -12 }}>SKIP</motion.div>
              <motion.div className="pointer-events-none absolute right-6 top-8 z-20 rounded-lg border-2 border-gain px-4 py-2 text-xl font-black tracking-wider text-gain" style={{ opacity: investOpacity, rotate: 12 }}>INVEST</motion.div>

              <div className={`h-24 bg-gradient-to-br ${currentProject.coverGradient} flex items-center justify-center`}>
                <svg className="h-10 w-10 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d={currentProject.coverIcon} /></svg>
              </div>

              <div className="flex flex-col items-center px-6 pb-6">
                <div className="-mt-6 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-sm font-bold text-white shadow-lg">
                  {currentProject.title.split(" ").map(w => w[0]).join("").slice(0, 2)}
                </div>

                <h2 className="mt-3 text-xl font-bold text-center">{currentProject.title}</h2>
                <p className="text-xs text-accent-light font-medium">{currentProject.tagline}</p>

                <div className="mt-2 flex items-center gap-2">
                  <Avatar initials={currentProject.creator.avatar} size="xs" />
                  <span className="text-xs text-muted">{currentProject.creator.name}</span>
                  <span className="rounded-full bg-accent/20 px-2 py-0.5 text-[10px] font-semibold text-accent-light">Score: {currentProject.creator.score}</span>
                </div>

                <div className="mt-4 flex items-center gap-3">
                  <span className="text-lg font-bold tabular-nums">{fmtPrice.format(currentProject.price)} <span className="text-xs text-muted">VALU</span></span>
                  <PriceChange value={currentProject.change} percent={currentProject.changePercent} />
                </div>

                <div className="mt-3 w-full">
                  <SparklineChart data={currentProject.sparkline} positive={currentProject.change >= 0} />
                </div>

                <div className="mt-4 w-full">
                  <div className="flex items-center justify-between text-xs"><span className="text-muted">Funding</span><span className="font-semibold text-foreground">{fundedPct}%</span></div>
                  <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-card-border">
                    <motion.div className="h-full rounded-full bg-accent" initial={{ width: 0 }} animate={{ width: `${fundedPct}%` }} transition={{ duration: 0.8, ease: "easeOut" as const, delay: 0.3 }} />
                  </div>
                  <div className="mt-1 flex items-center justify-between text-[10px] text-muted">
                    <span>{currentProject.backers.toLocaleString()} backers</span>
                    <span>{currentProject.daysLeft} days left</span>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  {currentProject.tags.map((tag) => (
                    <span key={tag} className="rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent-light">{tag}</span>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-8 flex items-center gap-8">
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => advance("left")} className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-loss/60 bg-loss/10 text-loss transition-colors hover:border-loss hover:bg-loss/20">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </motion.button>
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => advance("right")} className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-gain/60 bg-gain/10 text-gain transition-colors hover:border-gain hover:bg-gain/20">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
          </motion.button>
        </div>
        <p className="mt-4 text-xs text-muted">Swipe right to invest · Swipe left to skip</p>
      </div>
    </section>
  );
}
