import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/db";
import { UserProfileModel } from "@/models";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  await connectMongo();
  const { id } = await params;
  const profile = await UserProfileModel.findOne({ id }).lean();
  if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  return NextResponse.json(profile);
}

