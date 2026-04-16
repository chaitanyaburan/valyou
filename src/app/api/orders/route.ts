import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/db";
import { getSessionFromCookies } from "@/lib/auth-session";
import { OrderModel } from "@/models";

export async function GET() {
  await connectMongo();
  const session = await getSessionFromCookies();
  const userId = session?.userId ?? "demo";
  const orders = await OrderModel.find({
    userId,
    status: { $in: ["open", "partially_filled"] },
  })
    .sort({ createdAt: -1 })
    .lean();
  return NextResponse.json({ userId, orders });
}
