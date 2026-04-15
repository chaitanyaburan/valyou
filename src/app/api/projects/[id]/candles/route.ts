import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/db";
import { CandleModel } from "@/models";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  await connectMongo();
  const { id } = await params;
  const url = new URL(req.url);
  const limit = Math.min(365, Math.max(7, Number(url.searchParams.get("limit") ?? "90")));
  const candles = await CandleModel.find({ projectId: id }).sort({ createdAt: -1 }).limit(limit).lean();
  const mapped = candles.reverse().map((c) => ({
    time: c.time,
    price: c.close,
    volume: c.volume,
    open: c.open,
    high: c.high,
    low: c.low,
    close: c.close,
  }));
  return NextResponse.json(mapped);
}

