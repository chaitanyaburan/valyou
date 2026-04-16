"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { apiGetFunding } from "@/lib/api-client";
import type { FundingProject } from "@/lib/data";
import { addFundingPledge, loadFundingPledges, totalPledgedAcrossProjects } from "@/lib/funding-pledges";

const INR_HINT = 89;

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
};

const gradients = [
  "from-indigo-500 to-purple-600",
  "from-cyan-500 to-blue-600",
  "from-emerald-500 to-teal-600",
  "from-rose-500 to-pink-600",
  "from-amber-500 to-orange-600",
];

type FilterKey = "all" | "ending" | "almost";

function formatInrFull(n: number): string {
  const v = Math.round(n);
  if (!Number.isFinite(v)) return "₹0";
  return `₹${v.toLocaleString("en-IN")}`;
}

function formatInrShort(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return "₹0";
  if (n >= 1e7) return `₹${(n / 1e7).toFixed(2)} Cr`;
  if (n >= 1e5) return `₹${(n / 1e5).toFixed(2)} L`;
  return formatInrFull(n);
}

function normalizeFunding(raw: unknown[]): FundingProject[] {
  return raw.flatMap((row) => {
    const r = row as Record<string, unknown>;
    const id =
      typeof r.id === "string" && r.id
        ? r.id
        : r._id != null
          ? String(r._id)
          : "";
    if (!id) return [];
    const project: FundingProject = {
      id,
      title: String(r.title ?? ""),
      description: String(r.description ?? ""),
      goal: Number(r.goal) || 0,
      raised: Number(r.raised) || 0,
      backers: Number(r.backers) || 0,
      reward: String(r.reward ?? ""),
      daysLeft: Number(r.daysLeft) || 0,
      image: String(r.image ?? "?"),
      segment: r.segment === "other" ? "other" : "startup",
    };
    if (!project.title) return [];
    return [project];
  });
}

const PRESET_INR = [2_500, 5_000, 10_000, 25_000] as const;

export default function FundingPage() {
  const [fundingProjects, setFundingProjects] = useState<FundingProject[]>([]);
  const [pledges, setPledges] = useState<Record<string, number>>({});
  const [filter, setFilter] = useState<FilterKey>("all");
  const [toast, setToast] = useState<string | null>(null);
  const [modalProject, setModalProject] = useState<FundingProject | null>(null);
  const [pledgeInput, setPledgeInput] = useState("");
  const [justFundedId, setJustFundedId] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 3200);
  }, []);

  useEffect(() => {
    const t = window.setTimeout(() => {
      void apiGetFunding()
        .then((rows) => setFundingProjects(normalizeFunding(Array.isArray(rows) ? rows : [])))
        .catch(() => setFundingProjects([]));
    }, 0);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    const t = window.setTimeout(() => setPledges(loadFundingPledges()), 0);
    return () => window.clearTimeout(t);
  }, []);

  const raisedWithPledges = useCallback(
    (p: FundingProject) => p.raised + (pledges[p.id] ?? 0),
    [pledges],
  );

  const filtered = useMemo(() => {
    let list = [...fundingProjects];
    if (filter === "ending") list = list.filter((p) => p.daysLeft <= 14);
    if (filter === "almost") {
      list = list.filter((p) => {
        const r = raisedWithPledges(p);
        const pct = p.goal > 0 ? (r / p.goal) * 100 : 0;
        return pct >= 65 && pct < 100;
      });
    }
    list.sort((a, b) => {
      const pa = a.goal > 0 ? (raisedWithPledges(a) / a.goal) * 100 : 0;
      const pb = b.goal > 0 ? (raisedWithPledges(b) / b.goal) * 100 : 0;
      if (Math.abs(pb - pa) > 5) return pb - pa;
      return a.daysLeft - b.daysLeft;
    });
    return list;
  }, [fundingProjects, filter, raisedWithPledges]);

  const stats = useMemo(() => {
    const totalGoal = fundingProjects.reduce((s, p) => s + p.goal, 0);
    const totalRaisedBase = fundingProjects.reduce((s, p) => s + p.raised, 0);
    const extra = totalPledgedAcrossProjects(pledges);
    const backers = fundingProjects.reduce((s, p) => s + p.backers, 0);
    return {
      campaigns: fundingProjects.length,
      totalGoal,
      totalRaised: totalRaisedBase + extra,
      backers,
      yourPledges: extra,
    };
  }, [fundingProjects, pledges]);

  const openContribute = (p: FundingProject) => {
    setModalProject(p);
    setPledgeInput(String(PRESET_INR[1]));
  };

  const submitPledge = () => {
    if (!modalProject) return;
    const amt = parseFloat(pledgeInput.replace(/,/g, ""));
    if (!Number.isFinite(amt) || amt < 500) {
      showToast("Minimum contribution is ₹500");
      return;
    }
    const current = raisedWithPledges(modalProject);
    const remaining = Math.max(0, modalProject.goal - current);
    if (remaining <= 0) {
      showToast("This campaign is already fully funded");
      setModalProject(null);
      return;
    }
    const capped = Math.min(amt, remaining, 5_000_000);
    addFundingPledge(modalProject.id, capped);
    setPledges(loadFundingPledges());
    setJustFundedId(modalProject.id);
    window.setTimeout(() => setJustFundedId(null), 2000);
    if (capped < amt) {
      showToast(`Pledged ${formatInrFull(capped)} (capped at remaining goal) to ${modalProject.title}`);
    } else {
      showToast(`You pledged ${formatInrFull(capped)} to ${modalProject.title}`);
    }
    setModalProject(null);
  };

  return (
    <section className="py-6 sm:py-8">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="relative overflow-hidden rounded-2xl border border-card-border bg-gradient-to-br from-[#0c1028] via-background to-[#12081c] px-5 py-7 sm:px-8 sm:py-9"
      >
        <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-accent/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-1/4 h-48 w-48 rounded-full bg-purple-500/10 blur-3xl" />
        <div className="relative max-w-3xl space-y-3">
          <span className="inline-flex rounded-full border border-accent/25 bg-accent/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-accent-light">
            Crowdfunding · startups only
          </span>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Back startups on Valyou</h1>
          <p className="text-sm text-muted sm:text-base">
            Pledge INR toward live campaigns. Funds help builders ship milestones; perks are community access and transparency—not
            shopping coupons. When a team lists on the market, you can trade there too.
          </p>
          <div className="flex flex-wrap gap-2 pt-2">
            <Link
              href="/post-project"
              className="inline-flex rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-accent/90"
            >
              Start a campaign
            </Link>
            <Link
              href="/market"
              className="inline-flex rounded-xl border border-card-border bg-card/50 px-4 py-2.5 text-sm font-semibold text-foreground transition hover:border-accent/40"
            >
              Browse market
            </Link>
          </div>
        </div>
      </motion.div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-card-border bg-card/40 px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">Live campaigns</p>
          <p className="mt-1 text-xl font-bold tabular-nums">{stats.campaigns}</p>
        </div>
        <div className="rounded-xl border border-card-border bg-card/40 px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">Raised (incl. your pledges)</p>
          <p className="mt-1 text-xl font-bold tabular-nums text-gain">{formatInrShort(stats.totalRaised)}</p>
        </div>
        <div className="rounded-xl border border-card-border bg-card/40 px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">Backers (all campaigns)</p>
          <p className="mt-1 text-xl font-bold tabular-nums">{stats.backers.toLocaleString("en-IN")}</p>
        </div>
        <div className="rounded-xl border border-card-border bg-card/40 px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">Your pledges (this browser)</p>
          <p className="mt-1 text-xl font-bold tabular-nums text-accent-light">{formatInrShort(stats.yourPledges)}</p>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        {(
          [
            { key: "all" as const, label: "All campaigns" },
            { key: "ending" as const, label: "Ending soon" },
            { key: "almost" as const, label: "Almost funded" },
          ] as const
        ).map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
              filter === f.key ? "bg-accent text-white" : "border border-card-border bg-card/50 text-muted hover:text-foreground"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2"
      >
        {fundingProjects.length === 0 && (
          <div className="col-span-full rounded-xl border border-dashed border-card-border bg-card/30 px-6 py-10 text-center">
            <p className="text-sm font-medium text-foreground">No startup campaigns are live yet</p>
            <p className="mt-1 text-xs text-muted">Seed the database or post a project to appear here.</p>
            <Link href="/post-project" className="mt-4 inline-flex text-sm font-semibold text-accent-light hover:text-accent">
              Post a project →
            </Link>
          </div>
        )}
        {fundingProjects.length > 0 && filtered.length === 0 && (
          <div className="col-span-full rounded-xl border border-dashed border-card-border bg-card/30 px-6 py-10 text-center">
            <p className="text-sm font-medium text-foreground">No campaigns match this filter</p>
            <p className="mt-1 text-xs text-muted">Try &quot;All campaigns&quot; or widen your search.</p>
          </div>
        )}
        {filtered.map((project, i) => {
          const raised = raisedWithPledges(project);
          const pct = project.goal > 0 ? Math.min((raised / project.goal) * 100, 100) : 0;
          const fundedPulse = justFundedId === project.id;
          const grad = gradients[i % gradients.length];
          const remaining = Math.max(0, project.goal - raised);

          return (
            <motion.div key={project.id} variants={item}>
              <div className="glass-card flex h-full flex-col gap-4 p-5 sm:p-6">
                <div className="flex items-start gap-4">
                  <div
                    className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${grad} text-sm font-bold text-white shadow-lg`}
                  >
                    {project.image}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-lg font-semibold leading-tight text-foreground">{project.title}</h3>
                    <p className="mt-1 line-clamp-2 text-sm text-muted">{project.description}</p>
                    <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-muted">
                      <span className="rounded-full bg-card border border-card-border px-2 py-0.5">
                        Goal {formatInrShort(project.goal)}
                      </span>
                      <span className="rounded-full bg-card border border-card-border px-2 py-0.5">
                        {remaining > 0 ? `${formatInrShort(remaining)} to go` : "Fully funded"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-card-border">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.9, ease: "easeOut" }}
                    />
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                    <span className="font-semibold text-accent-light">{pct.toFixed(1)}% funded</span>
                    <span className="text-muted">
                      <span className="font-medium text-foreground">{formatInrFull(raised)}</span> of{" "}
                      <span className="font-medium text-foreground">{formatInrFull(project.goal)}</span>
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 text-sm text-muted">
                  <span className="flex items-center gap-1.5">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z"
                      />
                    </svg>
                    <span className="font-medium text-foreground">{project.backers.toLocaleString("en-IN")}</span> backers
                  </span>
                  <span className="flex items-center gap-1.5">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                    </svg>
                    <span className="font-medium text-foreground">{project.daysLeft}</span> days left
                  </span>
                </div>

                <div className="rounded-xl border border-card-border bg-card/60 px-4 py-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">Crowdfunding perks</p>
                  <p className="mt-1 text-sm leading-relaxed text-foreground/90">{project.reward}</p>
                </div>

                <div className="mt-auto flex flex-col gap-2 sm:flex-row sm:items-center">
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.98 }}
                    onClick={() => openContribute(project)}
                    disabled={remaining <= 0}
                    className="w-full rounded-xl bg-accent py-3 text-sm font-semibold text-white transition hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-40 sm:flex-1"
                  >
                    {remaining <= 0 ? "Goal reached" : "Contribute"}
                  </motion.button>
                  <Link
                    href={`/trade/${project.id}`}
                    className="w-full rounded-xl border border-card-border py-3 text-center text-sm font-semibold text-foreground transition hover:border-accent/40 sm:w-auto sm:px-5"
                  >
                    Market
                  </Link>
                </div>

                <AnimatePresence>
                  {fundedPulse && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex items-center justify-center gap-2 rounded-lg bg-gain/15 py-2 text-xs font-semibold text-gain"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                      </svg>
                      Thanks — your pledge was recorded on this device
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      <p className="mt-8 text-center text-[11px] text-muted">
        Pledges are stored locally for demo flows. Production would route through Razorpay or escrow and update campaign totals on the
        server.
      </p>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            className="fixed bottom-24 left-1/2 z-[90] w-[min(92vw,22rem)] -translate-x-1/2 rounded-xl border border-gain/25 bg-background/95 px-4 py-3 text-center text-xs font-medium text-foreground shadow-xl backdrop-blur-lg lg:bottom-8"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {modalProject && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 p-4 sm:items-center"
            onClick={() => setModalProject(null)}
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              transition={{ type: "spring", stiffness: 420, damping: 32 }}
              className="w-full max-w-md rounded-2xl border border-card-border bg-card p-5 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold text-foreground">Contribute to {modalProject.title}</h3>
              <p className="mt-1 text-xs text-muted">
                Choose an amount (INR). Rough ALGO hint: divide by ~{INR_HINT} (mock rate).
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {PRESET_INR.map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setPledgeInput(String(n))}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                      pledgeInput === String(n) ? "border-accent bg-accent/15 text-accent-light" : "border-card-border text-muted hover:border-accent/40"
                    }`}
                  >
                    {formatInrFull(n)}
                  </button>
                ))}
              </div>
              <label className="mt-4 block text-[11px] font-medium text-muted">
                Custom (INR)
                <input
                  type="number"
                  min={500}
                  step={100}
                  value={pledgeInput}
                  onChange={(e) => setPledgeInput(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-card-border bg-background px-3 py-2.5 text-sm outline-none focus:border-accent/50"
                />
              </label>
              <p className="mt-2 text-[10px] text-muted">
                Remaining to goal:{" "}
                {formatInrFull(Math.max(0, modalProject.goal - raisedWithPledges(modalProject)))}
              </p>
              <div className="mt-5 flex gap-2">
                <button
                  type="button"
                  onClick={() => setModalProject(null)}
                  className="flex-1 rounded-xl border border-card-border py-2.5 text-sm font-medium text-muted transition hover:bg-card"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={submitPledge}
                  className="flex-1 rounded-xl bg-accent py-2.5 text-sm font-semibold text-white transition hover:bg-accent/90"
                >
                  Confirm pledge
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
