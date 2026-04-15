import type { ProjectPost } from "@/lib/social";
import type { ProjectDoc } from "@/models";
import type { ProjectStats24h, OrderBookEntry } from "@/lib/data";

export function buildProjectFeedPost(
  project: ProjectDoc,
  meta: { description: string; likes: number; comments: number; timeAgo: string },
): ProjectPost {
  const creator = project.creator ?? {
    id: project.creatorId,
    name: "Unknown",
    username: "@unknown",
    avatar: "UN",
    score: 0,
    consistency: 0,
    stakingLevel: "Bronze",
  };
  const completed = project.batches.filter((b) => b.status === "completed").length;
  const overdue = project.batches.find((b) => b.status === "overdue");
  const inProgress = project.batches.find((b) => b.status === "in_progress");
  const currentBatch = overdue || inProgress || null;
  const overdueDays = overdue ? Math.max(0, Math.floor((Date.now() - new Date(overdue.deadline).getTime()) / 86400000)) : 0;
  const batchStatus: ProjectPost["batchStatus"] =
    overdue ? "overdue" : completed === project.batches.length ? "all_done" : "on_track";
  const disputeStatus = project.dispute?.status ?? "none";

  return {
    id: project.id,
    creatorId: creator.id,
    creatorName: creator.name,
    creatorAvatar: creator.avatar,
    creatorUsername: creator.username,
    creatorScore: creator.score,
    creatorTier: creator.stakingLevel,
    title: project.title,
    tagline: project.tagline,
    description: meta.description,
    category: project.category,
    tags: project.tags,
    coverGradient: project.coverGradient,
    coverIcon: project.coverIcon,
    pricePerShare: project.price,
    priceChange24h: project.changePercent,
    fundingGoal: project.fundingGoal,
    fundingRaised: project.fundingRaised,
    backers: project.backers,
    daysLeft: project.daysLeft,
    milestone: project.milestone,
    milestoneProgress: project.milestoneProgress,
    likes: meta.likes,
    comments: meta.comments,
    timeAgo: meta.timeAgo,
    currentBatchTitle: currentBatch?.title ?? null,
    batchProgress: `${completed}/${project.batches.length}`,
    batchStatus,
    overdueDays,
    isDisputed: disputeStatus === "open" || disputeStatus === "confirmed",
    disputeStatus: disputeStatus as ProjectPost["disputeStatus"],
  };
}

export function derive24hStats(project: ProjectDoc, candles: Array<{ close: number; high: number; low: number; volume: number }>): ProjectStats24h {
  const creator = project.creator ?? { score: 0 };
  const sorted = candles.slice().reverse();
  const first = sorted[0];
  const last = sorted[sorted.length - 1] ?? first;
  const high = Math.max(...sorted.map((c) => c.high), project.price);
  const low = Math.min(...sorted.map((c) => c.low), project.price);
  const volume24hNum = sorted.reduce((sum, c) => sum + c.volume, 0);
  return {
    open: first?.close ?? project.price - project.change,
    high,
    low,
    close: project.price,
    volume24h: volume24hNum >= 1_000_000 ? `${(volume24hNum / 1_000_000).toFixed(1)}M` : `${Math.round(volume24hNum / 1000)}K`,
    trades24h: Math.max(120, Math.round(volume24hNum / 120)),
    avgPrice: (high + low) / 2,
    holders: Math.max(200, Math.round(project.backers * 2.4)),
    allTimeHigh: project.price * 1.35,
    allTimeLow: project.price * 0.28,
    rank: Math.max(1, 50 - Math.round(project.changePercent)),
    creatorScore: creator.score,
    endorsements: Math.round(project.backers * 0.24),
    backers: project.backers.toLocaleString("en-IN"),
  };
}

export function deriveOrderBook(basePrice: number): { bids: OrderBookEntry[]; asks: OrderBookEntry[] } {
  const bids: OrderBookEntry[] = [];
  const asks: OrderBookEntry[] = [];
  let bidTotal = 0;
  let askTotal = 0;
  for (let i = 0; i < 8; i += 1) {
    const bidQty = Math.floor(70 + Math.random() * 420);
    bidTotal += bidQty;
    bids.push({
      price: parseFloat((basePrice - (i + 1) * basePrice * 0.003).toFixed(2)),
      quantity: bidQty,
      total: bidTotal,
    });
    const askQty = Math.floor(70 + Math.random() * 420);
    askTotal += askQty;
    asks.push({
      price: parseFloat((basePrice + (i + 1) * basePrice * 0.003).toFixed(2)),
      quantity: askQty,
      total: askTotal,
    });
  }
  return { bids, asks };
}

