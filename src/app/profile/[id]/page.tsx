"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Avatar from "@/components/Avatar";
import ThemeToggle from "@/components/ThemeToggle";
import { getUserProfile, getPostsForUser, type Post } from "@/lib/social";
import { getCreatorById, projects } from "@/lib/data";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
};

const tabs = ["Posts", "Projects", "Endorsements"] as const;
type Tab = (typeof tabs)[number];

function generateHeatmap(): number[][] {
  const rows: number[][] = [];
  for (let r = 0; r < 7; r++) {
    const row: number[] = [];
    for (let c = 0; c < 20; c++) {
      const rand = Math.random();
      if (rand < 0.3) row.push(0);
      else if (rand < 0.55) row.push(1);
      else if (rand < 0.8) row.push(2);
      else row.push(3);
    }
    rows.push(row);
  }
  return rows;
}

const heatmapColors = [
  "bg-card-border",
  "bg-emerald-900",
  "bg-emerald-700",
  "bg-emerald-500",
];

function PostTypeBadge({ type }: { type: Post["type"] }) {
  if (type === "text") return null;

  const config = {
    milestone: { bg: "bg-gain/15 text-gain", label: "Milestone" },
    trade: { bg: "bg-blue-500/15 text-blue-400", label: "Trade" },
    project: { bg: "bg-purple-500/15 text-purple-400", label: "Project" },
  } as const;

  const c = config[type];
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${c.bg}`}>
      {c.label}
    </span>
  );
}

function CompactPostCard({ post }: { post: Post }) {
  return (
    <motion.div variants={item} className="glass-card p-4">
      <div className="flex items-center gap-2">
        <Avatar initials={post.userAvatar} size="sm" />
        <span className="text-sm font-semibold">{post.userName}</span>
        <span className="text-xs text-muted">· {post.timeAgo}</span>
        <PostTypeBadge type={post.type} />
      </div>
      <p className="mt-2 text-sm leading-relaxed text-foreground/90 line-clamp-3">{post.content}</p>
      <div className="mt-3 flex items-center gap-4 text-xs text-muted">
        <span className="flex items-center gap-1">
          <svg className={`h-3.5 w-3.5 ${post.liked ? "fill-loss text-loss" : "fill-none"}`} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
          </svg>
          {post.likes}
        </span>
        <span className="flex items-center gap-1">
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 01-.923 1.785A5.969 5.969 0 006 21c1.282 0 2.47-.402 3.445-1.087.81.22 1.668.337 2.555.337z" />
          </svg>
          {post.comments}
        </span>
        <span className="flex items-center gap-1">
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
          </svg>
          {post.endorsements}
        </span>
      </div>
    </motion.div>
  );
}

export default function ProfilePage() {
  const params = useParams();
  const id = params.id as string;
  const [activeTab, setActiveTab] = useState<Tab>("Posts");

  const profile = getUserProfile(id);
  const creator = getCreatorById(id);
  const creatorProjects = projects.filter((p) => p.creator.id === id);
  const userPosts = getPostsForUser(id);

  const heatmap = useMemo(() => generateHeatmap(), []);

  if (!profile) {
    return (
      <section className="flex min-h-[60vh] flex-col items-center justify-center gap-4 py-16">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <h1 className="text-2xl font-bold">Profile not found</h1>
          <p className="mt-2 text-muted">This user doesn&apos;t exist or has been removed.</p>
          <Link
            href="/"
            className="mt-4 inline-block rounded-full bg-accent px-6 py-2 text-sm font-semibold text-white transition hover:bg-accent-light"
          >
            Back to Home
          </Link>
        </motion.div>
      </section>
    );
  }

  const statItems = [
    { label: "Followers", value: profile.followers.toLocaleString() },
    { label: "Following", value: profile.following.toLocaleString() },
    { label: "Projects", value: profile.projects },
    { label: "Score", value: profile.score },
  ];

  return (
    <section className="py-8">
      {/* Cover Banner */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className={`relative h-48 w-full rounded-b-2xl bg-gradient-to-r ${profile.coverGradient}`}
      >
        <div className="absolute inset-0 rounded-b-2xl bg-black/20" />
      </motion.div>

      {/* Profile Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="relative -mt-12 px-4 sm:px-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-end sm:gap-6">
          <div className="rounded-full border-4 border-background">
            <Avatar initials={profile.avatar} size="lg" />
          </div>
          <div className="mt-3 flex-1 sm:mt-0">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{profile.name}</h1>
              {profile.isVerified && (
                <svg className="h-5 w-5 text-blue-400" viewBox="0 0 24 24" fill="currentColor">
                  <path fillRule="evenodd" d="M8.603 3.799A4.49 4.49 0 0112 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 013.498 1.307 4.491 4.491 0 011.307 3.497A4.49 4.49 0 0121.75 12a4.49 4.49 0 01-1.549 3.397 4.491 4.491 0 01-1.307 3.497 4.491 4.491 0 01-3.497 1.307A4.49 4.49 0 0112 21.75a4.49 4.49 0 01-3.397-1.549 4.49 4.49 0 01-3.498-1.306 4.491 4.491 0 01-1.307-3.498A4.49 4.49 0 012.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 011.307-3.497 4.49 4.49 0 013.497-1.307zm7.007 6.387a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            <p className="text-sm text-muted">{profile.username}</p>
          </div>
        </div>

        <p className="mt-4 max-w-xl text-sm leading-relaxed text-foreground/80">{profile.bio}</p>

        {/* Stats Row */}
        <div className="mt-5 flex flex-wrap gap-6">
          {statItems.map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-lg font-bold">{s.value}</p>
              <p className="text-xs text-muted">{s.label}</p>
            </div>
          ))}
          {creator && (
            <div className="text-center">
              <p className="text-lg font-bold text-accent-light">{creator.stakingLevel}</p>
              <p className="text-xs text-muted">Tier</p>
            </div>
          )}
        </div>

        {/* Action Buttons + theme */}
        <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-3">
          <div className="flex flex-wrap gap-3">
            <button className="rounded-full bg-accent px-6 py-2 text-sm font-semibold text-white transition hover:bg-accent-light">
              Invest
            </button>
            <button className="rounded-full border border-card-border px-6 py-2 text-sm font-semibold text-foreground transition hover:border-accent/50 hover:text-accent-light">
              Endorse
            </button>
            <button className="rounded-full border border-card-border px-6 py-2 text-sm font-semibold text-foreground transition hover:border-accent/50 hover:text-accent-light">
              Message
            </button>
          </div>
          <div className="flex items-center gap-2 sm:justify-end">
            <span className="text-xs text-muted whitespace-nowrap">Theme</span>
            <ThemeToggle />
          </div>
        </div>

        {/* Skills */}
        <div className="mt-5 flex flex-wrap gap-2">
          {profile.skills.map((skill) => (
            <span
              key={skill}
              className="rounded-full bg-accent/10 px-3 py-1 text-xs text-accent-light"
            >
              {skill}
            </span>
          ))}
        </div>
      </motion.div>

      {/* Cards Grid */}
      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {/* GitHub Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="glass-card p-5"
        >
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5 text-foreground" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
            <h3 className="text-sm font-semibold">GitHub</h3>
          </div>

          <div className="mt-4 flex gap-6">
            <div className="text-center">
              <p className="text-lg font-bold">{profile.githubRepos}</p>
              <p className="text-xs text-muted">Repos</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold">{profile.githubStars.toLocaleString()}</p>
              <p className="text-xs text-muted">Stars</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold">{profile.githubStreak}</p>
              <p className="text-xs text-muted">Day Streak</p>
            </div>
          </div>

          {/* Contribution Heatmap */}
          <div className="mt-4 overflow-hidden">
            <div className="flex flex-col gap-[3px]">
              {heatmap.map((row, ri) => (
                <div key={ri} className="flex gap-[3px]">
                  {row.map((intensity, ci) => (
                    <div
                      key={ci}
                      className={`h-[10px] w-[10px] rounded-[2px] ${heatmapColors[intensity]}`}
                    />
                  ))}
                </div>
              ))}
            </div>
            <p className="mt-2 text-[10px] text-muted">Contributions in the last 20 weeks</p>
          </div>
        </motion.div>

        {/* LinkedIn Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="glass-card p-5"
        >
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5 text-[#0A66C2]" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
            </svg>
            <h3 className="text-sm font-semibold">LinkedIn</h3>
          </div>

          <div className="mt-4 flex gap-6">
            <div className="text-center">
              <p className="text-lg font-bold">{profile.linkedinConnections.toLocaleString()}</p>
              <p className="text-xs text-muted">Connections</p>
            </div>
          </div>

          <p className="mt-4 text-xs text-muted">
            Joined: {profile.joinedDate}
          </p>
        </motion.div>
      </div>

      {/* Tabs */}
      <div className="mt-8">
        <div className="flex gap-1 border-b border-card-border">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`relative px-5 py-3 text-sm font-medium transition ${
                activeTab === tab ? "text-accent-light" : "text-muted hover:text-foreground"
              }`}
            >
              {tab}
              {activeTab === tab && (
                <motion.div
                  layoutId="profile-tab-indicator"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {activeTab === "Posts" && (
            <motion.div
              key="posts"
              variants={container}
              initial="hidden"
              animate="show"
              exit={{ opacity: 0 }}
              className="mt-4 grid gap-4 sm:grid-cols-2"
            >
              {userPosts.length > 0 ? (
                userPosts.map((post) => <CompactPostCard key={post.id} post={post} />)
              ) : (
                <motion.p variants={item} className="col-span-full py-12 text-center text-muted">
                  No posts yet.
                </motion.p>
              )}
            </motion.div>
          )}

          {activeTab === "Projects" && (
            <motion.div
              key="projects"
              variants={container}
              initial="hidden"
              animate="show"
              exit={{ opacity: 0 }}
              className="mt-4 grid gap-4 sm:grid-cols-2"
            >
              {creatorProjects.length > 0 ? (
                creatorProjects.map((p) => (
                  <motion.div key={p.id} variants={item}>
                    <Link href={`/trade/${p.id}`} className="block">
                      <div className="glass-card p-4 transition-transform hover:scale-[1.02]">
                        <div className="flex items-center gap-3">
                          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${p.coverGradient}`}>
                            <svg className="h-5 w-5 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d={p.coverIcon} /></svg>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-sm truncate">{p.title}</p>
                            <p className="text-xs text-muted">{p.tagline}</p>
                          </div>
                        </div>
                        <div className="mt-3 flex items-center justify-between text-xs">
                          <span className="font-bold tabular-nums">{p.price.toFixed(2)} VALU</span>
                          <span className={p.changePercent >= 0 ? "text-gain font-medium" : "text-loss font-medium"}>
                            {p.changePercent >= 0 ? "+" : ""}{p.changePercent.toFixed(2)}%
                          </span>
                          <span className="text-muted">{p.backers.toLocaleString()} backers</span>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))
              ) : (
                <motion.p variants={item} className="col-span-full py-12 text-center text-muted">
                  No projects yet.
                </motion.p>
              )}
            </motion.div>
          )}

          {activeTab === "Endorsements" && (
            <motion.div
              key="endorsements"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center py-16"
            >
              <div className="text-center">
                <svg className="mx-auto h-12 w-12 text-muted/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                </svg>
                <p className="mt-3 text-sm text-muted">Endorsements coming soon</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
