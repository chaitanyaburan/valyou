import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/db";
import { getSessionFromCookies } from "@/lib/auth-session";
import { HoldingModel } from "@/models";

export async function GET(req: Request) {
  await connectMongo();
  const session = await getSessionFromCookies();
  const url = new URL(req.url);
  const userId = session?.userId ?? url.searchParams.get("userId") ?? "demo";
  const holdings = await HoldingModel.find({ userId }).sort({ createdAt: 1 });
  let touched = false;
  for (const holding of holdings) {
    if (holding.reservedQuantity === undefined) {
      holding.reservedQuantity = 0;
      touched = true;
      await holding.save();
    }
  }
  return NextResponse.json(touched ? holdings.map((h) => h.toObject()) : holdings.map((h) => h.toObject()));
}

