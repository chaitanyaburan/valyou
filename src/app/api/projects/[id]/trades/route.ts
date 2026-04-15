import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/db";
import { TradeModel } from "@/models";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  await connectMongo();
  const { id } = await params;
  const url = new URL(req.url);
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit") ?? "15")));
  const trades = await TradeModel.find({ projectId: id }).sort({ createdAt: -1 }).limit(limit).lean();
  const mapped = trades.map((t) => ({
    id: String(t._id),
    type: t.type,
    price: t.price,
    quantity: t.quantity,
    time: t.time,
    user: t.user,
  }));
  return NextResponse.json(mapped);
}

