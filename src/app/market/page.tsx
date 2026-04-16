"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import type { ProjectStock } from "@/lib/data";
import { useMergedProjects } from "@/hooks/useMergedProjects";
import Avatar from "@/components/Avatar";
import PriceChange from "@/components/PriceChange";
import SparklineChart from "@/components/SparklineChart";
import { formatAlgo } from "@/lib/algo";

const filters = [
  { label: "All", value: "all" },
  { label: "Top Performers", value: "top" },
  { label: "Trending", value: "trending" },
  { label: "New Listings", value: "new" },
] as const;

type FilterValue = (typeof filters)[number]["value"];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

const item = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } },
};

function filtered(projects: ProjectStock[], filter: FilterValue): ProjectStock[] {
  if (filter === "all") return projects;
  return projects.filter((p) => p.filterCategory === filter);
}

export default function MarketPage() {
  const projects = useMergedProjects();
  const [active, setActive] = useState<FilterValue>("all");
  const list = useMemo(() => filtered(projects, active), [projects, active]);
  const [postedBanner, setPostedBanner] = useState<{ show: boolean; title: string | null }>(() => {
    if (typeof window === "undefined") return { show: false, title: null };
    const q = new URLSearchParams(window.location.search);
    return q.get("posted") === "1" ? { show: true, title: q.get("title") } : { show: false, title: null };
  });

  return (
    <section className="py-8">
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold tracking-tight">Market</h1>
        <p className="mt-1 text-muted">Invest in projects that matter</p>
      </motion.div>

      {postedBanner.show && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-5 flex flex-col gap-3 rounded-xl border border-gain/25 bg-gain/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <p className="text-sm text-foreground/90">
            <span className="font-semibold text-gain">Listing published.</span>{" "}
            {postedBanner.title ? `“${postedBanner.title}” is live on the market.` : "Your project is live on the market."}
          </p>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/post-project"
              className="inline-flex rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-accent/90"
            >
              Post another
            </Link>
            <button
              type="button"
              onClick={() => {
                setPostedBanner({ show: false, title: null });
                window.history.replaceState({}, "", "/market");
              }}
              className="rounded-lg border border-card-border px-3 py-1.5 text-xs font-medium text-muted hover:bg-card"
            >
              Dismiss
            </button>
          </div>
        </motion.div>
      )}

      <div className="mt-6 flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f.value}
            onClick={() => setActive(f.value)}
            className={`relative rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              active === f.value
                ? "text-white"
                : "border border-card-border bg-card text-muted hover:text-foreground"
            }`}
          >
            {active === f.value && (
              <motion.span
                layoutId="pill"
                className="absolute inset-0 rounded-full bg-accent"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-10">{f.label}</span>
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={active}
          variants={container}
          initial="hidden"
          animate="show"
          exit="exit"
          className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
        >
          {list.map((project) => (
            <motion.div key={project.id} variants={item}>
              <Link href={`/trade/${project.id}`} className="block">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="glass-card flex flex-col gap-3 p-5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${project.coverGradient}`}>
                        <svg className="h-5 w-5 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d={project.coverIcon} />
                        </svg>
                      </div>
                      <div>
                        <p className="font-semibold leading-tight">{project.title}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Avatar initials={project.creator.avatar} size="xs" />
                          <p className="text-xs text-muted">{project.creator.name}</p>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="flex items-center justify-end gap-1 text-lg font-bold tabular-nums">
                        {formatAlgo(project.price, 2)}
                      </p>
                      <PriceChange value={project.change} percent={project.changePercent} />
                    </div>
                  </div>

                  <div className="min-h-[40px] min-w-0 w-full">
                    <SparklineChart data={project.sparkline} positive={project.change >= 0} />
                  </div>

                  <div className="flex justify-between text-xs text-muted">
                    <span>Vol {project.volume}</span>
                    <span>MCap {project.marketCap}</span>
                    <span>{project.backers.toLocaleString()} backers</span>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {project.tags.map((tag) => (
                      <span key={tag} className="rounded-full bg-card border border-card-border px-2 py-0.5 text-[10px] font-medium text-muted">{tag}</span>
                    ))}
                  </div>
                </motion.div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </AnimatePresence>
    </section>
  );
}
