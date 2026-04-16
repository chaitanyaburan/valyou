import { NextResponse } from "next/server";
import { runCredibilityAnalysis } from "@/lib/credibility-run";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const github = (url.searchParams.get("github") || "").trim();
  const leetcode = (url.searchParams.get("leetcode") || "").trim();
  const codeforces = (url.searchParams.get("codeforces") || "").trim();

  const out = await runCredibilityAnalysis(github, leetcode, codeforces);
  if (!out.ok) {
    return NextResponse.json({ success: false, error: out.error, errors: out.errors }, { status: out.status });
  }
  return NextResponse.json(out.body);
}
