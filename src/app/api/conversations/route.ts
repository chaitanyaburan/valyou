import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/db";
import { ConversationModel } from "@/models";

export async function GET() {
  await connectMongo();
  const conversations = await ConversationModel.find().sort({ createdAt: -1 }).lean();
  return NextResponse.json(conversations);
}

