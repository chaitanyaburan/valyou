import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/db";
import { getSessionFromCookies } from "@/lib/auth-session";
import { TradeModel } from "@/models";

export async function GET(req: Request) {
  await connectMongo();
  const session = await getSessionFromCookies();
  const url = new URL(req.url);
  const userId = session?.userId ?? url.searchParams.get("userId") ?? "demo";
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit") ?? "40")));

  const trades = await TradeModel.find({
    $or: [{ buyerUserId: userId }, { sellerUserId: userId }, { user: userId }],
  })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  const fills = trades.map((t) => {
    const side = t.buyerUserId === userId ? ("buy" as const) : t.sellerUserId === userId ? ("sell" as const) : (t.type as "buy" | "sell");
    const role = t.buyerUserId === userId ? "buyer" : t.sellerUserId === userId ? "seller" : "taker";
    return {
      id: t.id,
      projectId: t.projectId,
      side,
      role,
      price: t.price,
      quantity: t.quantity,
      time: t.time,
      createdAt: t.createdAt,
    };
  });

  return NextResponse.json({ userId, fills });
}
