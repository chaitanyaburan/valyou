import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/db";
import { getSessionFromCookies } from "@/lib/auth-session";
import { BatchProofSubmissionModel, ProjectModel, TransparencyLedgerModel } from "@/models";

async function nextSeq(projectId: string) {
  const last = await TransparencyLedgerModel.findOne({ projectId }).sort({ seq: -1 }).lean();
  return (last?.seq ?? 0) + 1;
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string; batchId: string }> }) {
  await connectMongo();
  const session = await getSessionFromCookies();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, batchId } = await params;
  const project = await ProjectModel.findOne({ id });
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  let body: { action?: "approve" | "reject"; reason?: string };
  try {
    body = (await req.json()) as { action?: "approve" | "reject"; reason?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  if (!body.action || !body.reason?.trim()) {
    return NextResponse.json({ error: "action and reason are required." }, { status: 400 });
  }

  const latest = await BatchProofSubmissionModel.findOne({ projectId: id, batchId }).sort({ createdAt: -1 });
  if (!latest) return NextResponse.json({ error: "No proof submission found for this batch." }, { status: 404 });

  latest.set({
    verifierResult: {
      ...latest.verifierResult,
      verificationStatus: body.action === "approve" ? "verified" : "rejected",
      checks: [...(latest.verifierResult?.checks ?? []), `manual_${body.action}`],
      riskFlags:
        body.action === "approve"
          ? (latest.verifierResult?.riskFlags ?? []).filter((f: string) => f !== "manual_reject")
          : [...(latest.verifierResult?.riskFlags ?? []), "manual_reject"],
    },
  });
  await latest.save();

  const now = new Date();
  project.set({
    batches: project.batches.map((b: Record<string, unknown> & { id: string; verifiedAt?: Date; riskFlags?: string[] }) =>
      b.id === batchId
        ? {
            ...b,
            verificationStatus: body.action === "approve" ? "verified" : "rejected",
            verifiedAt: body.action === "approve" ? now : b.verifiedAt,
            riskFlags:
              body.action === "approve"
                ? b.riskFlags?.filter((f: string) => f !== "manual_reject")
                : [...(b.riskFlags ?? []), "manual_reject"],
          }
        : b,
    ),
  });
  await project.save();

  await TransparencyLedgerModel.create({
    projectId: id,
    seq: await nextSeq(id),
    kind: body.action === "approve" ? "proof_verified" : "proof_rejected",
    actorUserId: session.userId,
    headline: `Manual review ${body.action}d for ${batchId}`,
    snapshot: {
      batchId,
      proofId: latest.id,
      reason: body.reason.trim(),
      action: body.action,
    },
  });

  return NextResponse.json({ success: true });
}

