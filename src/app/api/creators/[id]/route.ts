import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/db";
import { CreatorModel } from "@/models";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  await connectMongo();
  const { id } = await params;
  const creator = await CreatorModel.findOne({ id }).lean();
  if (!creator) return NextResponse.json({ error: "Creator not found" }, { status: 404 });
  return NextResponse.json(creator);
}

