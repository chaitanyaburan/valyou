import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/db";
import { StoryModel } from "@/models";

export async function GET() {
  await connectMongo();
  const stories = await StoryModel.find().sort({ createdAt: -1 }).lean();
  return NextResponse.json(stories);
}

