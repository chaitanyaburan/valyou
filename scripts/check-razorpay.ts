import { getRazorpay, getRazorpayKeyId, isRazorpayWalletConfigured } from "../src/lib/razorpay-wallet";

async function main() {
  const ok = isRazorpayWalletConfigured();
  console.log("isRazorpayWalletConfigured:", ok);
  if (!ok) {
    console.error("Missing RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET (check env.local or .env.local).");
    process.exit(1);
  }
  const prefix = getRazorpayKeyId().slice(0, 12);
  console.log("key_id prefix:", prefix);
  const rp = getRazorpay();
  const order = await rp.orders.create({
    amount: 100,
    currency: "INR",
    receipt: `chk_${Date.now()}`.slice(0, 40),
  });
  console.log("razorpay_orders.create: OK", order.id);
}

main().catch((e) => {
  console.error("Razorpay check failed:", e?.message ?? e);
  process.exit(1);
});
