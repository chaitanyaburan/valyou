"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { apiGetCoupons } from "@/lib/api-client";
import type { Coupon } from "@/lib/data";
import { useWalletUserId } from "@/contexts/AuthContext";

const filters = ["All", "Active", "Used", "Expired"] as const;
type Filter = (typeof filters)[number];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};

const item = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } },
};

function filterCoupons(items: Coupon[], filter: Filter): Coupon[] {
  if (filter === "All") return items;
  return items.filter(
    (c) => c.status === filter.toLowerCase(),
  );
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const statusConfig = {
  active: {
    label: "Active",
    bg: "bg-gain/15",
    text: "text-gain",
    ring: "ring-1 ring-accent/30",
    dim: "",
  },
  used: {
    label: "Used",
    bg: "bg-muted/15",
    text: "text-muted",
    ring: "",
    dim: "opacity-60",
  },
  expired: {
    label: "Expired",
    bg: "bg-loss/15",
    text: "text-loss",
    ring: "",
    dim: "opacity-60",
  },
} as const;

export default function RewardsPage() {
  const walletUserId = useWalletUserId();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [active, setActive] = useState<Filter>("All");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    apiGetCoupons(walletUserId).then(setCoupons).catch(() => setCoupons([]));
  }, [walletUserId]);

  const list = useMemo(() => filterCoupons(coupons, active), [active, coupons]);
  const activeCount = useMemo(() => coupons.filter((c) => c.status === "active").length, [coupons]);
  const inactiveCount = coupons.length - activeCount;

  function handleCopy(id: string, code: string) {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  }

  return (
    <section className="py-8">
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold tracking-tight">Rewards</h1>
        <p className="mt-1 text-muted">Your earned perks and coupons</p>
      </motion.div>

      {/* Summary stats */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="mt-6 grid grid-cols-3 gap-4"
      >
        <div className="glass-card flex flex-col items-center justify-center p-4">
          <span className="text-2xl font-bold text-foreground">
            {coupons.length}
          </span>
          <span className="mt-0.5 text-xs text-muted">Total Rewards</span>
        </div>
        <div className="glass-card flex flex-col items-center justify-center p-4">
          <span className="text-2xl font-bold text-gain">{activeCount}</span>
          <span className="mt-0.5 text-xs text-muted">Active</span>
        </div>
        <div className="glass-card flex flex-col items-center justify-center p-4">
          <span className="text-2xl font-bold text-muted">{inactiveCount}</span>
          <span className="mt-0.5 text-xs text-muted">Used / Expired</span>
        </div>
      </motion.div>

      {/* Filter pills */}
      <div className="mt-6 flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setActive(f)}
            className={`relative rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              active === f
                ? "text-white"
                : "border border-card-border bg-card text-muted hover:text-foreground"
            }`}
          >
            {active === f && (
              <motion.span
                layoutId="reward-pill"
                className="absolute inset-0 rounded-full bg-accent"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-10">{f}</span>
          </button>
        ))}
      </div>

      {/* Coupons grid */}
      <AnimatePresence mode="wait">
        <motion.div
          key={active}
          variants={container}
          initial="hidden"
          animate="show"
          exit="exit"
          className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2"
        >
          {list.map((coupon) => {
            const cfg = statusConfig[coupon.status];
            const copied = copiedId === coupon.id;

            return (
              <motion.div key={coupon.id} variants={item} layout>
                <div
                  className={`glass-card relative flex flex-col gap-3 p-5 ${cfg.ring} ${cfg.dim}`}
                >
                  {/* Status badge */}
                  <span
                    className={`absolute right-4 top-4 rounded-full px-2.5 py-0.5 text-xs font-semibold ${cfg.bg} ${cfg.text}`}
                  >
                    {cfg.label}
                  </span>

                  {/* Coupon code */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopy(coupon.id, coupon.code)}
                      className="relative cursor-pointer rounded bg-accent/10 px-3 py-1 font-mono text-sm font-semibold text-accent transition-colors hover:bg-accent/20"
                    >
                      {coupon.code}
                      <AnimatePresence>
                        {copied && (
                          <motion.span
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: -28 }}
                            exit={{ opacity: 0 }}
                            className="absolute -top-1 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-gain/90 px-2 py-0.5 text-xs font-medium text-white"
                          >
                            Copied!
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </button>
                    <svg
                      className="h-4 w-4 text-muted"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H9.75"
                      />
                    </svg>
                  </div>

                  {/* Title & discount */}
                  <div>
                    <h3 className="font-semibold text-foreground">
                      {coupon.title}
                    </h3>
                    <p className="mt-0.5 text-lg font-bold text-accent-light">
                      {coupon.discount}
                    </p>
                  </div>

                  {/* Source & expiry */}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted">{coupon.source}</span>
                    <span className="text-muted">
                      Expires {fmtDate(coupon.expiresAt)}
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </AnimatePresence>
    </section>
  );
}
