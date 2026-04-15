"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { apiGetNotifications } from "@/lib/api-client";
import type { Notification } from "@/lib/social";

const filters = [
  { label: "All", value: "all" },
  { label: "Investments", value: "investment" },
  { label: "Social", value: "social" },
  { label: "Milestones", value: "milestone" },
  { label: "Alerts", value: "alert" },
] as const;

type FilterValue = (typeof filters)[number]["value"];

const container = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.055, ease: "easeOut" as const },
  },
};

const listItem = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: "easeOut" as const },
  },
};

const listPresence = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.25, ease: "easeOut" as const } },
  exit: { opacity: 0, transition: { duration: 0.18, ease: "easeOut" as const } },
};

function filterByType(items: Notification[], filter: FilterValue): Notification[] {
  if (filter === "all") return items;
  return items.filter((n) => n.type === filter);
}

function typeIconWrapClass(type: Notification["type"]): string {
  switch (type) {
    case "investment":
      return "bg-gain/10 text-gain";
    case "social":
      return "bg-accent/10 text-accent-light";
    case "milestone":
      return "bg-amber-500/10 text-amber-400";
    case "alert":
      return "bg-cyan-500/10 text-cyan-400";
    default:
      return "bg-card text-muted";
  }
}

function NotificationGlyph({ n }: { n: Notification }) {
  const stroke = 1.75;
  const common = { width: 20, height: 20, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: stroke, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

  if (n.type === "investment") {
    if (n.icon === "trending_down") {
      return (
        <svg {...common}>
          <polyline points="3 8 9 14 13 10 21 16" />
          <path d="M17 16h4v4" />
        </svg>
      );
    }
    if (n.icon === "check_circle") {
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M8 12l2.5 2.5L16 9" />
        </svg>
      );
    }
    return (
      <svg {...common}>
        <polyline points="3 17 9 11 13 15 21 7" />
        <path d="M17 7h4v4" />
      </svg>
    );
  }

  if (n.type === "social") {
    if (n.icon === "person_add") {
      return (
        <svg {...common}>
          <circle cx="9" cy="8" r="3" />
          <path d="M4 20v-1a5 5 0 015-5h0a4 4 0 014 4" />
          <path d="M20 8v6M17 11h6" />
        </svg>
      );
    }
    if (n.icon === "thumb_up") {
      return (
        <svg {...common}>
          <path d="M7 10v12M15 5.88L14 10h5.83a2 2 0 011.92 2.56l-2.33 8A2 2 0 0117.5 22H4a2 2 0 01-2-2v-8a2 2 0 012-2h2.76a2 2 0 001.79-1.11L12 2h0a3.13 3.13 0 012.91 3.08V10" />
        </svg>
      );
    }
    if (n.icon === "comment") {
      return (
        <svg {...common}>
          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
        </svg>
      );
    }
    if (n.icon === "share") {
      return (
        <svg {...common}>
          <circle cx="18" cy="5" r="3" />
          <circle cx="6" cy="12" r="3" />
          <circle cx="18" cy="19" r="3" />
          <path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 4.02" />
        </svg>
      );
    }
    return (
      <svg {...common}>
        <circle cx="9" cy="8" r="3" />
        <path d="M4 20v-1a5 5 0 015-5h0a4 4 0 014 4" />
      </svg>
    );
  }

  if (n.type === "milestone") {
    if (n.icon === "group") {
      return (
        <svg {...common}>
          <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
        </svg>
      );
    }
    return (
      <svg {...common}>
        <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
        <path d="M4 22v-7" />
      </svg>
    );
  }

  if (n.icon === "notifications" || n.icon === "bell") {
    return (
      <svg {...common}>
        <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <path d="M12 2l2.4 7.4h7.6l-6 4.6 2.3 7-6-4.6-6 4.6 2.3-7-6-4.6h7.6L12 2z" />
    </svg>
  );
}

export default function NotificationsPage() {
  const [items, setItems] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<FilterValue>("all");

  useEffect(() => {
    apiGetNotifications("demo").then(setItems).catch(() => setItems([]));
  }, []);

  const list = useMemo(() => filterByType(items, filter), [items, filter]);

  function markAllRead() {
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  return (
    <section className="py-8 pb-16">
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" as const }}
        className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
          <p className="mt-1 text-muted">Activity across your portfolio and network</p>
        </div>
        <button
          type="button"
          onClick={markAllRead}
          className="shrink-0 self-start text-sm font-medium text-accent transition hover:text-accent-light sm:self-auto"
        >
          Mark all as read
        </button>
      </motion.div>

      <div className="mt-6 flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setFilter(f.value)}
            className={`relative rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              filter === f.value
                ? "text-white"
                : "border border-card-border bg-card text-muted hover:text-foreground"
            }`}
          >
            {filter === f.value && (
              <motion.span
                layoutId="notif-pill"
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
          key={filter}
          variants={listPresence}
          initial="initial"
          animate="animate"
          exit="exit"
          className="mt-8"
        >
          {list.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: "easeOut" as const }}
              className="glass-card px-6 py-14 text-center"
            >
              <p className="font-medium text-foreground">No notifications here</p>
              <p className="mt-1 text-sm text-muted">Try another filter or check back later.</p>
            </motion.div>
          ) : (
            <motion.ul
              variants={container}
              initial="hidden"
              animate="show"
              className="flex flex-col gap-3"
            >
              {list.map((n) => (
                <motion.li key={n.id} variants={listItem} layout>
                  <div
                    className={`glass-card flex gap-4 rounded-xl p-4 transition-colors hover:bg-white/[0.02] ${
                      !n.read ? "border-l-2 border-l-accent bg-white/[0.03]" : ""
                    }`}
                  >
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${typeIconWrapClass(
                        n.type,
                      )}`}
                      aria-hidden
                    >
                      <NotificationGlyph n={n} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium leading-snug text-foreground">{n.message}</p>
                      <p className="mt-0.5 text-sm text-muted">{n.detail}</p>
                    </div>
                    <time className="shrink-0 text-xs tabular-nums text-muted" dateTime={n.timeAgo}>
                      {n.timeAgo}
                    </time>
                  </div>
                </motion.li>
              ))}
            </motion.ul>
          )}
        </motion.div>
      </AnimatePresence>
    </section>
  );
}
