import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/db";
import { CandleModel, ProjectModel, TradeModel } from "@/models";
import { derive24hStats } from "@/lib/server-data";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  await connectMongo();
  const { id } = await params;
  const project = await ProjectModel.findOne({ id }).lean();
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const [candles, tradesCount] = await Promise.all([
    CandleModel.find({ projectId: id, createdAt: { $gte: since } }).sort({ createdAt: -1 }).limit(48).lean(),
    TradeModel.countDocuments({ projectId: id, createdAt: { $gte: since } }),
  ]);
  const stats24h = derive24hStats(project, candles.map((c) => ({ close: c.close, high: c.high, low: c.low, volume: c.volume })));

  return NextResponse.json({
    ...project,
    stats24h: {
      ...stats24h,
      trades24h: tradesCount || stats24h.trades24h,
    },
  });
}

