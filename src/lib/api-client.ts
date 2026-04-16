"use client";

import type {
  Creator,
  Coupon,
  FundingProject,
  Holding,
  OrderBookEntry,
  ProjectStats24h,
  ProjectStock,
  RecentTrade,
} from "@/lib/data";
import type {
  Conversation,
  Notification,
  Post,
  ProjectPost,
  Story,
  UserProfile,
} from "@/lib/social";

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Request failed: ${url}`);
  return res.json() as Promise<T>;
}

export type WalletData = {
  userId: string;
  balance: number;
  invested: number;
  currentValue: number;
  pnl: number;
  pnlPercent: number;
};

type ProjectsResponse = ProjectStock[] | { projects: ProjectStock[] };

export async function apiGetProjects() {
  const data = await getJson<ProjectsResponse>("/api/projects");
  if (Array.isArray(data)) return data;
  return Array.isArray(data.projects) ? data.projects : [];
}

export type TransparencyLedgerEntry = {
  projectId: string;
  seq: number;
  kind: "published" | "proof_submitted" | "proof_verified" | "proof_rejected" | "penalty_applied" | "project_suspended";
  actorUserId: string;
  headline: string;
  snapshot: Record<string, unknown>;
  createdAt?: string;
};

export type ProjectTransparencyResponse = {
  projectId: string;
  title: string;
  publicationLocked: boolean;
  publishedAt: string | null;
  timelineLocked: boolean;
  ledger: TransparencyLedgerEntry[];
};

export async function apiPostProject(body: Record<string, unknown>) {
  const res = await fetch("/api/projects", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });
  const data = (await res.json()) as { error?: string; id?: string; published?: boolean };
  if (!res.ok) throw new Error(data.error ?? "Could not publish project.");
  return data as { id: string; published: boolean };
}

export function apiGetProjectTransparency(id: string) {
  return getJson<ProjectTransparencyResponse>(`/api/projects/${id}/transparency`);
}

export type ProofEvidenceInput = {
  type: "commit" | "deployment" | "task_board" | "video" | "wallet_attestation";
  label: string;
  url: string;
  metadata?: Record<string, unknown>;
};

export type ProofSubmission = {
  id: string;
  projectId: string;
  batchId: string;
  submitterUserId: string;
  walletAddress: string;
  signature: string;
  payload: string;
  evidence: ProofEvidenceInput[];
  artifactHashes: string[];
  verifierResult: {
    verificationStatus: "verified" | "needs_review" | "rejected" | "blocked";
    verificationScore: number;
    riskFlags: string[];
    checks: string[];
  };
  createdAt: string;
};

export function apiGetBatchProofs(projectId: string, batchId: string) {
  return getJson<{ submissions: ProofSubmission[] }>(`/api/projects/${projectId}/batches/${batchId}/proofs`);
}

export async function apiSubmitBatchProof(
  projectId: string,
  batchId: string,
  body: {
    walletAddress: string;
    signature: string;
    payload: string;
    evidence: ProofEvidenceInput[];
  },
) {
  const res = await fetch(`/api/projects/${projectId}/batches/${batchId}/proofs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });
  const data = (await res.json()) as { error?: string };
  if (!res.ok) throw new Error(data.error ?? "Proof submission failed.");
  return data;
}

export function apiGetCreators() {
  return getJson<Creator[]>("/api/creators");
}

export function apiGetProject(id: string) {
  return getJson<ProjectStock & { stats24h: ProjectStats24h }>(`/api/projects/${id}`);
}

export function apiGetProjectTrades(id: string) {
  return getJson<RecentTrade[]>(`/api/projects/${id}/trades`);
}

export function apiGetProjectCandles(id: string) {
  return getJson<Array<{ time: string; price: number; volume: number }>>(`/api/projects/${id}/candles`);
}

export function apiGetProjectOrderBook(id: string) {
  return getJson<{ bids: OrderBookEntry[]; asks: OrderBookEntry[] }>(`/api/projects/${id}/orderbook`);
}

export function apiGetFeed() {
  return getJson<ProjectPost[]>("/api/feed");
}

export function apiGetStories() {
  return getJson<Story[]>("/api/stories");
}

export function apiGetFunding() {
  return getJson<FundingProject[]>("/api/funding");
}

export function apiGetCoupons(userId = "demo") {
  return getJson<Coupon[]>(`/api/coupons?userId=${encodeURIComponent(userId)}`);
}

export function apiGetWallet(userId = "demo") {
  return getJson<WalletData>(`/api/wallet?userId=${encodeURIComponent(userId)}`);
}

export function apiGetHoldings(userId = "demo") {
  return getJson<Holding[]>(`/api/holdings?userId=${encodeURIComponent(userId)}`);
}

export function apiGetConversations() {
  return getJson<Conversation[]>("/api/conversations");
}

export function apiGetNotifications(userId = "demo") {
  return getJson<Notification[]>(`/api/notifications?userId=${encodeURIComponent(userId)}`);
}

export function apiGetPosts(userId?: string) {
  const query = userId ? `?userId=${encodeURIComponent(userId)}` : "";
  return getJson<Post[]>(`/api/posts${query}`);
}

export function apiGetProfile(id: string) {
  return getJson<UserProfile>(`/api/profiles/${id}`);
}

