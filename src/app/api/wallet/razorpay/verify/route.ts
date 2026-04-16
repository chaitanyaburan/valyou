import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { connectMongo, getEnvValue } from "@/lib/db";
import { getSessionFromCookies } from "@/lib/auth-session";
import { isRazorpayWalletConfigured } from "@/lib/razorpay-wallet";
import { RazorpayWalletOrderModel, WalletModel } from "@/models";

function round2(n: number) {
  return Number(n.toFixed(2));
}

async function ensureWalletBalances(wallet: NonNullable<Awaited<ReturnType<typeof WalletModel.findOne>>>) {
  if (wallet.availableBalance === undefined) {
    wallet.availableBalance = wallet.balance;
    wallet.reservedBalance = 0;
    await wallet.save();
  }
}

export async function POST(req: Request) {
  try {
    if (!isRazorpayWalletConfigured()) {
      return NextResponse.json({ error: "Razorpay is not configured on this server." }, { status: 503 });
    }

    const session = await getSessionFromCookies();
    if (!session) {
      return NextResponse.json({ error: "Sign in to complete top-up." }, { status: 401 });
    }

    let body: {
      razorpay_order_id?: string;
      razorpay_payment_id?: string;
      razorpay_signature?: string;
    };
    try {
      body = (await req.json()) as typeof body;
    } catch {
      return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
    }

    const orderId = typeof body.razorpay_order_id === "string" ? body.razorpay_order_id.trim() : "";
    const paymentId = typeof body.razorpay_payment_id === "string" ? body.razorpay_payment_id.trim() : "";
    const signature = typeof body.razorpay_signature === "string" ? body.razorpay_signature.trim() : "";
    if (!orderId || !paymentId || !signature) {
      return NextResponse.json({ error: "Missing payment fields." }, { status: 400 });
    }

    const secret = getEnvValue("RAZORPAY_KEY_SECRET")?.trim();
    if (!secret) {
      return NextResponse.json({ error: "Server misconfiguration." }, { status: 500 });
    }

    const expected = crypto.createHmac("sha256", secret).update(`${orderId}|${paymentId}`).digest("hex");
    if (expected !== signature) {
      return NextResponse.json({ error: "Invalid payment signature." }, { status: 400 });
    }

    await connectMongo();

    const claimed = await RazorpayWalletOrderModel.findOneAndUpdate(
      { razorpayOrderId: orderId, userId: session.userId, status: "created" },
      { $set: { status: "paid", razorpayPaymentId: paymentId } },
      { new: true },
    ).lean();

    if (!claimed) {
      const existing = await RazorpayWalletOrderModel.findOne({
        razorpayOrderId: orderId,
        userId: session.userId,
      }).lean();
      if (existing?.status === "paid") {
        const wallet = await WalletModel.findOne({ userId: session.userId });
        if (!wallet) return NextResponse.json({ error: "Wallet not found." }, { status: 404 });
        await ensureWalletBalances(wallet);
        return NextResponse.json({ ok: true, alreadyProcessed: true, wallet: wallet.toObject() });
      }
      return NextResponse.json({ error: "Order not found or already used." }, { status: 404 });
    }

    const wallet = await WalletModel.findOne({ userId: session.userId });
    if (!wallet) {
      await RazorpayWalletOrderModel.updateOne(
        { razorpayOrderId: orderId, userId: session.userId },
        { $set: { status: "failed" } },
      );
      return NextResponse.json({ error: "Wallet not found." }, { status: 404 });
    }
    await ensureWalletBalances(wallet);

    const credit = round2(claimed.algoCredit);
    wallet.availableBalance = round2(wallet.availableBalance + credit);
    wallet.balance = round2(wallet.availableBalance + wallet.reservedBalance);
    await wallet.save();

    return NextResponse.json({ ok: true, wallet: wallet.toObject(), algoCredited: credit });
  } catch (e) {
    console.error("POST /api/wallet/razorpay/verify", e);
    return NextResponse.json({ error: "Could not verify payment." }, { status: 500 });
  }
}
