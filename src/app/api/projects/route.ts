import { NextResponse } from "next/server";
import { connectDb } from "@/lib/db";
import { defaultProjects, inMemoryState } from "@/lib/mock-store";
import { ProjectModel } from "@/lib/models";

export async function GET() {
  const dbReady = await connectDb();

  if (!dbReady) {
    return NextResponse.json({ projects: inMemoryState.projects });
  }

  const count = await ProjectModel.countDocuments();
  if (count === 0) {
    await ProjectModel.insertMany(defaultProjects, { ordered: false });
  }

  const projects = await ProjectModel.find().lean();
  return NextResponse.json({ projects });
}
