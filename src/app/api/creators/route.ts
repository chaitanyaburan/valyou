import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/db";
import { CreatorModel } from "@/models";

export async function GET() {
  await connectMongo();
  const creators = await CreatorModel.find().sort({ createdAt: 1 }).lean();
  return NextResponse.json(creators);
}

