import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/db";
import { getSessionFromCookies } from "@/lib/auth-session";
import { buildRealOrderBook, placeAndMatchOrder } from "@/lib/matching-engine";
import { OrderModel } from "@/models";

async function resolveUserId() {
  const session = await getSessionFromCookies();
  return session?.userId ?? "demo";
}

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  await connectMongo();
  const userId = await resolveUserId();
  const { id } = await params;
  const [openOrders, orderBook] = await Promise.all([
    OrderModel.find({
      projectId: id,
      userId,
      status: { $in: ["open", "partially_filled"] },
    })
      .sort({ createdAt: -1 })
      .lean(),
    buildRealOrderBook(id),
  ]);
  return NextResponse.json({ userId, openOrders, ...orderBook });
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectMongo();
    const userId = await resolveUserId();
    const { id } = await params;
    const body = (await req.json()) as {
      side?: "buy" | "sell";
      type?: "market" | "limit";
      quantity?: number;
      limitPrice?: number;
    };
    const result = await placeAndMatchOrder({
      projectId: id,
      userId,
      side: body.side ?? "buy",
      type: body.type ?? "market",
      quantity: Number(body.quantity ?? 0),
      limitPrice: typeof body.limitPrice === "number" ? body.limitPrice : undefined,
    });
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not place order.";
    const isInsufficient = message.startsWith("Insufficient ");
    return NextResponse.json({ error: message }, { status: isInsufficient ? 400 : 500 });
  }
}
