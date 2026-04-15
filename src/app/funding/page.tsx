"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { fundingProjects } from "@/lib/data";

const fmt = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};

const item = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" as const } },
};

const gradients = [
  "from-indigo-500 to-purple-500",
  "from-cyan-500 to-blue-500",
  "from-emerald-500 to-teal-500",
  "from-rose-500 to-pink-500",
  "from-amber-500 to-orange-500",
];

export default function FundingPage() {
  const [fundedIds, setFundedIds] = useState<Set<string>>(new Set());

  function handleFund(id: string) {
    setFundedIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
    setTimeout(() => {
      setFundedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, 1500);
  }

  return (
    <section className="py-8">
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold tracking-tight">Fund Innovation</h1>
        <p className="mt-1 text-muted">Back projects, earn rewards</p>
      </motion.div>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2"
      >
        {fundingProjects.map((project, i) => {
          const pct = Math.min((project.raised / project.goal) * 100, 100);
          const funded = fundedIds.has(project.id);
          const grad = gradients[i % gradients.length];

          return (
            <motion.div key={project.id} variants={item}>
              <div className="glass-card flex flex-col gap-5 p-6">
                {/* Header */}
                <div className="flex items-start gap-4">
                  <div
                    className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${grad} text-lg font-bold text-white shadow-lg`}
                  >
                    {project.image}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-lg font-semibold text-foreground">
                      {project.title}
                    </h3>
                    <p className="mt-0.5 line-clamp-2 text-sm text-muted">
                      {project.description}
                    </p>
                  </div>
                </div>

                {/* Progress */}
                <div className="space-y-2">
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-card-border">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-accent-light">
                      {pct.toFixed(1)}%
                    </span>
                    <span className="text-muted">
                      {fmt.format(project.raised)} raised of{" "}
                      {fmt.format(project.goal)} goal
                    </span>
                  </div>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-6 text-sm text-muted">
                  <span className="flex items-center gap-1.5">
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z"
                      />
                    </svg>
                    <span className="font-medium text-foreground">
                      {project.backers.toLocaleString("en-IN")}
                    </span>{" "}
                    backers
                  </span>
                  <span className="flex items-center gap-1.5">
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                      />
                    </svg>
                    <span className="font-medium text-foreground">
                      {project.daysLeft}
                    </span>{" "}
                    days left
                  </span>
                </div>

                {/* Reward badge */}
                <div className="flex items-start gap-2 rounded-xl bg-card/80 px-4 py-3 ring-1 ring-card-border">
                  <svg
                    className="mt-0.5 h-4 w-4 shrink-0 text-accent-light"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M21 11.25v8.25a1.5 1.5 0 0 1-1.5 1.5H5.25a1.5 1.5 0 0 1-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 1 0 9.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1 1 14.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z"
                    />
                  </svg>
                  <span className="text-sm text-foreground/80">
                    {project.reward}
                  </span>
                </div>

                {/* Fund button */}
                <AnimatePresence mode="wait">
                  {funded ? (
                    <motion.div
                      key="funded"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="flex w-full items-center justify-center gap-2 rounded-lg bg-gain/20 py-3 text-sm font-semibold text-gain"
                    >
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="m4.5 12.75 6 6 9-13.5"
                        />
                      </svg>
                      Funded!
                    </motion.div>
                  ) : (
                    <motion.button
                      key="fund"
                      whileTap={{ scale: 0.97 }}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => handleFund(project.id)}
                      className="w-full cursor-pointer rounded-lg bg-accent py-3 text-sm font-semibold text-white transition-colors hover:bg-accent-light"
                    >
                      Fund Now
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </section>
  );
}
