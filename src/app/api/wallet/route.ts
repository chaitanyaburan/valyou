import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/db";
import { WalletModel } from "@/models";

export async function GET(req: Request) {
  await connectMongo();
  const url = new URL(req.url);
  const userId = url.searchParams.get("userId") || "demo";
  const wallet = await WalletModel.findOne({ userId }).lean();
  if (!wallet) return NextResponse.json({ error: "Wallet not found" }, { status: 404 });
  return NextResponse.json(wallet);
}

