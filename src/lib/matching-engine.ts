import { randomUUID } from "node:crypto";
import type { HydratedDocument } from "mongoose";
import { formatMarketCapCr } from "@/lib/project-publish";
import {
  CandleModel,
  HoldingModel,
  OrderModel,
  ProjectModel,
  TradeModel,
  WalletModel,
  type OrderDoc,
} from "@/models";

type OrderSide = "buy" | "sell";
type OrderType = "market" | "limit";

type PlaceOrderInput = {
  projectId: string;
  userId: string;
  side: OrderSide;
  type: OrderType;
  quantity: number;
  limitPrice?: number;
};

type Execution = {
  price: number;
  quantity: number;
  buyOrderId: string;
  sellOrderId: string;
  buyerUserId: string;
  sellerUserId: string;
};

/** Synthetic counterparty for one-sided market fills when the public limit book is empty. */
const LIQUIDITY_USER_ID = "valyou-liquidity";
const LIQUIDITY_ORDER_ID = "valyou-liquidity";

function nowLabel() {
  return new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function candleBucket(date = new Date()) {
  return date.toISOString().slice(0, 16);
}

function round2(n: number) {
  return Number(n.toFixed(2));
}

function reserveUnitPrice(order: Pick<OrderDoc, "type" | "limitPrice">, fallbackPrice: number) {
  if (order.type === "limit" && order.limitPrice) return order.limitPrice;
  return fallbackPrice * 1.05;
}

async function ensureHolding(userId: string, project: { id: string; title: string; creator: { name: string; avatar: string }; price: number }) {
  let holding = await HoldingModel.findOne({ userId, projectId: project.id });
  if (!holding) {
    holding = await HoldingModel.create({
      userId,
      projectId: project.id,
      title: project.title,
      creatorName: project.creator.name,
      avatar: project.creator.avatar,
      invested: 0,
      currentValue: 0,
      quantity: 0,
      reservedQuantity: 0,
      avgPrice: project.price,
      currentPrice: project.price,
    });
  }
  return holding;
}

async function recomputeWalletSummary(userId: string) {
  const wallet = await WalletModel.findOne({ userId });
  if (!wallet) return;
  const holdings = await HoldingModel.find({ userId }).lean();
  const invested = holdings.reduce((sum, h) => sum + h.invested, 0);
  const currentValue = holdings.reduce((sum, h) => sum + h.currentValue, 0);
  const pnl = currentValue - invested;
  wallet.set({
    invested: round2(invested),
    currentValue: round2(currentValue),
    pnl: round2(pnl),
    pnlPercent: invested > 0 ? round2((pnl / invested) * 100) : 0,
    balance: round2(wallet.availableBalance + wallet.reservedBalance),
  });
  await wallet.save();
}

async function applyBuyerFill(userId: string, project: { id: string; title: string; creator: { name: string; avatar: string }; price: number }, order: HydratedDocument<OrderDoc>, quantity: number, execPrice: number) {
  const wallet = await WalletModel.findOne({ userId });
  if (!wallet) throw new Error("Wallet not found for buyer.");
  const held = await ensureHolding(userId, project);
  const reservedDrop = reserveUnitPrice(order, project.price) * quantity;
  order.reservedAlgo = round2(Math.max(0, order.reservedAlgo - reservedDrop));
  wallet.reservedBalance = round2(Math.max(0, wallet.reservedBalance - reservedDrop));
  const spent = execPrice * quantity;
  const refund = Math.max(0, reservedDrop - spent);
  wallet.availableBalance = round2(wallet.availableBalance + refund);
  wallet.balance = round2(wallet.availableBalance + wallet.reservedBalance);
  await wallet.save();

  const prevQty = held.quantity;
  const nextQty = prevQty + quantity;
  const nextInvested = held.invested + spent;
  held.quantity = round2(nextQty);
  held.invested = round2(nextInvested);
  held.avgPrice = nextQty > 0 ? round2(nextInvested / nextQty) : execPrice;
  held.currentPrice = execPrice;
  held.currentValue = round2(nextQty * execPrice);
  await held.save();
  await order.save();
}

async function applySellerFill(userId: string, project: { id: string; title: string; creator: { name: string; avatar: string }; price: number }, quantity: number, execPrice: number) {
  const wallet = await WalletModel.findOne({ userId });
  if (!wallet) throw new Error("Wallet not found for seller.");
  const held = await ensureHolding(userId, project);
  held.quantity = round2(Math.max(0, held.quantity - quantity));
  held.reservedQuantity = round2(Math.max(0, held.reservedQuantity - quantity));
  held.currentPrice = execPrice;
  held.currentValue = round2(held.quantity * execPrice);
  if (held.quantity === 0) {
    held.invested = 0;
    held.avgPrice = execPrice;
  } else {
    held.invested = round2(held.quantity * held.avgPrice);
  }
  await held.save();

  const proceeds = execPrice * quantity;
  wallet.availableBalance = round2(wallet.availableBalance + proceeds);
  wallet.balance = round2(wallet.availableBalance + wallet.reservedBalance);
  await wallet.save();
}

async function writeTrade(projectId: string, execution: Execution, aggressorSide: OrderSide) {
  await TradeModel.create({
    id: `trd-${randomUUID().slice(0, 12)}`,
    projectId,
    type: aggressorSide,
    price: execution.price,
    quantity: execution.quantity,
    time: nowLabel(),
    user: aggressorSide === "buy" ? execution.buyerUserId : execution.sellerUserId,
    buyerUserId: execution.buyerUserId,
    sellerUserId: execution.sellerUserId,
    buyOrderId: execution.buyOrderId,
    sellOrderId: execution.sellOrderId,
  });
}

async function ensureLiquidityWallet() {
  let w = await WalletModel.findOne({ userId: LIQUIDITY_USER_ID });
  if (!w) {
    await WalletModel.create({
      userId: LIQUIDITY_USER_ID,
      balance: 1e12,
      availableBalance: 1e12,
      reservedBalance: 0,
      invested: 0,
      currentValue: 0,
      pnl: 0,
      pnlPercent: 0,
    });
    return;
  }
  if (w.availableBalance === undefined) {
    w.availableBalance = w.balance;
    w.reservedBalance = 0;
  }
  if (w.availableBalance < 1e9) {
    w.availableBalance = 1e12;
    w.reservedBalance = 0;
    w.balance = round2(w.availableBalance + w.reservedBalance);
    await w.save();
  }
}

async function creditLiquidityOnBuyFromUser(qty: number, price: number) {
  await ensureLiquidityWallet();
  const w = await WalletModel.findOne({ userId: LIQUIDITY_USER_ID });
  if (!w) return;
  w.availableBalance = round2(w.availableBalance + qty * price);
  w.balance = round2(w.availableBalance + w.reservedBalance);
  await w.save();
}

async function debitLiquidityOnBuyFromUser(qty: number, price: number) {
  await ensureLiquidityWallet();
  const w = await WalletModel.findOne({ userId: LIQUIDITY_USER_ID });
  if (!w) return;
  const cost = round2(qty * price);
  if (w.availableBalance < cost) {
    w.availableBalance = 1e12;
  }
  w.availableBalance = round2(w.availableBalance - cost);
  w.balance = round2(w.availableBalance + w.reservedBalance);
  await w.save();
}

/**
 * When the limit book has no crossing depth, complete market orders at the current mark (project price).
 * Keeps trading usable on fresh seeds and thin markets; real limit flow still takes priority.
 */
async function fillMarketRemainderAgainstLiquidity(
  incoming: HydratedDocument<OrderDoc>,
  input: PlaceOrderInput,
  projectId: string,
  executions: Execution[],
) {
  if (incoming.type !== "market" || incoming.remainingQuantity <= 0) return;

  const fresh = await ProjectModel.findOne({ id: projectId });
  if (!fresh) return;
  const refPrice = round2(fresh.price);
  const qty = incoming.remainingQuantity;
  if (qty <= 0 || refPrice <= 0) return;

  if (input.side === "buy") {
    const execution: Execution = {
      price: refPrice,
      quantity: qty,
      buyOrderId: incoming.id,
      sellOrderId: LIQUIDITY_ORDER_ID,
      buyerUserId: input.userId,
      sellerUserId: LIQUIDITY_USER_ID,
    };
    await applyBuyerFill(input.userId, fresh, incoming, qty, refPrice);
    await creditLiquidityOnBuyFromUser(qty, refPrice);
    await writeTrade(projectId, execution, "buy");
    await upsertCandle(projectId, refPrice, qty);
    incoming.remainingQuantity = 0;
    incoming.status = "filled";
    incoming.reservedShares = 0;
    executions.push(execution);
    return;
  }

  const execution: Execution = {
    price: refPrice,
    quantity: qty,
    buyOrderId: LIQUIDITY_ORDER_ID,
    sellOrderId: incoming.id,
    buyerUserId: LIQUIDITY_USER_ID,
    sellerUserId: input.userId,
  };
  await applySellerFill(input.userId, fresh, qty, refPrice);
  await debitLiquidityOnBuyFromUser(qty, refPrice);
  await writeTrade(projectId, execution, "sell");
  await upsertCandle(projectId, refPrice, qty);
  incoming.remainingQuantity = 0;
  incoming.status = "filled";
  incoming.reservedShares = 0;
  executions.push(execution);
}

async function upsertCandle(projectId: string, price: number, quantity: number, volumeMultiplier = 1) {
  const bucket = candleBucket();
  const candle = await CandleModel.findOne({ projectId, time: bucket });
  if (!candle) {
    await CandleModel.create({
      projectId,
      time: bucket,
      open: price,
      high: price,
      low: price,
      close: price,
      volume: Math.max(0, Math.round(quantity * volumeMultiplier)),
    });
    return;
  }
  candle.high = Math.max(candle.high, price);
  candle.low = Math.min(candle.low, price);
  candle.close = price;
  candle.volume += Math.max(0, Math.round(quantity * volumeMultiplier));
  await candle.save();
}

export async function buildRealOrderBook(projectId: string) {
  const rows = await OrderModel.find({
    projectId,
    status: { $in: ["open", "partially_filled"] },
    remainingQuantity: { $gt: 0 },
    type: "limit",
  }).lean();
  const bidsMap = new Map<number, number>();
  const asksMap = new Map<number, number>();
  for (const row of rows) {
    const px = row.limitPrice ?? 0;
    if (!px) continue;
    const map = row.side === "buy" ? bidsMap : asksMap;
    map.set(px, (map.get(px) ?? 0) + row.remainingQuantity);
  }

  let bidTotal = 0;
  const bids = Array.from(bidsMap.entries())
    .sort((a, b) => b[0] - a[0])
    .map(([price, quantity]) => {
      bidTotal += quantity;
      return { price, quantity, total: bidTotal };
    });

  let askTotal = 0;
  const asks = Array.from(asksMap.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([price, quantity]) => {
      askTotal += quantity;
      return { price, quantity, total: askTotal };
    });

  return { bids, asks };
}

export function computeMicroprice(
  bids: Array<{ price: number; quantity: number }>,
  asks: Array<{ price: number; quantity: number }>,
  fallbackPrice: number,
) {
  const bestBid = bids[0];
  const bestAsk = asks[0];
  if (!bestBid && !bestAsk) return fallbackPrice;
  if (!bestBid) return bestAsk!.price;
  if (!bestAsk) return bestBid.price;
  const bidSize = bestBid.quantity;
  const askSize = bestAsk.quantity;
  if (bidSize + askSize <= 0) return round2((bestBid.price + bestAsk.price) / 2);
  return round2((bestAsk.price * bidSize + bestBid.price * askSize) / (bidSize + askSize));
}

async function updateProjectMark(projectId: string, fallbackPrice: number, lastExecutionPrice?: number) {
  const project = await ProjectModel.findOne({ id: projectId });
  if (!project) throw new Error("Project not found.");
  const { bids, asks } = await buildRealOrderBook(projectId);
  const mark = lastExecutionPrice ?? computeMicroprice(bids, asks, project.price || fallbackPrice);
  const prev = project.price || fallbackPrice;
  project.price = round2(mark);
  project.change = round2(project.price - prev);
  project.changePercent = prev > 0 ? round2((project.change / prev) * 100) : 0;
  project.marketCap = formatMarketCapCr(project.price);
  project.sparkline = [...(project.sparkline ?? []).slice(-23), project.price];
  await project.save();

  const holdings = await HoldingModel.find({ projectId }).sort({ createdAt: 1 });
  for (const holding of holdings) {
    holding.currentPrice = project.price;
    holding.currentValue = round2(holding.quantity * project.price);
    await holding.save();
    await recomputeWalletSummary(holding.userId);
  }

  if (!lastExecutionPrice) {
    const imbalance = bids.reduce((s, b) => s + b.quantity, 0) - asks.reduce((s, a) => s + a.quantity, 0);
    if (Math.abs(imbalance) > 0) {
      await upsertCandle(projectId, project.price, 0, 0);
    }
  }
  return { price: project.price, bids, asks };
}

export async function placeAndMatchOrder(input: PlaceOrderInput) {
  const project = await ProjectModel.findOne({ id: input.projectId });
  if (!project) throw new Error("Project not found.");
  if (!Number.isFinite(input.quantity) || input.quantity <= 0) throw new Error("Quantity must be positive.");
  if (input.type === "limit" && (!input.limitPrice || input.limitPrice <= 0)) {
    throw new Error("Limit orders require a positive limit price.");
  }

  const incoming = await OrderModel.create({
    id: `ord-${randomUUID().slice(0, 12)}`,
    projectId: input.projectId,
    userId: input.userId,
    side: input.side,
    type: input.type,
    limitPrice: input.limitPrice,
    quantity: input.quantity,
    remainingQuantity: input.quantity,
    status: "open",
    reservedAlgo: 0,
    reservedShares: 0,
  });

  if (input.side === "buy") {
    const wallet = await WalletModel.findOne({ userId: input.userId });
    if (!wallet) throw new Error("Wallet not found.");
    if (wallet.availableBalance === undefined) {
      wallet.availableBalance = wallet.balance;
      wallet.reservedBalance = 0;
    }
    const estimated = round2(reserveUnitPrice(incoming, project.price) * input.quantity);
    if (wallet.availableBalance < estimated) {
      const missing = round2(estimated - wallet.availableBalance);
      await incoming.deleteOne();
      throw new Error(`Insufficient ALGO. Available ${wallet.availableBalance}, required ${estimated}, missing ${missing}.`);
    }
    wallet.availableBalance = round2(wallet.availableBalance - estimated);
    wallet.reservedBalance = round2(wallet.reservedBalance + estimated);
    wallet.balance = round2(wallet.availableBalance + wallet.reservedBalance);
    incoming.reservedAlgo = estimated;
    await wallet.save();
    await incoming.save();
  } else {
    const holding = await ensureHolding(input.userId, project);
    const freeShares = round2(holding.quantity - (holding.reservedQuantity ?? 0));
    if (freeShares < input.quantity) {
      await incoming.deleteOne();
      throw new Error(`Insufficient shares. Available ${freeShares}, required ${input.quantity}.`);
    }
    holding.reservedQuantity = round2((holding.reservedQuantity ?? 0) + input.quantity);
    incoming.reservedShares = input.quantity;
    await holding.save();
    await incoming.save();
  }

  const oppositeSide: OrderSide = input.side === "buy" ? "sell" : "buy";
  const oppositeOrders = await OrderModel.find({
    projectId: input.projectId,
    side: oppositeSide,
    status: { $in: ["open", "partially_filled"] },
    remainingQuantity: { $gt: 0 },
    type: "limit",
  })
    .sort(oppositeSide === "sell" ? { limitPrice: 1, createdAt: 1 } : { limitPrice: -1, createdAt: 1 });

  const executions: Execution[] = [];
  for (const resting of oppositeOrders) {
    if (incoming.remainingQuantity <= 0) break;
    const crossable =
      input.type === "market" ||
      (input.side === "buy" ? (resting.limitPrice ?? Infinity) <= (incoming.limitPrice ?? Infinity) : (resting.limitPrice ?? 0) >= (incoming.limitPrice ?? 0));
    if (!crossable) break;

    const execQty = Math.min(incoming.remainingQuantity, resting.remainingQuantity);
    const execPrice = resting.limitPrice ?? incoming.limitPrice ?? project.price;
    incoming.remainingQuantity = round2(incoming.remainingQuantity - execQty);
    resting.remainingQuantity = round2(resting.remainingQuantity - execQty);
    incoming.status = incoming.remainingQuantity > 0 ? "partially_filled" : "filled";
    resting.status = resting.remainingQuantity > 0 ? "partially_filled" : "filled";

    const buyerOrder = input.side === "buy" ? incoming : resting;
    const sellerOrder = input.side === "sell" ? incoming : resting;
    const buyerUserId = buyerOrder.userId;
    const sellerUserId = sellerOrder.userId;
    executions.push({
      price: execPrice,
      quantity: execQty,
      buyOrderId: buyerOrder.id,
      sellOrderId: sellerOrder.id,
      buyerUserId,
      sellerUserId,
    });

    await applyBuyerFill(buyerUserId, project, buyerOrder, execQty, execPrice);
    await applySellerFill(sellerUserId, project, execQty, execPrice);
    await writeTrade(input.projectId, executions[executions.length - 1]!, input.side);
    await upsertCandle(input.projectId, execPrice, execQty);
    await resting.save();
  }

  await fillMarketRemainderAgainstLiquidity(incoming, input, input.projectId, executions);

  if (input.type === "market" && incoming.remainingQuantity > 0) {
    if (input.side === "buy") {
      const wallet = await WalletModel.findOne({ userId: input.userId });
      if (wallet && incoming.reservedAlgo > 0) {
        wallet.availableBalance = round2(wallet.availableBalance + incoming.reservedAlgo);
        wallet.reservedBalance = round2(Math.max(0, wallet.reservedBalance - incoming.reservedAlgo));
        wallet.balance = round2(wallet.availableBalance + wallet.reservedBalance);
        incoming.reservedAlgo = 0;
        await wallet.save();
      }
    } else {
      const holding = await HoldingModel.findOne({ userId: input.userId, projectId: input.projectId });
      if (holding && incoming.remainingQuantity > 0) {
        holding.reservedQuantity = round2(Math.max(0, (holding.reservedQuantity ?? 0) - incoming.remainingQuantity));
        await holding.save();
      }
    }
    incoming.remainingQuantity = 0;
    incoming.status = executions.length > 0 ? "filled" : "rejected";
    incoming.reservedShares = 0;
  } else if (input.type === "limit" && incoming.remainingQuantity > 0 && executions.length === 0) {
    incoming.status = "open";
  } else if (incoming.remainingQuantity <= 0) {
    incoming.status = "filled";
  }

  if (input.side === "buy" && input.type === "limit" && incoming.remainingQuantity > 0) {
    incoming.reservedAlgo = round2(reserveUnitPrice(incoming, project.price) * incoming.remainingQuantity);
  }

  if (input.side === "sell" && incoming.status !== "open" && incoming.status !== "partially_filled") {
    incoming.reservedShares = 0;
  } else if (input.side === "sell") {
    incoming.reservedShares = incoming.remainingQuantity;
  }

  await incoming.save();
  await recomputeWalletSummary(input.userId);
  const lastExecutionPrice = executions[executions.length - 1]?.price;
  const { price, bids, asks } = await updateProjectMark(input.projectId, project.price, lastExecutionPrice);

  return {
    order: incoming.toObject(),
    executions,
    price,
    orderBook: { bids, asks },
    result: incoming.status,
  };
}

export async function cancelOpenOrder(orderId: string, userId: string) {
  const order = await OrderModel.findOne({ id: orderId, userId });
  if (!order) throw new Error("Order not found.");
  if (!["open", "partially_filled"].includes(order.status)) throw new Error("Order cannot be cancelled.");

  if (order.side === "buy" && order.reservedAlgo > 0) {
    const wallet = await WalletModel.findOne({ userId });
    if (wallet) {
      wallet.availableBalance = round2(wallet.availableBalance + order.reservedAlgo);
      wallet.reservedBalance = round2(Math.max(0, wallet.reservedBalance - order.reservedAlgo));
      wallet.balance = round2(wallet.availableBalance + wallet.reservedBalance);
      await wallet.save();
    }
    order.reservedAlgo = 0;
  }

  if (order.side === "sell" && order.reservedShares > 0) {
    const holding = await HoldingModel.findOne({ userId, projectId: order.projectId });
    if (holding) {
      holding.reservedQuantity = round2(Math.max(0, (holding.reservedQuantity ?? 0) - order.reservedShares));
      await holding.save();
    }
    order.reservedShares = 0;
  }

  order.remainingQuantity = 0;
  order.status = "cancelled";
  await order.save();
  await recomputeWalletSummary(userId);
  return order.toObject();
}
