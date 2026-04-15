import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { inMemoryState, type InvestmentRecord } from "@/lib/mock-store";
import { InvestmentModel, ProjectModel, UserModel } from "@/lib/models";

export async function GET(request: NextRequest) {
  const wallet = request.nextUrl.searchParams.get("wallet");
  if (!wallet) {
    return NextResponse.json({ error: "wallet query param is required" }, { status: 400 });
  }

  const dbReady = await connectDb();
  if (!dbReady) {
    const investments = inMemoryState.investments.filter((i) => i.user_wallet === wallet);
    return NextResponse.json({ investments });
  }

  const investments = await InvestmentModel.find({ user_wallet: wallet })
    .sort({ createdAt: -1 })
    .lean();
  return NextResponse.json({ investments });
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as Partial<InvestmentRecord>;
  const { user_wallet, project_id, tokens_owned, transaction_hash } = body;

  if (!user_wallet || !project_id || !tokens_owned || !transaction_hash) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const dbReady = await connectDb();
  if (!dbReady) {
    const project = inMemoryState.projects.find((p) => p.id === project_id);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    project.sold_tokens += tokens_owned;

    const investment: InvestmentRecord = {
      user_wallet,
      project_id,
      tokens_owned,
      transaction_hash,
      created_at: new Date().toISOString(),
    };
    inMemoryState.investments.unshift(investment);
    return NextResponse.json({ investment }, { status: 201 });
  }

  await UserModel.updateOne(
    { wallet_address: user_wallet },
    { $setOnInsert: { wallet_address: user_wallet } },
    { upsert: true },
  );

  await ProjectModel.updateOne({ id: project_id }, { $inc: { sold_tokens: tokens_owned } });

  const investment = await InvestmentModel.create({
    user_wallet,
    project_id,
    tokens_owned,
    transaction_hash,
  });

  return NextResponse.json({ investment }, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const body = (await request.json()) as Partial<InvestmentRecord> & { transaction_hash?: string };
  const { user_wallet, project_id, tokens_owned, transaction_hash } = body;

  if (!user_wallet || !project_id || !tokens_owned || !transaction_hash) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const dbReady = await connectDb();
  if (!dbReady) {
    const index = inMemoryState.investments.findIndex(
      (item) =>
        item.user_wallet === user_wallet &&
        item.project_id === project_id &&
        item.transaction_hash === transaction_hash,
    );
    if (index === -1) {
      return NextResponse.json({ error: "Investment not found" }, { status: 404 });
    }

    inMemoryState.investments.splice(index, 1);
    const project = inMemoryState.projects.find((item) => item.id === project_id);
    if (project) {
      project.sold_tokens = Math.max(0, project.sold_tokens - tokens_owned);
    }
    return NextResponse.json({ success: true });
  }

  await InvestmentModel.deleteOne({
    user_wallet,
    project_id,
    transaction_hash,
  });
  await ProjectModel.updateOne({ id: project_id }, { $inc: { sold_tokens: -tokens_owned } });

  return NextResponse.json({ success: true });
}
