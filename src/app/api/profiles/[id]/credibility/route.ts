import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/db";
import { getSessionFromCookies } from "@/lib/auth-session";
import { runCredibilityAnalysis, type CredibilityApiResponse } from "@/lib/credibility-run";
import { UserProfileModel } from "@/models";

const CACHE_MS = 24 * 60 * 60 * 1000;

function getHandles(doc: {
  credibilityGithub?: string;
  credibilityLeetcode?: string;
  credibilityCodeforces?: string;
}) {
  return {
    github: (doc.credibilityGithub || "").trim(),
    leetcode: (doc.credibilityLeetcode || "").trim(),
    codeforces: (doc.credibilityCodeforces || "").trim(),
  };
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  await connectMongo();
  const { id } = await params;
  const url = new URL(req.url);
  const force = url.searchParams.get("refresh") === "1" || url.searchParams.get("refresh") === "true";

  const doc = await UserProfileModel.findOne({ id }).lean();
  if (!doc) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  const handles = getHandles(doc);
  const hasHandles = Boolean(handles.github || handles.leetcode || handles.codeforces);
  if (!hasHandles) {
    return NextResponse.json({
      handles,
      result: null,
      fromCache: false,
      computedAt: null,
    });
  }

  const computedAt = doc.credibilityAt ? new Date(doc.credibilityAt).getTime() : 0;
  const cacheFresh = computedAt && Date.now() - computedAt < CACHE_MS;
  const cached = doc.credibilityResult as CredibilityApiResponse | null | undefined;

  if (cached && cacheFresh && !force) {
    return NextResponse.json({
      handles,
      result: cached,
      fromCache: true,
      computedAt: doc.credibilityAt?.toISOString() ?? null,
    });
  }

  const out = await runCredibilityAnalysis(handles.github, handles.leetcode, handles.codeforces);
  if (!out.ok) {
    if (cached) {
      return NextResponse.json({
        handles,
        result: cached,
        fromCache: true,
        stale: true,
        warning: out.error,
        errors: out.errors,
        computedAt: doc.credibilityAt?.toISOString() ?? null,
      });
    }
    return NextResponse.json(
      { handles, result: null, error: out.error, errors: out.errors },
      { status: 502 },
    );
  }

  await UserProfileModel.updateOne(
    { id },
    {
      $set: {
        credibilityResult: out.body,
        credibilityAt: new Date(),
      },
    },
  );

  return NextResponse.json({
    handles,
    result: out.body,
    fromCache: false,
    computedAt: new Date().toISOString(),
  });
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSessionFromCookies();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  if (session.userId !== id) {
    return NextResponse.json({ error: "You can only update your own profile." }, { status: 403 });
  }

  let body: { github?: string; leetcode?: string; codeforces?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const github = typeof body.github === "string" ? body.github.trim() : "";
  const leetcode = typeof body.leetcode === "string" ? body.leetcode.trim() : "";
  const codeforces = typeof body.codeforces === "string" ? body.codeforces.trim() : "";

  if (!github && !leetcode && !codeforces) {
    return NextResponse.json(
      { error: "Provide at least one handle: github, leetcode, or codeforces." },
      { status: 400 },
    );
  }

  await connectMongo();
  const exists = await UserProfileModel.exists({ id });
  if (!exists) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  const out = await runCredibilityAnalysis(github, leetcode, codeforces);
  if (!out.ok) {
    return NextResponse.json({ success: false, error: out.error, errors: out.errors }, { status: out.status });
  }

  await UserProfileModel.updateOne(
    { id },
    {
      $set: {
        credibilityGithub: github,
        credibilityLeetcode: leetcode,
        credibilityCodeforces: codeforces,
        credibilityResult: out.body,
        credibilityAt: new Date(),
      },
    },
  );

  return NextResponse.json({
    handles: { github, leetcode, codeforces },
    result: out.body,
    fromCache: false,
    computedAt: new Date().toISOString(),
  });
}
