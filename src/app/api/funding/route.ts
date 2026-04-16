import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/db";
import { FundingProjectModel } from "@/models";

export async function GET() {
  await connectMongo();
  const funding = await FundingProjectModel.find({
    $or: [{ segment: "startup" }, { segment: { $exists: false } }],
  })
    .sort({ createdAt: 1 })
    .lean();
  return NextResponse.json(funding);
}

