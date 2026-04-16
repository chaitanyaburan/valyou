import type {
  Batch,
  BatchTransparencyLink,
  Creator,
  OrderBookEntry,
  ProjectStats24h,
  ProjectStock,
  RecentTrade,
} from "@/lib/data";

const STORAGE_KEY = "valyou.postedProjects.v1";
export const CLIENT_PROJECT_ID_PREFIX = "posted-";
export const MARKET_PROJECTS_EVENT = "valyou:market-projects-changed";

const tradeNames = ["Aarav M.", "Diya S.", "Kabir R.", "Ishaan P.", "Saanvi K.", "Vihaan D.", "Anaya B.", "Arjun T.", "Myra G.", "Reyansh L."];

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48) || "project";
}

export function isClientPostedProjectId(id: string): boolean {
  return id.startsWith(CLIENT_PROJECT_ID_PREFIX);
}

function readStorage(): ProjectStock[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((p): p is ProjectStock => Boolean(p && typeof (p as ProjectStock).id === "string"));
  } catch {
    return [];
  }
}

function writeStorage(list: ProjectStock[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    window.dispatchEvent(new Event(MARKET_PROJECTS_EVENT));
  } catch {
    /* ignore quota */
  }
}

export function loadPostedProjects(): ProjectStock[] {
  return readStorage();
}

export function getPostedProjectById(id: string): ProjectStock | undefined {
  return readStorage().find((p) => p.id === id);
}

export function savePostedProject(project: ProjectStock): void {
  const cur = readStorage();
  const next = [project, ...cur.filter((p) => p.id !== project.id)];
  writeStorage(next);
}

export function subscribeMarketProjects(cb: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = () => cb();
  window.addEventListener(MARKET_PROJECTS_EVENT, handler);
  return () => window.removeEventListener(MARKET_PROJECTS_EVENT, handler);
}

export async function mergePostedWithApi(apiProjects: ProjectStock[]): Promise<ProjectStock[]> {
  const posted = typeof window !== "undefined" ? readStorage() : [];
  const apiIds = new Set(apiProjects.map((p) => p.id));
  const uniquePosted = posted.filter((p) => !apiIds.has(p.id));
  return [...uniquePosted, ...apiProjects];
}

export function generateSparkline(base: number, trend: number): number[] {
  const points: number[] = [];
  let val = base;
  for (let i = 0; i < 24; i++) {
    val += (Math.random() - 0.45) * trend * base * 0.02;
    val = Math.max(val * 0.7, val);
    points.push(parseFloat(val.toFixed(2)));
  }
  return points;
}

export function generateChartData(base: number, days: number): Array<{ time: string; price: number; volume: number }> {
  const data: Array<{ time: string; price: number; volume: number }> = [];
  let val = base * 0.7;
  const now = Date.now();
  for (let i = days; i >= 0; i--) {
    val += (Math.random() - 0.45) * base * 0.03;
    val = Math.max(base * 0.3, val);
    data.push({
      time: new Date(now - i * 86400000).toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
      price: parseFloat(val.toFixed(2)),
      volume: Math.floor(Math.random() * 50000 + 10000),
    });
  }
  return data;
}

export function generateOrderBook(basePrice: number): { bids: OrderBookEntry[]; asks: OrderBookEntry[] } {
  const bids: OrderBookEntry[] = [];
  const asks: OrderBookEntry[] = [];
  let bidTotal = 0;
  let askTotal = 0;
  for (let i = 0; i < 8; i++) {
    const bidQty = Math.floor(Math.random() * 500 + 50);
    bidTotal += bidQty;
    bids.push({
      price: parseFloat((basePrice - (i + 1) * basePrice * 0.003).toFixed(2)),
      quantity: bidQty,
      total: bidTotal,
    });
    const askQty = Math.floor(Math.random() * 500 + 50);
    askTotal += askQty;
    asks.push({
      price: parseFloat((basePrice + (i + 1) * basePrice * 0.003).toFixed(2)),
      quantity: askQty,
      total: askTotal,
    });
  }
  return { bids, asks };
}

export function generateRecentTrades(basePrice: number, projectId: string): RecentTrade[] {
  const trades: RecentTrade[] = [];
  const now = Date.now();
  for (let i = 0; i < 15; i++) {
    const isBuy = Math.random() > 0.45;
    const offset = (Math.random() - 0.5) * basePrice * 0.01;
    trades.push({
      id: `trade-${projectId}-${i}`,
      projectId,
      type: isBuy ? "buy" : "sell",
      price: parseFloat((basePrice + offset).toFixed(2)),
      quantity: Math.floor(Math.random() * 20 + 1),
      time: new Date(now - i * (Math.random() * 120000 + 30000)).toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
      user: tradeNames[Math.floor(Math.random() * tradeNames.length)]!,
    });
  }
  return trades;
}

export function generateProjectStats24h(project: ProjectStock): ProjectStats24h {
  const variance = project.price * 0.08;
  const high = parseFloat((project.price + Math.random() * variance).toFixed(2));
  const low = parseFloat((project.price - Math.random() * variance).toFixed(2));
  return {
    open: parseFloat((project.price - project.change).toFixed(2)),
    high,
    low,
    close: project.price,
    volume24h: project.volume,
    trades24h: Math.floor(Math.random() * 5000 + 800),
    avgPrice: parseFloat(((high + low) / 2).toFixed(2)),
    holders: Math.floor(Math.random() * 10000 + 500),
    allTimeHigh: parseFloat((project.price * (1.2 + Math.random() * 0.5)).toFixed(2)),
    allTimeLow: parseFloat((project.price * (0.15 + Math.random() * 0.2)).toFixed(2)),
    rank: Math.floor(Math.random() * 50 + 1),
    creatorScore: project.creator.score,
    endorsements: Math.floor(Math.random() * 500 + 50),
    backers: `${project.backers.toLocaleString("en-IN")}`,
  };
}

export type ListingBias = "New Listing" | "Trending" | "Top Performer";
export type StageStatus = "In Progress" | "Completed" | "Upcoming";

export type VisualPresetId = "aurora" | "ocean" | "ember" | "mono" | "forest";

export const VISUAL_PRESETS: Array<{
  id: VisualPresetId;
  label: string;
  coverGradient: string;
  coverIcon: string;
}> = [
  {
    id: "aurora",
    label: "Violet Launch",
    coverGradient: "from-violet-600/30 via-purple-600/20 to-fuchsia-600/30",
    coverIcon:
      "M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z",
  },
  {
    id: "ocean",
    label: "Cyan Product",
    coverGradient: "from-cyan-600/30 via-blue-600/20 to-indigo-600/30",
    coverIcon:
      "M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z M15 12a3 3 0 11-6 0 3 3 0 016 0z",
  },
  {
    id: "forest",
    label: "Emerald Chain",
    coverGradient: "from-emerald-600/30 via-teal-600/20 to-green-600/30",
    coverIcon:
      "M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z",
  },
  {
    id: "mono",
    label: "Amber Community",
    coverGradient: "from-amber-600/30 via-orange-600/20 to-yellow-600/25",
    coverIcon: "M3.25 13.125a.75.75 0 01.75-.75h15a.75.75 0 01.75.75v5.25a.75.75 0 01-.75.75H4a.75.75 0 01-.75-.75v-5.25zM6 9.75h.008v.008H6V9.75zm2.25 0h.008v.008H8.25V9.75zm2.25 0h.008v.008H10.5V9.75zm2.25 0h.008v.008H12.75V9.75zM15 9.75h.008v.008H15V9.75z",
  },
  {
    id: "ember",
    label: "Rose Builder",
    coverGradient: "from-rose-600/30 via-pink-600/20 to-fuchsia-600/25",
    coverIcon: "M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5",
  },
];

function filterCategoryFromBias(bias: ListingBias): ProjectStock["filterCategory"] {
  if (bias === "New Listing") return "new";
  if (bias === "Trending") return "trending";
  return "top";
}

function batchStatusFromStage(s: StageStatus): Batch["status"] {
  if (s === "Completed") return "completed";
  if (s === "Upcoming") return "upcoming";
  return "in_progress";
}

function lines(block: string): string[] {
  return block
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}

export type PostProjectFormPayload = {
  step1: {
    title: string;
    tagline: string;
    category: string;
    listingBias: ListingBias;
    description: string;
    tags: string[];
    sharePrice: number;
    fundingGoalInr: number;
    fundingRaisedInr: number;
    totalShares: number;
    backers: number;
    daysLeft: number;
    visualPresetId: VisualPresetId;
  };
  step2: {
    currentMilestone: string;
    milestoneProgress: number;
    currentStageTitle: string;
    currentStageStatus: StageStatus;
    currentStageDescription: string;
    currentStageDeadline: string;
    completedVerifiedRaw: string;
    currentWorkRaw: string;
    nextStageTitle: string;
    nextStageDeadline: string;
    nextStageDescription: string;
    proofGithub: string;
    proofDemo: string;
    proofDocs: string;
  };
};

function buildTransparencyLinks(github: string, demo: string, docs: string): BatchTransparencyLink[] {
  const out: BatchTransparencyLink[] = [];
  const g = github.trim();
  const d = demo.trim();
  const x = docs.trim();
  if (g) out.push({ label: "GitHub Repository", href: g });
  if (d) out.push({ label: "Demo / Build Preview", href: d });
  if (x) out.push({ label: "Docs / Screenshots", href: x });
  return out;
}

function defaultUpcomingBatch(): Batch {
  return {
    id: "b-scale",
    title: "Scale, liquidity & growth",
    description: "Exchange listings, market-making, and community growth programs once core roadmap milestones are verified.",
    deadline: new Date(Date.now() + 180 * 86400000).toISOString().slice(0, 10),
    status: "upcoming",
    priceImpact: 8,
    plannedScope: [
      "Market-maker partnerships and depth targets",
      "Community grants + hackathon sponsorships",
      "Quarterly transparency report + investor AMA",
    ],
    transparencyNote: "This batch unlocks after the published roadmap stages are verified complete.",
  };
}

function buildBatches(form: PostProjectFormPayload): Batch[] {
  const s2 = form.step2;
  const status = batchStatusFromStage(s2.currentStageStatus);
  const proofLinks = buildTransparencyLinks(s2.proofGithub, s2.proofDemo, s2.proofDocs);
  const completedLines = lines(s2.completedVerifiedRaw);
  const wipLines = lines(s2.currentWorkRaw);

  const current: Batch = {
    id: "b-current",
    title: s2.currentStageTitle.trim() || form.step1.title,
    description: s2.currentStageDescription.trim(),
    deadline: s2.currentStageDeadline.trim(),
    status,
    priceImpact: 12,
    transparencyNote: "Proof links and stage details were captured at listing publish time.",
    transparencyLinks: proofLinks.length ? proofLinks : undefined,
    ...(status === "completed"
      ? {
          completedAt: new Date().toISOString().slice(0, 10),
          deliverablesDone: completedLines.length ? completedLines : [s2.currentStageDescription.trim()],
        }
      : {}),
    ...(status === "in_progress" ? { workInProgress: wipLines.length ? wipLines : [s2.currentStageDescription.trim()] } : {}),
    ...(status === "upcoming"
      ? {
          plannedScope: wipLines.length ? wipLines : [s2.currentStageDescription.trim()],
        }
      : {}),
  };

  const nextLines = lines(s2.nextStageDescription);
  const next: Batch = {
    id: "b-next",
    title: s2.nextStageTitle.trim() || "Next roadmap stage",
    description: s2.nextStageDescription.trim().split("\n")[0]?.trim() || "Following milestone after the current stage.",
    deadline: s2.nextStageDeadline.trim(),
    status: "upcoming",
    priceImpact: 10,
    plannedScope: nextLines.length ? nextLines : ["Scope will be expanded after the current stage is verified."],
    transparencyNote: "Unlocks after the current stage is marked complete in the published timeline.",
  };

  return [current, next, defaultUpcomingBatch()];
}

export function buildPostedProject(form: PostProjectFormPayload, creator: Creator): ProjectStock {
  const preset = VISUAL_PRESETS.find((p) => p.id === form.step1.visualPresetId) ?? VISUAL_PRESETS[0]!;
  const id = `${CLIENT_PROJECT_ID_PREFIX}${slugify(form.step1.title)}-${Date.now().toString(36)}`;
  const price = Number(form.step1.sharePrice.toFixed(4));
  const change = parseFloat((price * (0.01 + Math.random() * 0.04)).toFixed(2));
  const changePercent = parseFloat(((change / Math.max(price - change, 0.01)) * 100).toFixed(2));
  const volN = Math.floor(price * 8000 + Math.random() * 400000);
  const mcapN = Math.floor(price * 1_200_000 + Math.random() * 8_000_000);
  const batches = buildBatches(form);
  const totalShares = Math.max(1, Math.floor(form.step1.totalShares));

  return {
    id,
    creatorId: creator.id,
    title: form.step1.title.trim(),
    tagline: form.step1.tagline.trim(),
    creator,
    price,
    change,
    changePercent,
    sparkline: generateSparkline(price, change >= 0 ? 1 : -1),
    volume: `${(volN / 1_000_000).toFixed(1)}M ALGO`,
    marketCap: `${(mcapN / 1_000_000).toFixed(1)}M ALGO`,
    category: form.step1.category.trim(),
    tags: form.step1.tags,
    coverGradient: preset.coverGradient,
    coverIcon: preset.coverIcon,
    fundingGoal: Math.round(form.step1.fundingGoalInr),
    fundingRaised: Math.round(form.step1.fundingRaisedInr),
    totalShares,
    sharesSold: Math.round((form.step1.fundingRaisedInr / Math.max(price, 0.0001)) || 0),
    backers: Math.max(0, Math.floor(form.step1.backers)),
    daysLeft: Math.max(1, Math.floor(form.step1.daysLeft)),
    milestone: form.step2.currentMilestone.trim(),
    milestoneProgress: Math.min(100, Math.max(0, Math.round(form.step2.milestoneProgress))),
    filterCategory: filterCategoryFromBias(form.step1.listingBias),
    batches,
    timelineLocked: true,
    publicationLocked: true,
    publishedAt: new Date().toISOString(),
  };
}

export function validateHttpUrl(raw: string): boolean {
  const s = raw.trim();
  if (!s) return true;
  try {
    const u = new URL(s);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export function countProofLinks(github: string, demo: string, docs: string): number {
  return [github, demo, docs].filter((s) => s.trim().length > 0).length;
}
