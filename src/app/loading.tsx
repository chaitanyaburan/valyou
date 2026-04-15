"use client";

import { motion } from "framer-motion";

export default function Loading() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="py-8 space-y-6"
    >
      <div className="grid gap-4 sm:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="glass-card p-6 h-28">
            <div className="skeleton h-3 w-24 mb-4" />
            <div className="skeleton h-7 w-32" />
          </div>
        ))}
      </div>
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="glass-card p-4 h-36">
            <div className="flex items-center gap-3 mb-3">
              <div className="skeleton h-8 w-8 rounded-full" />
              <div>
                <div className="skeleton h-3 w-20 mb-1" />
                <div className="skeleton h-2 w-14" />
              </div>
            </div>
            <div className="skeleton h-4 w-16 mb-2" />
            <div className="skeleton h-8 w-full" />
          </div>
        ))}
      </div>
    </motion.div>
  );
}
