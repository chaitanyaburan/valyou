import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/db";
import { ProjectModel } from "@/models";

export async function GET() {
  await connectMongo();
  const projects = await ProjectModel.find().sort({ createdAt: 1 }).lean();
  return NextResponse.json(projects);
}

