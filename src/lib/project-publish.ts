import { randomBytes } from "node:crypto";
import type { Batch, BatchTransparencyLink } from "@/lib/data";

export const COVER_GRADIENTS = [
  "from-violet-600/30 via-purple-600/20 to-fuchsia-600/30",
  "from-cyan-600/30 via-blue-600/20 to-indigo-600/30",
  "from-emerald-600/30 via-teal-600/20 to-green-600/30",
  "from-rose-600/30 via-orange-600/20 to-amber-600/30",
  "from-indigo-600/30 via-violet-600/20 to-pink-600/30",
] as const;

export const COVER_ICONS = [
  "M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z",
  "M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z M15 12a3 3 0 11-6 0 3 3 0 016 0z",
  "M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z",
] as const;

export type MilestoneInput = {
  title: string;
  description: string;
  deadline: string;
  transparencyNote: string;
  workInProgress?: string[];
  plannedScope?: string[];
  transparencyLinks?: BatchTransparencyLink[];
};

export type PostProjectBody = {
  title: string;
  tagline: string;
  category: string;
  tags: string[];
  fundingGoal: number;
  feedDescription: string;
  initialPrice: number;
  milestones: MilestoneInput[];
};

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i += 1) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function pickCover(seed: string): { coverGradient: string; coverIcon: string } {
  const h = hashString(seed);
  return {
    coverGradient: COVER_GRADIENTS[h % COVER_GRADIENTS.length]!,
    coverIcon: COVER_ICONS[h % COVER_ICONS.length]!,
  };
}

export function slugifyTitle(title: string): string {
  const base = title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return base || "project";
}

export function newProjectSlugBase(title: string): string {
  const slug = slugifyTitle(title);
  const suffix = randomBytes(3).toString("hex");
  return `${slug}-${suffix}`;
}

export function stakingTierFromScore(score: number): string {
  if (score >= 90) return "Diamond";
  if (score >= 80) return "Platinum";
  if (score >= 70) return "Gold";
  if (score >= 60) return "Silver";
  return "Bronze";
}

export function generateSparklineDeterministic(base: number, seed: string): number[] {
  const points: number[] = [];
  let h = hashString(seed);
  let val = base;
  for (let i = 0; i < 24; i += 1) {
    h = (Math.imul(1103515245, h) + 12345) | 0;
    const r = (h >>> 0) / 2 ** 32;
    const drift = (r - 0.46) * base * 0.018;
    val = Math.max(base * 0.72, val + drift);
    points.push(parseFloat(val.toFixed(2)));
  }
  return points;
}

function parseYmd(s: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s.trim());
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  const dt = new Date(Date.UTC(y, mo - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== mo - 1 || dt.getUTCDate() !== d) return null;
  return dt;
}

function nonEmptyStrings(arr: unknown): string[] | null {
  if (!Array.isArray(arr)) return null;
  const out: string[] = [];
  for (const x of arr) {
    if (typeof x !== "string" || !x.trim()) return null;
    out.push(x.trim());
  }
  if (out.length === 0) return null;
  return out;
}

function parseLinks(raw: unknown): BatchTransparencyLink[] | undefined {
  if (raw === undefined || raw === null) return undefined;
  if (!Array.isArray(raw)) return undefined;
  const out: BatchTransparencyLink[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") return undefined;
    const o = item as Record<string, unknown>;
    const label = typeof o.label === "string" ? o.label.trim() : "";
    const href = typeof o.href === "string" ? o.href.trim() : "";
    if (!label || !href || !/^https?:\/\//i.test(href)) return undefined;
    out.push({ label, href });
  }
  return out.length ? out : undefined;
}

export function parsePostProjectBody(body: unknown): { ok: true; data: PostProjectBody } | { ok: false; error: string } {
  if (!body || typeof body !== "object") return { ok: false, error: "Invalid JSON body." };
  const b = body as Record<string, unknown>;
  const title = typeof b.title === "string" ? b.title.trim() : "";
  const tagline = typeof b.tagline === "string" ? b.tagline.trim() : "";
  const category = typeof b.category === "string" ? b.category.trim() : "";
  const feedDescription = typeof b.feedDescription === "string" ? b.feedDescription.trim() : "";
  if (title.length < 3 || title.length > 120) return { ok: false, error: "Title must be 3–120 characters." };
  if (tagline.length < 8 || tagline.length > 200) return { ok: false, error: "Tagline must be 8–200 characters." };
  if (category.length < 2 || category.length > 80) return { ok: false, error: "Category is required." };
  if (feedDescription.length < 40 || feedDescription.length > 4000) {
    return { ok: false, error: "Project story (for the feed) must be 40–4000 characters." };
  }
  if (!Array.isArray(b.tags) || b.tags.length < 1 || b.tags.length > 10) return { ok: false, error: "Provide 1–10 tags." };
  const tags: string[] = [];
  for (const t of b.tags) {
    if (typeof t !== "string" || !t.trim() || t.length > 32) {
      return { ok: false, error: "Each tag must be a non-empty string (max 32 chars)." };
    }
    tags.push(t.trim());
  }
  const fundingGoal = Number(b.fundingGoal);
  if (!Number.isFinite(fundingGoal) || fundingGoal < 10_000 || fundingGoal > 500_000_000) {
    return { ok: false, error: "Funding goal must be between 10,000 and 500,000,000." };
  }
  let initialPrice = typeof b.initialPrice === "number" ? b.initialPrice : 25;
  if (b.initialPrice !== undefined && (typeof b.initialPrice !== "number" || !Number.isFinite(initialPrice))) {
    return { ok: false, error: "Initial price must be a number." };
  }
  initialPrice = Math.min(5000, Math.max(1, initialPrice));

  if (!Array.isArray(b.milestones) || b.milestones.length < 2) {
    return { ok: false, error: "Add at least two milestones (timeline is fixed at publish)." };
  }
  const milestones: MilestoneInput[] = [];
  for (let i = 0; i < b.milestones.length; i += 1) {
    const m = b.milestones[i];
    if (!m || typeof m !== "object") return { ok: false, error: `Milestone ${i + 1} is invalid.` };
    const o = m as Record<string, unknown>;
    const mt = typeof o.title === "string" ? o.title.trim() : "";
    const md = typeof o.description === "string" ? o.description.trim() : "";
    const deadline = typeof o.deadline === "string" ? o.deadline.trim() : "";
    const tn = typeof o.transparencyNote === "string" ? o.transparencyNote.trim() : "";
    if (mt.length < 2 || mt.length > 120) return { ok: false, error: `Milestone ${i + 1}: title must be 2–120 characters.` };
    if (md.length < 10 || md.length > 800) return { ok: false, error: `Milestone ${i + 1}: description must be 10–800 characters.` };
    if (!parseYmd(deadline)) return { ok: false, error: `Milestone ${i + 1}: deadline must be YYYY-MM-DD.` };
    if (tn.length < 10 || tn.length > 1200) return { ok: false, error: `Milestone ${i + 1}: transparency note must be 10–1200 characters.` };
    const links = parseLinks(o.transparencyLinks);
    if (links === undefined && o.transparencyLinks !== undefined && o.transparencyLinks !== null) {
      return { ok: false, error: `Milestone ${i + 1}: transparency links must be { label, href } with http(s) URLs.` };
    }
    if (i === 0) {
      const wip = nonEmptyStrings(o.workInProgress);
      if (!wip || wip.length < 1) {
        return { ok: false, error: "First milestone must list at least one current work item (work in progress)." };
      }
      milestones.push({ title: mt, description: md, deadline, transparencyNote: tn, workInProgress: wip, transparencyLinks: links });
    } else {
      const ps = nonEmptyStrings(o.plannedScope);
      if (!ps || ps.length < 1) {
        return { ok: false, error: `Milestone ${i + 1}: add at least one planned scope line for upcoming work.` };
      }
      milestones.push({ title: mt, description: md, deadline, transparencyNote: tn, plannedScope: ps, transparencyLinks: links });
    }
  }

  let prev: Date | null = null;
  for (let i = 0; i < milestones.length; i += 1) {
    const dt = parseYmd(milestones[i]!.deadline)!;
    if (prev && dt < prev) {
      return { ok: false, error: "Milestone deadlines must be in chronological order (each date on or after the previous)." };
    }
    prev = dt;
  }

  return {
    ok: true,
    data: {
      title,
      tagline,
      category,
      tags,
      fundingGoal,
      feedDescription,
      initialPrice,
      milestones,
    },
  };
}

export function milestonesToBatches(milestones: MilestoneInput[]): Batch[] {
  const today = new Date().toISOString().slice(0, 10);
  return milestones.map((m, i) => {
    const priceImpact = Math.max(3, 16 - i * 2);
    const base = {
      id: `batch-${i + 1}`,
      title: m.title,
      description: m.description,
      deadline: m.deadline,
      priceImpact,
      transparencyNote: m.transparencyNote,
      transparencyLinks: m.transparencyLinks,
      lastInvestorUpdate: today,
    };
    if (i === 0) {
      return {
        ...base,
        status: "in_progress" as const,
        workInProgress: m.workInProgress!,
      };
    }
    return {
      ...base,
      status: "upcoming" as const,
      plannedScope: m.plannedScope!,
    };
  });
}

export function daysUntil(deadlineYmd: string): number {
  const d = parseYmd(deadlineYmd);
  if (!d) return 30;
  const now = new Date();
  const end = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  const start = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.max(1, Math.ceil((end - start) / 86400000));
}

export function formatMarketCapCr(price: number): string {
  const v = (price * 180_000) / 10_000_000;
  if (v < 0.1) return `${v.toFixed(2)}Cr`;
  return `${v.toFixed(1)}Cr`;
}

export function buildTransparencySnapshot(params: {
  projectId: string;
  title: string;
  tagline: string;
  batches: Batch[];
  publishedAt: string;
}): Record<string, unknown> {
  return {
    version: 1,
    projectId: params.projectId,
    title: params.title,
    tagline: params.tagline,
    batches: JSON.parse(JSON.stringify(params.batches)) as unknown[],
    publishedAt: params.publishedAt,
    note: "This snapshot is append-only. Milestone titles, deadlines, and published transparency text are frozen at publication.",
  };
}

export function buildInitialCandles(projectId: string, price: number, days = 14) {
  const docs: Array<{
    projectId: string;
    time: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
    createdAt: Date;
    updatedAt: Date;
  }> = [];
  const now = Date.now();
  let seed = hashString(`${projectId}:${price}`);
  let prevClose = price * 0.98;
  for (let i = days; i >= 0; i -= 1) {
    const date = new Date(now - i * 86400000);
    seed = (Math.imul(1103515245, seed) + 12345) | 0;
    const r = (seed >>> 0) / 2 ** 32;
    const open = prevClose;
    const move = (r - 0.48) * price * 0.012;
    const close = Math.max(price * 0.85, open + move);
    const high = Math.max(open, close) + r * price * 0.008;
    const low = Math.max(price * 0.8, Math.min(open, close) - r * price * 0.008);
    const volume = Math.floor(8000 + r * 12000);
    docs.push({
      projectId,
      time: date.toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
      open: Number(open.toFixed(2)),
      high: Number(high.toFixed(2)),
      low: Number(low.toFixed(2)),
      close: Number(close.toFixed(2)),
      volume,
      createdAt: date,
      updatedAt: date,
    });
    prevClose = close;
  }
  return docs;
}
