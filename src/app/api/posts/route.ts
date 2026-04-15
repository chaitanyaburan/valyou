import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/db";
import { PostModel } from "@/models";

export async function GET(req: Request) {
  await connectMongo();
  const url = new URL(req.url);
  const userId = url.searchParams.get("userId");
  const query = userId ? { userId } : {};
  const posts = await PostModel.find(query).sort({ createdAt: -1 }).lean();
  return NextResponse.json(posts);
}

