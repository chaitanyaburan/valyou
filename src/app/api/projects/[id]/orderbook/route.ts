import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/db";
import { ProjectModel, TradeModel } from "@/models";
import { deriveOrderBook } from "@/lib/server-data";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  await connectMongo();
  const { id } = await params;
  const [project, latestTrade] = await Promise.all([
    ProjectModel.findOne({ id }).lean(),
    TradeModel.findOne({ projectId: id }).sort({ createdAt: -1 }).lean(),
  ]);
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }
  const price = latestTrade?.price ?? project.price;
  return NextResponse.json(deriveOrderBook(price));
}

