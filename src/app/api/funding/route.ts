import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/db";
import { FundingProjectModel } from "@/models";

export async function GET() {
  await connectMongo();
  const funding = await FundingProjectModel.find().sort({ createdAt: 1 }).lean();
  return NextResponse.json(funding);
}

