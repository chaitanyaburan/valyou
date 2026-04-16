import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/db";
import { ProjectModel, TransparencyLedgerModel } from "@/models";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  await connectMongo();
  const { id } = await params;
  const [project, ledger] = await Promise.all([
    ProjectModel.findOne({ id }).lean(),
    TransparencyLedgerModel.find({ projectId: id }).sort({ seq: 1 }).lean(),
  ]);
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  return NextResponse.json({
    projectId: id,
    title: project.title,
    publicationLocked: Boolean(project.publicationLocked),
    publishedAt: project.publishedAt ?? null,
    timelineLocked: project.timelineLocked,
    /** Append-only audit entries; snapshots are immutable. */
    ledger,
  });
}
