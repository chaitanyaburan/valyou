import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { connectMongo } from "@/lib/db";
import { getSessionFromCookies } from "@/lib/auth-session";
import { verifyProofPackage, type ProofEvidenceInput } from "@/lib/proof-verifier";
import { BatchProofSubmissionModel, ProjectModel, TransparencyLedgerModel, UserProfileModel } from "@/models";

async function nextSeq(projectId: string) {
  const last = await TransparencyLedgerModel.findOne({ projectId }).sort({ seq: -1 }).lean();
  return (last?.seq ?? 0) + 1;
}

async function appendLedger(projectId: string, actorUserId: string, kind: string, headline: string, snapshot: Record<string, unknown>) {
  await TransparencyLedgerModel.create({
    projectId,
    seq: await nextSeq(projectId),
    kind,
    actorUserId,
    headline,
    snapshot,
  });
}

type Payload = {
  walletAddress?: string;
  signature?: string;
  payload?: string;
  evidence?: ProofEvidenceInput[];
};

export async function GET(_: Request, { params }: { params: Promise<{ id: string; batchId: string }> }) {
  await connectMongo();
  const { id, batchId } = await params;
  const submissions = await BatchProofSubmissionModel.find({ projectId: id, batchId }).sort({ createdAt: -1 }).lean();
  return NextResponse.json({ submissions });
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string; batchId: string }> }) {
  await connectMongo();
  const session = await getSessionFromCookies();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, batchId } = await params;
  const project = await ProjectModel.findOne({ id });
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });
  if (project.creatorId !== session.userId) {
    return NextResponse.json({ error: "Only the project owner can submit proof." }, { status: 403 });
  }

  const batch = project.batches.find((b: { id: string }) => b.id === batchId);
  if (!batch) return NextResponse.json({ error: "Batch not found." }, { status: 404 });

  let body: Payload;
  try {
    body = (await req.json()) as Payload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const walletAddress = (body.walletAddress || "").trim().toLowerCase();
  const signature = (body.signature || "").trim().toLowerCase();
  const payload = (body.payload || "").trim();
  const evidence = Array.isArray(body.evidence) ? body.evidence : [];

  if (!walletAddress || !signature || !payload || evidence.length === 0) {
    return NextResponse.json({ error: "walletAddress, signature, payload, and evidence are required." }, { status: 400 });
  }

  const submitter = await UserProfileModel.findOne({ id: session.userId }).lean();
  if (!submitter?.walletAddress) {
    return NextResponse.json({ error: "Set wallet address in profile before strict proof submission." }, { status: 400 });
  }
  if (submitter.walletAddress.toLowerCase() !== walletAddress) {
    return NextResponse.json({ error: "Wallet address must match profile wallet address." }, { status: 400 });
  }

  const previousHashes = await BatchProofSubmissionModel.find({ projectId: { $ne: id } }).select({ artifactHashes: 1 }).lean();
  const existingHashes = new Set(previousHashes.flatMap((x) => x.artifactHashes ?? []));

  const verifier = await verifyProofPackage({
    projectId: id,
    batchId,
    payload,
    walletAddress,
    signature,
    evidence,
    expectedRepoPrefix: submitter.credibilityGithub ? `github.com/${submitter.credibilityGithub}` : undefined,
    existingHashes,
  });

  const proofId = `${id}-${batchId}-${randomUUID().slice(0, 8)}`;
  const now = new Date();

  await BatchProofSubmissionModel.create({
    id: proofId,
    projectId: id,
    batchId,
    submitterUserId: session.userId,
    walletAddress,
    signature,
    payload,
    evidence,
    artifactHashes: verifier.artifactHashes,
    verifierResult: {
      verificationStatus: verifier.verificationStatus,
      verificationScore: verifier.verificationScore,
      riskFlags: verifier.riskFlags,
      checks: verifier.checks,
    },
  });

  const newBatches = project.batches.map((b: Record<string, unknown> & { id: string; status: string; title: string }) => {
    if (b.id !== batchId) return b;
    const nextStatus = verifier.verificationStatus === "blocked" ? "blocked" : b.status;
    return {
      ...b,
      status: nextStatus,
      proofPackageId: proofId,
      verificationStatus: verifier.verificationStatus,
      verificationScore: verifier.verificationScore,
      riskFlags: verifier.riskFlags,
      submittedAt: now,
      verifiedAt: verifier.verificationStatus === "verified" ? now : undefined,
      lastInvestorUpdate: now.toISOString().slice(0, 10),
    };
  });

  project.set({
    batches: newBatches,
    milestone: `${batch.title} · ${verifier.verificationStatus.replace("_", " ")}`,
  });

  const penalties: { scoreDelta: number; priceMultiplier: number; reason: string }[] = [];
  if (verifier.verificationStatus === "blocked") {
    penalties.push({ scoreDelta: -30, priceMultiplier: 0.75, reason: "Confirmed fraud risk from strict verifier" });
  } else if (verifier.verificationStatus === "rejected") {
    penalties.push({ scoreDelta: -8, priceMultiplier: 0.94, reason: "Invalid proof package" });
  } else if (verifier.verificationStatus === "needs_review") {
    penalties.push({ scoreDelta: -3, priceMultiplier: 0.98, reason: "Proof requires manual review" });
  }

  for (const p of penalties) {
    project.price = Number((project.price * p.priceMultiplier).toFixed(2));
    project.change = Number((project.change - Math.abs(project.change * (1 - p.priceMultiplier))).toFixed(2));
    project.changePercent = Number(((project.change / Math.max(1, project.price)) * 100).toFixed(2));
    project.dispute = {
      id: project.dispute?.id || `dispute-${proofId}`,
      reportedBy: "system",
      reason: p.reason,
      proofLinks: [],
      votesFor: project.dispute?.votesFor ?? 0,
      votesAgainst: project.dispute?.votesAgainst ?? 0,
      status: verifier.verificationStatus === "blocked" ? "open" : (project.dispute?.status ?? "open"),
      createdAt: project.dispute?.createdAt || now.toISOString(),
    };
    await UserProfileModel.updateOne({ id: session.userId }, { $inc: { score: p.scoreDelta } });
  }

  await project.save();

  await appendLedger(id, session.userId, "proof_submitted", `Proof submitted for ${batch.title}`, {
    proofId,
    batchId,
    verificationStatus: verifier.verificationStatus,
    verificationScore: verifier.verificationScore,
    riskFlags: verifier.riskFlags,
  });
  await appendLedger(
    id,
    session.userId,
    verifier.verificationStatus === "verified" ? "proof_verified" : "proof_rejected",
    `Proof ${verifier.verificationStatus} for ${batch.title}`,
    { proofId, batchId, checks: verifier.checks, riskFlags: verifier.riskFlags },
  );

  if (penalties.length > 0) {
    await appendLedger(id, session.userId, "penalty_applied", `Penalty applied (${verifier.verificationStatus})`, {
      batchId,
      proofId,
      penalties,
    });
  }
  if (verifier.verificationStatus === "blocked") {
    await appendLedger(id, session.userId, "project_suspended", "Project auto-flagged by anti-cheat", {
      batchId,
      proofId,
      reason: "strict_verifier_blocked",
    });
  }

  return NextResponse.json({
    proofId,
    verificationStatus: verifier.verificationStatus,
    verificationScore: verifier.verificationScore,
    riskFlags: verifier.riskFlags,
    checks: verifier.checks,
  });
}

