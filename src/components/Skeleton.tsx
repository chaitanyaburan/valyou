"use client";

import { motion } from "framer-motion";

const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: 0.3 },
};

export function CardSkeleton() {
  return (
    <motion.div {...fadeIn} className="glass-card p-6 h-32">
      <div className="skeleton h-4 w-1/3 mb-4" />
      <div className="skeleton h-6 w-1/2 mb-3" />
      <div className="skeleton h-3 w-2/3" />
    </motion.div>
  );
}

export function TableRowSkeleton() {
  return (
    <motion.div
      {...fadeIn}
      className="flex items-center gap-4 h-16 px-4 border-b border-card-border"
    >
      <div className="skeleton h-4 w-1/4" />
      <div className="skeleton h-4 w-1/4" />
      <div className="skeleton h-4 w-1/4" />
      <div className="skeleton h-4 w-1/4" />
    </motion.div>
  );
}

export function ChartSkeleton() {
  return (
    <motion.div {...fadeIn} className="glass-card p-6 h-80">
      <div className="skeleton h-4 w-1/4 mb-6" />
      <div className="skeleton h-full w-full rounded-lg" />
    </motion.div>
  );
}
