"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { apiPostProject } from "@/lib/api-client";

function addDaysYmd(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

type MilestoneForm = {
  title: string;
  description: string;
  deadline: string;
  transparencyNote: string;
  /** First row: work in progress (one per line). Other rows: planned scope. */
  workOrPlan: string;
  linksRaw: string;
};

function emptyMilestone(phase: "first" | "later"): MilestoneForm {
  if (phase === "first") {
    return {
      title: "",
      description: "",
      deadline: addDaysYmd(60),
      transparencyNote: "",
      workOrPlan: "",
      linksRaw: "",
    };
  }
  return {
    title: "",
    description: "",
    deadline: addDaysYmd(120),
    transparencyNote: "",
    workOrPlan: "",
    linksRaw: "",
  };
}

function parseLinksRaw(raw: string): { label: string; href: string }[] | undefined {
  const lines = raw
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  if (!lines.length) return undefined;
  const out: { label: string; href: string }[] = [];
  for (const line of lines) {
    const idx = line.indexOf("|");
    if (idx < 0) continue;
    const label = line.slice(0, idx).trim();
    const href = line.slice(idx + 1).trim();
    if (label && /^https?:\/\//i.test(href)) out.push({ label, href });
  }
  return out.length ? out : undefined;
}

function linesToArray(block: string): string[] {
  return block
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}

export default function PostProjectPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [step, setStep] = useState<1 | 2>(1);
  const [title, setTitle] = useState("");
  const [tagline, setTagline] = useState("");
  const [category, setCategory] = useState("");
  const [tagsRaw, setTagsRaw] = useState("");
  const [fundingGoal, setFundingGoal] = useState("250000");
  const [initialPrice, setInitialPrice] = useState("25");
  const [feedDescription, setFeedDescription] = useState("");
  const [milestones, setMilestones] = useState<MilestoneForm[]>([emptyMilestone("first"), emptyMilestone("later")]);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const updateMilestone = useCallback((index: number, patch: Partial<MilestoneForm>) => {
    setMilestones((prev) => prev.map((m, i) => (i === index ? { ...m, ...patch } : m)));
  }, []);

  const addMilestone = useCallback(() => {
    setMilestones((prev) => [...prev, emptyMilestone("later")]);
  }, []);

  const removeMilestone = useCallback((index: number) => {
    setMilestones((prev) => (prev.length <= 2 ? prev : prev.filter((_, i) => i !== index)));
  }, []);

  const tags = useMemo(
    () =>
      tagsRaw
        .split(/[,]+/)
        .map((t) => t.trim())
        .filter(Boolean),
    [tagsRaw],
  );

  const buildPayload = useCallback(() => {
    const fg = Number(fundingGoal);
    const ip = initialPrice.trim() === "" ? undefined : Number(initialPrice);
    const ms = milestones.map((m, i) => {
      const lines = linesToArray(m.workOrPlan);
      const links = parseLinksRaw(m.linksRaw);
      const base = {
        title: m.title.trim(),
        description: m.description.trim(),
        deadline: m.deadline.trim(),
        transparencyNote: m.transparencyNote.trim(),
        ...(links ? { transparencyLinks: links } : {}),
      };
      if (i === 0) return { ...base, workInProgress: lines };
      return { ...base, plannedScope: lines };
    });
    return {
      title: title.trim(),
      tagline: tagline.trim(),
      category: category.trim(),
      tags,
      fundingGoal: fg,
      feedDescription: feedDescription.trim(),
      ...(ip !== undefined && Number.isFinite(ip) ? { initialPrice: ip } : {}),
      milestones: ms,
    };
  }, [category, feedDescription, fundingGoal, initialPrice, milestones, tagline, tags, title]);

  async function onPublish(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const payload = buildPayload();
      const { id } = await apiPostProject(payload);
      router.push(`/trade/${id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Publish failed.");
    } finally {
      setPending(false);
    }
  }

  if (!loading && !user) {
    return (
      <section className="mx-auto max-w-lg px-4 py-16">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass-card space-y-4 p-6">
          <h1 className="text-xl font-bold">Sign in to publish</h1>
          <p className="text-sm text-muted">Publishing locks your milestone timeline and stores an immutable transparency record.</p>
          <Link
            href="/auth/sign-in"
            className="inline-flex rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent/90"
          >
            Sign in
          </Link>
        </motion.div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-3xl px-3 py-8 sm:px-4 sm:py-12">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Post a project</h1>
          <p className="mt-2 text-sm text-muted leading-relaxed">
            When you publish, your milestone titles, deadlines, transparency notes, and scope lines are frozen. Investors can verify them against the append-only
            transparency log.
          </p>
        </div>

        <div className="flex gap-2 text-xs font-medium">
          <button
            type="button"
            onClick={() => setStep(1)}
            className={`rounded-full px-3 py-1 ${step === 1 ? "bg-accent/20 text-accent-light" : "bg-card text-muted"}`}
          >
            1 · Basics
          </button>
          <button
            type="button"
            onClick={() => setStep(2)}
            className={`rounded-full px-3 py-1 ${step === 2 ? "bg-accent/20 text-accent-light" : "bg-card text-muted"}`}
          >
            2 · Timeline
          </button>
        </div>

        <form onSubmit={onPublish} className="space-y-6">
          {step === 1 && (
            <div className="glass-card space-y-4 p-5 sm:p-6">
              <label className="block space-y-1">
                <span className="text-xs font-medium text-muted">Title</span>
                <input
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-lg border border-card-border bg-background px-3 py-2 text-sm outline-none focus:border-accent/40"
                  placeholder="e.g. HireIQ — ML Hiring Engine"
                />
              </label>
              <label className="block space-y-1">
                <span className="text-xs font-medium text-muted">Tagline</span>
                <input
                  required
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  className="w-full rounded-lg border border-card-border bg-background px-3 py-2 text-sm outline-none focus:border-accent/40"
                  placeholder="One line investors see on cards"
                />
              </label>
              <label className="block space-y-1">
                <span className="text-xs font-medium text-muted">Category</span>
                <input
                  required
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-lg border border-card-border bg-background px-3 py-2 text-sm outline-none focus:border-accent/40"
                  placeholder="e.g. AI / SaaS"
                />
              </label>
              <label className="block space-y-1">
                <span className="text-xs font-medium text-muted">Tags (comma-separated)</span>
                <input
                  required
                  value={tagsRaw}
                  onChange={(e) => setTagsRaw(e.target.value)}
                  className="w-full rounded-lg border border-card-border bg-background px-3 py-2 text-sm outline-none focus:border-accent/40"
                  placeholder="AI, B2B, API"
                />
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block space-y-1">
                  <span className="text-xs font-medium text-muted">Funding goal (₹)</span>
                  <input
                    required
                    type="number"
                    min={10_000}
                    value={fundingGoal}
                    onChange={(e) => setFundingGoal(e.target.value)}
                    className="w-full rounded-lg border border-card-border bg-background px-3 py-2 text-sm outline-none focus:border-accent/40"
                  />
                </label>
                <label className="block space-y-1">
                  <span className="text-xs font-medium text-muted">Initial share price (VALU)</span>
                  <input
                    type="number"
                    min={1}
                    step="0.01"
                    value={initialPrice}
                    onChange={(e) => setInitialPrice(e.target.value)}
                    className="w-full rounded-lg border border-card-border bg-background px-3 py-2 text-sm outline-none focus:border-accent/40"
                  />
                </label>
              </div>
              <label className="block space-y-1">
                <span className="text-xs font-medium text-muted">Project story (feed, min 40 chars)</span>
                <textarea
                  required
                  value={feedDescription}
                  onChange={(e) => setFeedDescription(e.target.value)}
                  rows={6}
                  className="w-full rounded-lg border border-card-border bg-background px-3 py-2 text-sm outline-none focus:border-accent/40"
                  placeholder="What you are building, for whom, and what proof you will share with backers."
                />
              </label>
              <button
                type="button"
                onClick={() => setStep(2)}
                className="w-full rounded-lg bg-accent/90 py-2.5 text-sm font-semibold text-white hover:bg-accent sm:w-auto sm:px-8"
              >
                Continue to timeline
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <p className="text-xs text-muted px-1">
                First milestone is <strong className="text-foreground">in progress</strong>: list current work (one line each). Later milestones are{" "}
                <strong className="text-foreground">upcoming</strong>: list planned scope. Deadlines must move forward in time.
              </p>
              {milestones.map((m, i) => (
                <div key={i} className="glass-card space-y-3 p-4 sm:p-5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wide text-accent-light">
                      {i === 0 ? "Milestone 1 · In progress" : `Milestone ${i + 1} · Upcoming`}
                    </span>
                    {i >= 2 && (
                      <button
                        type="button"
                        onClick={() => removeMilestone(i)}
                        className="text-xs text-loss hover:underline"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <input
                    required
                    value={m.title}
                    onChange={(e) => updateMilestone(i, { title: e.target.value })}
                    placeholder="Milestone title"
                    className="w-full rounded-lg border border-card-border bg-background px-3 py-2 text-sm outline-none focus:border-accent/40"
                  />
                  <textarea
                    required
                    value={m.description}
                    onChange={(e) => updateMilestone(i, { description: e.target.value })}
                    placeholder="What this phase delivers (10+ characters)"
                    rows={2}
                    className="w-full rounded-lg border border-card-border bg-background px-3 py-2 text-sm outline-none focus:border-accent/40"
                  />
                  <label className="block space-y-1">
                    <span className="text-xs text-muted">Deadline (YYYY-MM-DD)</span>
                    <input
                      required
                      type="date"
                      value={m.deadline}
                      onChange={(e) => updateMilestone(i, { deadline: e.target.value })}
                      className="w-full rounded-lg border border-card-border bg-background px-3 py-2 text-sm outline-none focus:border-accent/40"
                    />
                  </label>
                  <textarea
                    required
                    value={m.transparencyNote}
                    onChange={(e) => updateMilestone(i, { transparencyNote: e.target.value })}
                    placeholder="How you will prove progress (links, metrics, public artifacts)"
                    rows={2}
                    className="w-full rounded-lg border border-card-border bg-background px-3 py-2 text-sm outline-none focus:border-accent/40"
                  />
                  <textarea
                    required
                    value={m.workOrPlan}
                    onChange={(e) => updateMilestone(i, { workOrPlan: e.target.value })}
                    placeholder={i === 0 ? "Current work, one item per line" : "Planned scope when unlocked, one line each"}
                    rows={4}
                    className="w-full rounded-lg border border-card-border bg-background px-3 py-2 text-sm outline-none focus:border-accent/40"
                  />
                  <label className="block space-y-1">
                    <span className="text-xs text-muted">Optional links — one per line: Label|https://…</span>
                    <textarea
                      value={m.linksRaw}
                      onChange={(e) => updateMilestone(i, { linksRaw: e.target.value })}
                      rows={2}
                      className="w-full rounded-lg border border-card-border bg-background px-3 py-2 text-xs outline-none focus:border-accent/40 font-mono"
                    />
                  </label>
                </div>
              ))}
              <button
                type="button"
                onClick={addMilestone}
                className="w-full rounded-lg border border-dashed border-card-border py-2 text-sm text-muted hover:border-accent/40 hover:text-foreground"
              >
                + Add milestone
              </button>

              {error && <p className="rounded-lg border border-loss/30 bg-loss/10 px-3 py-2 text-sm text-loss">{error}</p>}

              <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
                <button type="button" onClick={() => setStep(1)} className="rounded-lg border border-card-border px-4 py-2 text-sm text-muted hover:bg-card">
                  Back
                </button>
                <button
                  type="submit"
                  disabled={pending || loading}
                  className="rounded-lg bg-accent px-6 py-2.5 text-sm font-semibold text-white hover:bg-accent/90 disabled:opacity-50"
                >
                  {pending ? "Publishing…" : "Publish & lock timeline"}
                </button>
              </div>
            </div>
          )}
        </form>
      </motion.div>
    </section>
  );
}
