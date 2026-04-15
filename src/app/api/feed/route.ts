import { NextResponse } from "next/server";
import { connectMongo } from "@/lib/db";
import { ProjectFeedMetaModel, ProjectModel } from "@/models";
import { buildProjectFeedPost } from "@/lib/server-data";

export async function GET() {
  await connectMongo();
  const [projects, meta] = await Promise.all([
    ProjectModel.find().lean(),
    ProjectFeedMetaModel.find().lean(),
  ]);
  const metaByProject = new Map(meta.map((m) => [m.projectId, m]));
  const feed = projects
    .map((p) => {
      const m = metaByProject.get(p.id);
      if (!m) return null;
      return buildProjectFeedPost(p, {
        description: m.description,
        likes: m.likes,
        comments: m.comments,
        timeAgo: m.timeAgo,
      });
    })
    .filter(Boolean);
  return NextResponse.json(feed);
}

