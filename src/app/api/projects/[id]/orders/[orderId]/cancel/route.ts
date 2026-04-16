import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/db";
import { getSessionFromCookies } from "@/lib/auth-session";
import { cancelOpenOrder } from "@/lib/matching-engine";

async function resolveUserId() {
  const session = await getSessionFromCookies();
  return session?.userId ?? "demo";
}

export async function POST(
  _: Request,
  { params }: { params: Promise<{ id: string; orderId: string }> },
) {
  try {
    await connectMongo();
    const userId = await resolveUserId();
    const { orderId } = await params;
    const order = await cancelOpenOrder(orderId, userId);
    return NextResponse.json({ order });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not cancel order.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
