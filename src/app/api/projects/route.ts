import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/db";
import { getSessionFromCookies } from "@/lib/auth-session";
import type { Creator } from "@/lib/data";
import {
  buildInitialCandles,
  buildTransparencySnapshot,
  daysUntil,
  formatMarketCapCr,
  generateSparklineDeterministic,
  milestonesToBatches,
  newProjectSlugBase,
  parsePostProjectBody,
  pickCover,
  stakingTierFromScore,
} from "@/lib/project-publish";
import {
  CandleModel,
  ProjectFeedMetaModel,
  ProjectModel,
  TransparencyLedgerModel,
  UserProfileModel,
} from "@/models";

export async function GET() {
  await connectMongo();
  const projects = await ProjectModel.find().lean();
  return NextResponse.json({ projects });
}

export async function POST(req: Request) {
  try {
    await connectMongo();
  } catch {
    return NextResponse.json({ error: "Database unavailable." }, { status: 503 });
  }

  const session = await getSessionFromCookies();
  if (!session) {
    return NextResponse.json({ error: "Sign in to publish a project." }, { status: 401 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const parsed = parsePostProjectBody(json);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }
  const data = parsed.data;

  const profile = await UserProfileModel.findOne({ id: session.userId }).lean();
  if (!profile) {
    return NextResponse.json({ error: "Complete your profile before publishing." }, { status: 400 });
  }

  let projectId = newProjectSlugBase(data.title);
  let tries = 0;
  while (await ProjectModel.exists({ id: projectId })) {
    tries += 1;
    if (tries > 8) {
      return NextResponse.json(
        { error: "Could not allocate a unique project id. Try a different title." },
        { status: 409 },
      );
    }
    projectId = newProjectSlugBase(`${data.title}-${tries}`);
  }

  const batches = milestonesToBatches(data.milestones);
  const firstDeadline = batches[0]?.deadline ?? "";
  const price = data.initialPrice ?? 25;
  const cover = pickCover(projectId);
  const sparkline = generateSparklineDeterministic(price, projectId);

  const creator: Creator = {
    id: profile.id,
    name: profile.name,
    username: profile.username.startsWith("@") ? profile.username : `@${profile.username}`,
    avatar: profile.avatar,
    score: profile.score,
    consistency: Math.min(100, Math.max(20, profile.score - 5 + (profile.githubStreak % 11))),
    stakingLevel: stakingTierFromScore(profile.score),
  };

  const now = new Date();
  const publishedAtIso = now.toISOString();
  const milestoneLine = `${batches[0]?.title ?? "Build"} · transparency locked`;

  const projectDoc = {
    id: projectId,
    title: data.title,
    tagline: data.tagline,
    creatorId: creator.id,
    creator,
    price,
    change: 0,
    changePercent: 0,
    sparkline,
    volume: "0",
    marketCap: formatMarketCapCr(price),
    category: data.category,
    tags: data.tags,
    coverGradient: cover.coverGradient,
    coverIcon: cover.coverIcon,
    fundingGoal: data.fundingGoal,
    fundingRaised: 0,
    backers: 0,
    daysLeft: daysUntil(firstDeadline),
    milestone: milestoneLine,
    milestoneProgress: 5,
    filterCategory: "new" as const,
    timelineLocked: true,
    publicationLocked: true,
    publishedAt: now,
    batches,
  };

  try {
    await ProjectModel.create(projectDoc);
    await ProjectFeedMetaModel.create({
      projectId,
      description: data.feedDescription,
      likes: 0,
      comments: 0,
      timeAgo: "Just now",
    });

    await TransparencyLedgerModel.create({
      projectId,
      seq: 1,
      kind: "published",
      actorUserId: session.userId,
      headline: `Published: ${data.title}`,
      snapshot: buildTransparencySnapshot({
        projectId,
        title: data.title,
        tagline: data.tagline,
        batches,
        publishedAt: publishedAtIso,
      }),
    });

    await CandleModel.insertMany(buildInitialCandles(projectId, price));
    await UserProfileModel.updateOne({ id: session.userId }, { $inc: { projects: 1 } });
  } catch (e) {
    console.error("POST /api/projects", e);
    return NextResponse.json({ error: "Could not publish project. Try again." }, { status: 500 });
  }

  return NextResponse.json({ id: projectId, published: true });
}
