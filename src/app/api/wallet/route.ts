import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/db";
import { getSessionFromCookies } from "@/lib/auth-session";
import { WalletModel } from "@/models";

function round2(n: number) {
  return Number(n.toFixed(2));
}

async function ensureWalletFields(wallet: Awaited<ReturnType<typeof WalletModel.findOne>>) {
  if (!wallet) return;
  if (wallet.availableBalance === undefined) {
    wallet.availableBalance = wallet.balance;
    wallet.reservedBalance = 0;
    await wallet.save();
  }
}

export async function GET(req: Request) {
  await connectMongo();
  const url = new URL(req.url);
  const session = await getSessionFromCookies();
  const userId = session?.userId ?? url.searchParams.get("userId") ?? "demo";
  const wallet = await WalletModel.findOne({ userId });
  if (!wallet) return NextResponse.json({ error: "Wallet not found" }, { status: 404 });
  await ensureWalletFields(wallet);
  return NextResponse.json(wallet.toObject());
}

/**
 * Withdraw from the in-app ALGO ledger. Top-ups are only via Razorpay (`/api/wallet/razorpay/*`).
 */
export async function POST(req: Request) {
  try {
    await connectMongo();
    const session = await getSessionFromCookies();
    if (!session) {
      return NextResponse.json({ error: "Sign in to manage your app wallet balance." }, { status: 401 });
    }

    const body = (await req.json()) as { action?: string; amount?: number };
    const action = body.action;
    const amount = Number(body.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: "Enter a positive amount." }, { status: 400 });
    }
    if (amount > 100_000) {
      return NextResponse.json({ error: "Amount exceeds per-request limit (100,000 ALGO)." }, { status: 400 });
    }

    const wallet = await WalletModel.findOne({ userId: session.userId });
    if (!wallet) {
      return NextResponse.json({ error: "Wallet not found for this account." }, { status: 404 });
    }
    await ensureWalletFields(wallet);

    if (action === "credit") {
      return NextResponse.json(
        { error: "Direct credits are disabled. Use Razorpay on the wallet page to add ALGO." },
        { status: 403 },
      );
    }

    if (action === "withdraw") {
      if (wallet.availableBalance < amount) {
        return NextResponse.json(
          { error: `Insufficient available ALGO. Available ${wallet.availableBalance}, requested ${amount}.` },
          { status: 400 },
        );
      }
      wallet.availableBalance = round2(wallet.availableBalance - amount);
      wallet.balance = round2(wallet.availableBalance + wallet.reservedBalance);
      await wallet.save();
      return NextResponse.json({ ok: true, wallet: wallet.toObject() });
    }

    return NextResponse.json({ error: "Unsupported action. Use withdraw, or top up via Razorpay." }, { status: 400 });
  } catch (e) {
    console.error("POST /api/wallet", e);
    return NextResponse.json({ error: "Could not update wallet." }, { status: 500 });
  }
}

