import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/db";
import { NotificationModel } from "@/models";

export async function GET(req: Request) {
  await connectMongo();
  const url = new URL(req.url);
  const userId = url.searchParams.get("userId") || "demo";
  const notifications = await NotificationModel.find({ userId }).sort({ createdAt: -1 }).lean();
  return NextResponse.json(notifications);
}

