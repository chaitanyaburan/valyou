import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/db";
import { ProjectModel } from "@/models";
import { buildRealOrderBook, computeMicroprice } from "@/lib/matching-engine";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  await connectMongo();
  const { id } = await params;
  const project = await ProjectModel.findOne({ id }).lean();
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }
  const { bids, asks } = await buildRealOrderBook(id);
  const microprice = computeMicroprice(bids, asks, project.price);
  return NextResponse.json({ bids, asks, microprice });
}

