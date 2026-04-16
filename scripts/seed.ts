/* eslint-disable no-console */
import fs from "node:fs";
import path from "node:path";
import mongoose from "mongoose";
import { connectMongo } from "../src/lib/db";
import {
  creators,
  projects,
  holdings,
  fundingProjects,
  coupons,
  wallet,
} from "../src/lib/data";
import {
  projectFeed,
  posts,
  stories,
  conversations,
  notifications,
  getUserProfile,
} from "../src/lib/social";
import {
  CandleModel,
  ConversationModel,
  CouponModel,
  CreatorModel,
  FundingProjectModel,
  HoldingModel,
  NotificationModel,
  PostModel,
  ProjectFeedMetaModel,
  ProjectModel,
  StoryModel,
  TradeModel,
  TransparencyLedgerModel,
  UserProfileModel,
  WalletModel,
} from "../src/models";

function readEnvLocal() {
  const candidates = [".env.local", "env.local"];
  for (const name of candidates) {
    const file = path.join(process.cwd(), name);
    if (!fs.existsSync(file)) continue;
    const txt = fs.readFileSync(file, "utf8");
    txt.split(/\r?\n/).forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) return;
      const idx = trimmed.indexOf("=");
      if (idx < 0) return;
      const k = trimmed.slice(0, idx).trim();
      let v = trimmed.slice(idx + 1).trim();
      if (v.startsWith("\"") && v.endsWith("\"")) v = v.slice(1, -1);
      if (!(k in process.env)) process.env[k] = v;
    });
  }
}

function seededRandom(seed: number) {
  let x = Math.sin(seed) * 10000;
  return () => {
    x = Math.sin(x) * 10000;
    return x - Math.floor(x);
  };
}

function generateTradesForProject(projectId: string, basePrice: number, count = 80) {
  const rand = seededRandom(basePrice * 1000 + count);
  const names = ["Aarav M.", "Diya S.", "Kabir R.", "Ishaan P.", "Saanvi K.", "Vihaan D.", "Anaya B.", "Arjun T.", "Myra G.", "Reyansh L."];
  const now = Date.now();
  const docs = [];
  let price = basePrice * (0.85 + rand() * 0.2);
  for (let i = 0; i < count; i += 1) {
    const buy = rand() > 0.47;
    const drift = (rand() - 0.48) * basePrice * 0.012;
    price = Math.max(basePrice * 0.45, price + drift);
    const msAgo = Math.floor((count - i) * (35_000 + rand() * 90_000));
    const at = new Date(now - msAgo);
    docs.push({
      projectId,
      type: buy ? "buy" : "sell",
      price: Number(price.toFixed(2)),
      quantity: Math.floor(rand() * 24 + 1),
      time: at.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
      user: names[Math.floor(rand() * names.length)],
      createdAt: at,
      updatedAt: at,
    });
  }
  return docs;
}

function generateCandlesForProject(projectId: string, basePrice: number, days = 90) {
  const rand = seededRandom(basePrice * 3000 + days);
  const docs = [];
  const now = Date.now();
  let prevClose = basePrice * (0.72 + rand() * 0.18);
  for (let i = days; i >= 0; i -= 1) {
    const date = new Date(now - i * 86400000);
    const open = prevClose;
    const move = (rand() - 0.47) * basePrice * 0.03;
    const close = Math.max(basePrice * 0.35, open + move);
    const high = Math.max(open, close) + rand() * basePrice * 0.015;
    const low = Math.max(basePrice * 0.28, Math.min(open, close) - rand() * basePrice * 0.015);
    const volume = Math.floor(10_000 + rand() * 55_000);
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

async function resetCollections() {
  await Promise.all([
    CreatorModel.deleteMany({}),
    ProjectModel.deleteMany({}),
    HoldingModel.deleteMany({}),
    FundingProjectModel.deleteMany({}),
    CouponModel.deleteMany({}),
    WalletModel.deleteMany({}),
    UserProfileModel.deleteMany({}),
    PostModel.deleteMany({}),
    StoryModel.deleteMany({}),
    ConversationModel.deleteMany({}),
    NotificationModel.deleteMany({}),
    ProjectFeedMetaModel.deleteMany({}),
    TradeModel.deleteMany({}),
    CandleModel.deleteMany({}),
    TransparencyLedgerModel.deleteMany({}),
  ]);
}

async function seed() {
  readEnvLocal();
  if (!process.env.MONGODB_URI) {
    throw new Error("Missing MONGODB_URI. Add it to .env.local or environment.");
  }
  await connectMongo();

  console.log("Connected. Clearing existing data...");
  await resetCollections();

  console.log("Seeding domain collections...");
  await CreatorModel.insertMany(creators, { ordered: true });
  await ProjectModel.insertMany(
    projects.map((p) => ({ ...p, creatorId: p.creator.id })),
    { ordered: true },
  );
  await HoldingModel.insertMany(
    holdings.map((h) => ({ ...h, userId: "demo" })),
    { ordered: true },
  );
  await FundingProjectModel.insertMany(fundingProjects, { ordered: true });
  await CouponModel.insertMany(coupons.map((c) => ({ ...c, userId: "demo" })), { ordered: true });
  await WalletModel.insertMany([{ ...wallet, userId: "demo" }], { ordered: true });

  console.log("Seeding social collections...");
  const profiles = creators
    .map((c) => getUserProfile(c.id))
    .filter(Boolean)
    .map((p) => ({ ...p! }));
  await UserProfileModel.insertMany(profiles, { ordered: true });
  await PostModel.insertMany(posts, { ordered: true });
  await StoryModel.insertMany(stories, { ordered: true });
  await ConversationModel.insertMany(conversations, { ordered: true });
  await NotificationModel.insertMany(
    notifications.map((n) => ({ ...n, userId: "demo" })),
    { ordered: true },
  );
  await ProjectFeedMetaModel.insertMany(
    projectFeed.map((p) => ({
      projectId: p.id,
      description: p.description,
      likes: p.likes,
      comments: p.comments,
      timeAgo: p.timeAgo,
    })),
    { ordered: true },
  );

  console.log("Seeding market trades and candles...");
  const trades = projects.flatMap((p) => generateTradesForProject(p.id, p.price, 80));
  const candles = projects.flatMap((p) => generateCandlesForProject(p.id, p.price, 90));
  await TradeModel.insertMany(trades, { ordered: false });
  await CandleModel.insertMany(candles, { ordered: false });

  console.log("Seed complete.");
}

seed()
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.connection.close();
  });

