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

export function apiGetProjects() {
  return getJson<ProjectStock[]>("/api/projects");
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

