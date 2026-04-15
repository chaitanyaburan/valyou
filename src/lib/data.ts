/* ──────────────────────────────────────────────
   Valyou — Mock Data Layer (Project-Centric)
   Trade PROJECTS, not people.
   ────────────────────────────────────────────── */

// ─── Creator (the person behind a project) ───
export interface Creator {
  id: string;
  name: string;
  username: string;
  avatar: string;
  score: number;
  consistency: number;
  stakingLevel: string;
}

// ─── Batch (immutable milestone with deadline) ───
export interface BatchTransparencyLink {
  label: string;
  href: string;
}

export interface Batch {
  id: string;
  title: string;
  description: string;
  deadline: string;
  completedAt?: string;
  status: "completed" | "in_progress" | "overdue" | "upcoming";
  priceImpact: number;
  /** Shipped items investors can verify */
  deliverablesDone?: string[];
  /** What the team is doing now (in progress / overdue) */
  workInProgress?: string[];
  /** What will happen in this batch once unlocked */
  plannedScope?: string[];
  /** Plain-language transparency line */
  transparencyNote?: string;
  /** Changelog, demo, repo, etc. */
  transparencyLinks?: BatchTransparencyLink[];
  /** Last time the creator posted an investor-facing update for this batch */
  lastInvestorUpdate?: string;
}

/** Resolved copy for the interactive investor timeline UI */
export interface BatchInvestorDetails {
  done: string[];
  active: string[];
  planned: string[];
  transparency: string;
  links: BatchTransparencyLink[];
  lastUpdateLabel: string | null;
}

export function getBatchInvestorDetails(batch: Batch): BatchInvestorDetails {
  const formatShort = (d: string) =>
    new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

  const done =
    batch.deliverablesDone?.length
      ? batch.deliverablesDone
      : batch.status === "completed"
        ? [
            `Milestone scope: ${batch.description}`,
            batch.completedAt
              ? `Marked complete ${formatShort(batch.completedAt)} (on or before deadline ${formatShort(batch.deadline)}).`
              : `Completed before ${formatShort(batch.deadline)}.`,
          ]
        : [];

  const active =
    batch.workInProgress?.length
      ? batch.workInProgress
      : batch.status === "in_progress" || batch.status === "overdue"
        ? [
            `Current work: ${batch.description}`,
            batch.status === "overdue"
              ? "This batch passed its immutable deadline. Trading continues; price and creator credibility decay daily until delivery is verified."
              : "Progress is tracked against the published deadline. Timeline cannot be shortened without a public investor update.",
          ]
        : [];

  const planned =
    batch.plannedScope?.length
      ? batch.plannedScope
      : batch.status === "upcoming"
        ? [
            `Planned when unlocked: ${batch.description}`,
            "Unlocks automatically after the previous batch is verified complete.",
          ]
        : [];

  const transparency =
    batch.transparencyNote ??
    "Dates and titles are locked when the project is published. Creators self-report completion; disputed or forked work can be flagged by the community.";

  const links = batch.transparencyLinks ?? [];

  const raw = batch.lastInvestorUpdate ?? batch.completedAt;
  const lastUpdateLabel = raw ? `Last update · ${formatShort(raw)}` : null;

  return { done, active, planned, transparency, links, lastUpdateLabel };
}

// ─── Dispute (community-driven theft protection) ───
export interface Dispute {
  id: string;
  reportedBy: string;
  reason: string;
  proofLinks: string[];
  votesFor: number;
  votesAgainst: number;
  status: "open" | "confirmed" | "cleared";
  createdAt: string;
}

// ─── Project health (computed from batches) ───
export interface ProjectHealth {
  adjustedPrice: number;
  adjustedCreatorScore: number;
  overdueDays: number;
  currentBatch: Batch | null;
  completedCount: number;
  totalBatches: number;
  batchStatus: "on_track" | "overdue" | "all_done";
}

// ─── Tradeable entity: a Project ───
export interface ProjectStock {
  id: string;
  title: string;
  tagline: string;
  creator: Creator;
  price: number;
  change: number;
  changePercent: number;
  sparkline: number[];
  volume: string;
  marketCap: string;
  category: string;
  tags: string[];
  coverGradient: string;
  coverIcon: string;
  fundingGoal: number;
  fundingRaised: number;
  backers: number;
  daysLeft: number;
  milestone: string;
  milestoneProgress: number;
  filterCategory: "trending" | "top" | "new";
  batches: Batch[];
  timelineLocked: boolean;
  dispute?: Dispute;
}

export interface Holding {
  projectId: string;
  title: string;
  creatorName: string;
  avatar: string;
  invested: number;
  currentValue: number;
  quantity: number;
  avgPrice: number;
  currentPrice: number;
}

export interface FundingProject {
  id: string;
  title: string;
  description: string;
  goal: number;
  raised: number;
  backers: number;
  reward: string;
  daysLeft: number;
  image: string;
}

export interface Coupon {
  id: string;
  code: string;
  title: string;
  discount: string;
  source: string;
  status: "active" | "used" | "expired";
  expiresAt: string;
}

// ─── Helpers ───

function generateSparkline(base: number, trend: number): number[] {
  const points: number[] = [];
  let val = base;
  for (let i = 0; i < 24; i++) {
    val += (Math.random() - 0.45) * trend * base * 0.02;
    val = Math.max(val * 0.7, val);
    points.push(parseFloat(val.toFixed(2)));
  }
  return points;
}

function generateChartData(base: number, days: number) {
  const data = [];
  let val = base * 0.7;
  const now = Date.now();
  for (let i = days; i >= 0; i--) {
    val += (Math.random() - 0.45) * base * 0.03;
    val = Math.max(base * 0.3, val);
    data.push({
      time: new Date(now - i * 86400000).toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
      price: parseFloat(val.toFixed(2)),
      volume: Math.floor(Math.random() * 50000 + 10000),
    });
  }
  return data;
}

// ─── Creators ───

export const creators: Creator[] = [
  { id: "sneha-iyer", name: "Sneha Iyer", username: "@snehaiyer", avatar: "SI", score: 96, consistency: 94, stakingLevel: "Diamond" },
  { id: "priya-patel", name: "Priya Patel", username: "@priyapatel", avatar: "PP", score: 89, consistency: 91, stakingLevel: "Platinum" },
  { id: "rahul-dev", name: "Rahul Dev", username: "@rahuldev", avatar: "RD", score: 71, consistency: 65, stakingLevel: "Gold" },
  { id: "anita-desai", name: "Anita Desai", username: "@anitadesai", avatar: "AD", score: 87, consistency: 82, stakingLevel: "Platinum" },
  { id: "amit-joshi", name: "Amit Joshi", username: "@amitjoshi", avatar: "AJ", score: 88, consistency: 85, stakingLevel: "Platinum" },
  { id: "meera-nair", name: "Meera Nair", username: "@meeranair", avatar: "MN", score: 91, consistency: 87, stakingLevel: "Platinum" },
  { id: "karan-mehta", name: "Karan Mehta", username: "@karanmehta", avatar: "KM", score: 55, consistency: 48, stakingLevel: "Bronze" },
  { id: "rohan-gupta", name: "Rohan Gupta", username: "@rohangupta", avatar: "RG", score: 76, consistency: 79, stakingLevel: "Gold" },
  { id: "arun-sharma", name: "Arun Sharma", username: "@arunsharma", avatar: "AS", score: 92, consistency: 88, stakingLevel: "Diamond" },
  { id: "divya-krishnan", name: "Divya Krishnan", username: "@divyak", avatar: "DK", score: 83, consistency: 76, stakingLevel: "Gold" },
  { id: "vikram-singh", name: "Vikram Singh", username: "@vikramsingh", avatar: "VS", score: 68, consistency: 72, stakingLevel: "Silver" },
  { id: "neha-kapoor", name: "Neha Kapoor", username: "@nehakapoor", avatar: "NK", score: 62, consistency: 58, stakingLevel: "Silver" },
];

function getCreator(id: string): Creator {
  return creators.find((c) => c.id === id) || creators[0];
}

// ─── Projects (tradeable stocks) ───

export const projects: ProjectStock[] = [
  {
    id: "ai-resume-builder",
    title: "AI-Powered Resume Builder",
    tagline: "Resumes that actually get callbacks",
    creator: getCreator("sneha-iyer"),
    price: 42.50, change: 3.25, changePercent: 8.3,
    sparkline: generateSparkline(42.5, 1), volume: "1.2M", marketCap: "48.7Cr",
    category: "AI / SaaS", tags: ["AI", "Career Tech", "SaaS"],
    coverGradient: "from-violet-600/30 via-purple-600/20 to-fuchsia-600/30",
    coverIcon: "M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z",
    fundingGoal: 500000, fundingRaised: 387500, backers: 1240, daysLeft: 12,
    milestone: "Beta launched — 500 signups", milestoneProgress: 78, filterCategory: "top",
    timelineLocked: true,
    batches: [
      {
        id: "b1", title: "Research & Validation", description: "User interviews, competitor analysis, PRD", deadline: "2025-11-15", completedAt: "2025-11-12", status: "completed", priceImpact: 5,
        deliverablesDone: ["28 user interviews across 4 personas", "Competitive matrix for 6 ATS tools", "PRD v2 signed off in Notion"],
        transparencyNote: "All interview notes anonymized; summary deck linked below.",
        transparencyLinks: [{ label: "Research summary (PDF)", href: "https://example.com/valyou/ai-resume/research-summary" }],
        lastInvestorUpdate: "2025-11-12",
      },
      {
        id: "b2", title: "Prototype", description: "Clickable Figma prototype + user testing", deadline: "2026-01-10", completedAt: "2026-01-08", status: "completed", priceImpact: 8,
        deliverablesDone: ["Figma prototype with 12 core flows", "Usability tests with 18 participants (Loom recordings)", "Design tokens exported to codebase"],
        transparencyLinks: [{ label: "Figma file (view)", href: "https://figma.com/file/example" }],
        lastInvestorUpdate: "2026-01-08",
      },
      {
        id: "b3", title: "Beta Launch", description: "Functional MVP with AI engine + 500 signups", deadline: "2026-03-30", completedAt: "2026-03-28", status: "completed", priceImpact: 12,
        deliverablesDone: ["MVP deployed on Vercel + custom domain", "512 signups in first 72h (PostHog dashboard)", "Stripe test mode + 42 paid beta upgrades"],
        transparencyNote: "Signup counts are from first-party analytics; dashboard snapshot weekly.",
        transparencyLinks: [{ label: "Beta metrics snapshot", href: "https://example.com/valyou/ai-resume/beta-metrics" }],
        lastInvestorUpdate: "2026-03-28",
      },
      {
        id: "b4", title: "Public Launch", description: "Full product launch with premium tier", deadline: "2026-05-15", status: "in_progress", priceImpact: 15,
        workInProgress: ["Pricing page A/B test (variant B leading +18%)", "SOC2 Type I readiness checklist 70% done", "Premium tier feature flag at 20% rollout"],
        transparencyNote: "Launch scope unchanged from published batch; no silent date moves.",
        transparencyLinks: [{ label: "Public changelog", href: "https://example.com/changelog" }, { label: "Status page", href: "https://status.example.com" }],
        lastInvestorUpdate: "2026-04-12",
      },
      {
        id: "b5", title: "Enterprise Tier", description: "API access, team features, enterprise sales", deadline: "2026-08-01", status: "upcoming", priceImpact: 10,
        plannedScope: ["REST API with scoped keys + usage billing", "Team workspaces + SSO (SAML)", "Sales playbook + 2 design-partner slots"],
        transparencyNote: "Enterprise batch unlocks only after Public Launch is verified complete.",
        lastInvestorUpdate: "2026-03-28",
      },
    ],
  },
  {
    id: "ux-audit-toolkit",
    title: "UX Audit Toolkit",
    tagline: "Auto accessibility reports for Figma",
    creator: getCreator("priya-patel"),
    price: 28.75, change: 1.40, changePercent: 5.1,
    sparkline: generateSparkline(28.75, 1), volume: "890K", marketCap: "31.2Cr",
    category: "Design / Tools", tags: ["Design", "Accessibility", "Figma"],
    coverGradient: "from-cyan-600/30 via-blue-600/20 to-indigo-600/30",
    coverIcon: "M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z M15 12a3 3 0 11-6 0 3 3 0 016 0z",
    fundingGoal: 200000, fundingRaised: 134000, backers: 720, daysLeft: 18,
    milestone: "Plugin alpha — 200 testers", milestoneProgress: 67, filterCategory: "trending",
    timelineLocked: true,
    batches: [
      { id: "b1", title: "Design Spec", description: "Plugin architecture + Figma API research", deadline: "2025-12-01", completedAt: "2025-11-28", status: "completed", priceImpact: 6 },
      { id: "b2", title: "Alpha Plugin", description: "Working Figma plugin with WCAG scanner", deadline: "2026-02-20", completedAt: "2026-02-18", status: "completed", priceImpact: 10 },
      { id: "b3", title: "Beta + Testers", description: "200 testers, feedback loop, iteration", deadline: "2026-05-01", status: "in_progress", priceImpact: 12 },
      { id: "b4", title: "Marketplace Launch", description: "Publish on Figma Community marketplace", deadline: "2026-07-15", status: "upcoming", priceImpact: 15 },
    ],
  },
  {
    id: "decentralized-skill-verification",
    title: "Decentralized Skill Verification",
    tagline: "On-chain skill badges employers trust",
    creator: getCreator("rahul-dev"),
    price: 15.20, change: -0.60, changePercent: -3.8,
    sparkline: generateSparkline(15.2, -1), volume: "2.1M", marketCap: "15.6Cr",
    category: "Blockchain / HR Tech", tags: ["Web3", "Solidity", "Identity"],
    coverGradient: "from-emerald-600/30 via-teal-600/20 to-green-600/30",
    coverIcon: "M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z",
    fundingGoal: 750000, fundingRaised: 412000, backers: 890, daysLeft: 24,
    milestone: "Smart contracts on testnet", milestoneProgress: 55, filterCategory: "trending",
    timelineLocked: true,
    batches: [
      { id: "b1", title: "Whitepaper", description: "Technical spec + tokenomics design", deadline: "2025-10-15", completedAt: "2025-10-14", status: "completed", priceImpact: 5 },
      { id: "b2", title: "Smart Contracts", description: "Deploy skill badge contracts on testnet", deadline: "2026-02-01", completedAt: "2026-02-10", status: "completed", priceImpact: 8 },
      {
        id: "b3", title: "Frontend dApp", description: "Web app for issuing and verifying badges", deadline: "2026-04-01", status: "overdue", priceImpact: 12,
        workInProgress: [
          "Wallet connect + network switcher merged to main",
          "Issue flow 80% — missing employer verification step",
          "E2E tests flaky on CI (fix in progress)",
        ],
        deliverablesDone: ["Next.js app scaffold + design system", "Read-only verify flow live on testnet"],
        transparencyNote: "Missed immutable deadline 1 Apr 2026. Daily price decay applies until batch is marked complete.",
        transparencyLinks: [
          { label: "GitHub main branch", href: "https://github.com/example/skill-verify" },
          { label: "CI runs (last 7d)", href: "https://github.com/example/skill-verify/actions" },
        ],
        lastInvestorUpdate: "2026-04-08",
      },
      { id: "b4", title: "Employer Portal", description: "Dashboard for employers to verify candidates", deadline: "2026-06-15", status: "upcoming", priceImpact: 10 },
      { id: "b5", title: "Mainnet Launch", description: "Deploy to Ethereum mainnet + audit", deadline: "2026-09-01", status: "upcoming", priceImpact: 15 },
    ],
  },
  {
    id: "mentor-match-platform",
    title: "Mentor Match Platform",
    tagline: "AI-matched mentorship sessions",
    creator: getCreator("anita-desai"),
    price: 55.80, change: 6.15, changePercent: 12.4,
    sparkline: generateSparkline(55.8, 1), volume: "3.4M", marketCap: "89.2Cr",
    category: "EdTech / AI", tags: ["Mentorship", "AI/ML", "EdTech"],
    coverGradient: "from-amber-600/30 via-orange-600/20 to-yellow-600/30",
    coverIcon: "M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z",
    fundingGoal: 300000, fundingRaised: 267000, backers: 2100, daysLeft: 5,
    milestone: "800 mentor matches — 94% satisfaction", milestoneProgress: 89, filterCategory: "top",
    timelineLocked: true,
    batches: [
      { id: "b1", title: "ML Model v1", description: "Compatibility scoring model trained", deadline: "2025-09-01", completedAt: "2025-08-28", status: "completed", priceImpact: 8 },
      { id: "b2", title: "MVP Platform", description: "Web app with matching + booking", deadline: "2025-12-15", completedAt: "2025-12-10", status: "completed", priceImpact: 10 },
      { id: "b3", title: "Scale to 800 Matches", description: "Onboard mentors, hit 800 matched pairs", deadline: "2026-03-15", completedAt: "2026-03-12", status: "completed", priceImpact: 12 },
      { id: "b4", title: "Mobile App", description: "iOS + Android apps with video calling", deadline: "2026-04-30", status: "in_progress", priceImpact: 15 },
    ],
  },
  {
    id: "cicd-pipeline-generator",
    title: "CI/CD Pipeline Generator",
    tagline: "Auto-generate GitHub Actions from your repo",
    creator: getCreator("amit-joshi"),
    price: 38.90, change: 2.44, changePercent: 6.7,
    sparkline: generateSparkline(38.9, 1), volume: "1.1M", marketCap: "42.1Cr",
    category: "DevOps / Tools", tags: ["DevOps", "CI/CD", "Automation"],
    coverGradient: "from-rose-600/30 via-pink-600/20 to-red-600/30",
    coverIcon: "M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5",
    fundingGoal: 400000, fundingRaised: 198000, backers: 650, daysLeft: 30,
    milestone: "MVP live — 150 repos analyzed", milestoneProgress: 50, filterCategory: "new",
    timelineLocked: true,
    batches: [
      { id: "b1", title: "Repo Analyzer", description: "Detect frameworks, languages, build tools", deadline: "2026-01-20", completedAt: "2026-01-18", status: "completed", priceImpact: 7 },
      { id: "b2", title: "Pipeline Templates", description: "Generate YAML for 10+ frameworks", deadline: "2026-03-15", completedAt: "2026-03-14", status: "completed", priceImpact: 10 },
      { id: "b3", title: "MVP Launch", description: "Public tool + 150 repos analyzed", deadline: "2026-05-10", status: "in_progress", priceImpact: 12 },
      { id: "b4", title: "Monorepo Support", description: "Multi-project detection + Docker/K8s", deadline: "2026-07-20", status: "upcoming", priceImpact: 8 },
      { id: "b5", title: "VS Code Extension", description: "One-click pipeline generation from editor", deadline: "2026-09-15", status: "upcoming", priceImpact: 13 },
    ],
  },
  {
    id: "hireiq-ml-hiring-engine",
    title: "HireIQ — ML Hiring Engine",
    tagline: "Predict candidate success before hiring",
    creator: getCreator("meera-nair"),
    price: 67.30, change: 2.70, changePercent: 4.2,
    sparkline: generateSparkline(67.3, 1), volume: "1.8M", marketCap: "64.5Cr",
    category: "AI / HR Tech", tags: ["Machine Learning", "Hiring", "AI"],
    coverGradient: "from-indigo-600/30 via-blue-600/20 to-sky-600/30",
    coverIcon: "M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6",
    fundingGoal: 800000, fundingRaised: 523000, backers: 1450, daysLeft: 15,
    milestone: "94% accuracy — enterprise pilot live", milestoneProgress: 65, filterCategory: "top",
    timelineLocked: true,
    batches: [
      { id: "b1", title: "Data Collection", description: "50K anonymized hiring outcomes dataset", deadline: "2025-10-01", completedAt: "2025-09-28", status: "completed", priceImpact: 6 },
      { id: "b2", title: "Model Training", description: "Achieve 90%+ accuracy on validation set", deadline: "2026-01-15", completedAt: "2026-01-10", status: "completed", priceImpact: 10 },
      { id: "b3", title: "Enterprise Pilot", description: "Live pilot with 3 companies, 94% accuracy", deadline: "2026-04-01", completedAt: "2026-03-30", status: "completed", priceImpact: 12 },
      { id: "b4", title: "Public API", description: "REST API with rate limiting + docs", deadline: "2026-05-30", status: "in_progress", priceImpact: 15 },
      { id: "b5", title: "Bias Audit Report", description: "Third-party fairness audit + publish results", deadline: "2026-08-15", status: "upcoming", priceImpact: 7 },
    ],
  },
  {
    id: "defi-lending-pool",
    title: "DeFi Lending Pool",
    tagline: "Peer-to-peer micro-loans on Solana",
    creator: getCreator("karan-mehta"),
    price: 8.45, change: -0.18, changePercent: -2.1,
    sparkline: generateSparkline(8.45, -1), volume: "450K", marketCap: "7.8Cr",
    category: "DeFi / Blockchain", tags: ["DeFi", "Solana", "Lending"],
    coverGradient: "from-lime-600/30 via-green-600/20 to-emerald-600/30",
    coverIcon: "M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    fundingGoal: 350000, fundingRaised: 87000, backers: 310, daysLeft: 40,
    milestone: "Audit passed — mainnet next week", milestoneProgress: 25, filterCategory: "new",
    timelineLocked: true,
    batches: [
      { id: "b1", title: "Smart Contract", description: "Lending pool contract on Solana devnet", deadline: "2026-01-30", completedAt: "2026-01-29", status: "completed", priceImpact: 8 },
      { id: "b2", title: "Security Audit", description: "Third-party audit with zero critical issues", deadline: "2026-04-10", completedAt: "2026-04-08", status: "completed", priceImpact: 10 },
      { id: "b3", title: "Mainnet Deploy", description: "Launch on Solana mainnet with liquidity", deadline: "2026-05-20", status: "in_progress", priceImpact: 15 },
    ],
    dispute: {
      id: "d1",
      reportedBy: "arun-sharma",
      reason: "This lending pool contract is a fork of Marinade Finance's open-source code with minimal modifications. Creator claimed it as original work.",
      proofLinks: [
        "https://github.com/marinade-finance/liquid-staking-program",
        "https://github.com/karan-mehta/defi-pool/commit/abc123",
      ],
      votesFor: 34,
      votesAgainst: 12,
      status: "open",
      createdAt: "2026-04-10",
    },
  },
  {
    id: "scaledb-auto-sharding",
    title: "ScaleDB — Auto-Sharding Engine",
    tagline: "Zero-downtime database scaling",
    creator: getCreator("rohan-gupta"),
    price: 22.10, change: 0.75, changePercent: 3.5,
    sparkline: generateSparkline(22.1, 1), volume: "780K", marketCap: "18.9Cr",
    category: "Infrastructure / DB", tags: ["Rust", "Postgres", "Infra"],
    coverGradient: "from-slate-600/30 via-gray-600/20 to-zinc-600/30",
    coverIcon: "M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125",
    fundingGoal: 600000, fundingRaised: 245000, backers: 530, daysLeft: 22,
    milestone: "Benchmark: 10x throughput vs vanilla PG", milestoneProgress: 41, filterCategory: "trending",
    timelineLocked: true,
    batches: [
      { id: "b1", title: "Core Engine", description: "Rust-based sharding logic + query router", deadline: "2026-01-15", completedAt: "2026-01-13", status: "completed", priceImpact: 8 },
      { id: "b2", title: "PG Extension", description: "Package as installable Postgres extension", deadline: "2026-03-20", completedAt: "2026-03-18", status: "completed", priceImpact: 10 },
      { id: "b3", title: "Benchmarks", description: "Prove 10x throughput vs vanilla Postgres", deadline: "2026-05-15", status: "in_progress", priceImpact: 12 },
      { id: "b4", title: "Cloud Hosting", description: "Managed ScaleDB-as-a-Service offering", deadline: "2026-08-01", status: "upcoming", priceImpact: 15 },
    ],
  },
];

// ─── Portfolio holdings ───

export const holdings: Holding[] = [
  {
    projectId: "ai-resume-builder",
    title: "AI-Powered Resume Builder",
    creatorName: "Sneha Iyer",
    avatar: "SI",
    invested: 2500,
    currentValue: 3120,
    quantity: 60,
    avgPrice: 41.67,
    currentPrice: 42.50,
  },
  {
    projectId: "mentor-match-platform",
    title: "Mentor Match Platform",
    creatorName: "Anita Desai",
    avatar: "AD",
    invested: 1800,
    currentValue: 2232,
    quantity: 40,
    avgPrice: 45.00,
    currentPrice: 55.80,
  },
  {
    projectId: "hireiq-ml-hiring-engine",
    title: "HireIQ — ML Hiring Engine",
    creatorName: "Meera Nair",
    avatar: "MN",
    invested: 1200,
    currentValue: 1346,
    quantity: 20,
    avgPrice: 60.00,
    currentPrice: 67.30,
  },
  {
    projectId: "cicd-pipeline-generator",
    title: "CI/CD Pipeline Generator",
    creatorName: "Amit Joshi",
    avatar: "AJ",
    invested: 800,
    currentValue: 778,
    quantity: 20,
    avgPrice: 40.00,
    currentPrice: 38.90,
  },
  {
    projectId: "ux-audit-toolkit",
    title: "UX Audit Toolkit",
    creatorName: "Priya Patel",
    avatar: "PP",
    invested: 600,
    currentValue: 690,
    quantity: 24,
    avgPrice: 25.00,
    currentPrice: 28.75,
  },
];

// ─── Funding ───

export const fundingProjects: FundingProject[] = [
  { id: "ai-resume-builder", title: "AI-Powered Resume Builder", description: "Build resumes that actually get callbacks using AI-driven optimization", goal: 500000, raised: 387500, backers: 1240, reward: "30% off Premium Plan for 1 year", daysLeft: 12, image: "AI" },
  { id: "decentralized-skill-verification", title: "Decentralized Skill Verification", description: "On-chain skill badges that employers can trust and verify instantly", goal: 750000, raised: 412000, backers: 890, reward: "Free verification badge + early access", daysLeft: 24, image: "BC" },
  { id: "mentor-match-platform", title: "Mentor Match Platform", description: "Connect with industry mentors through AI-matched compatibility scores", goal: 300000, raised: 267000, backers: 2100, reward: "3 free mentor sessions + lifetime discount", daysLeft: 5, image: "MM" },
  { id: "hireiq-ml-hiring-engine", title: "HireIQ — ML Hiring Engine", description: "Public API for predicting candidate-role fit with 94% accuracy", goal: 800000, raised: 523000, backers: 1450, reward: "Free API access (10K calls/month) for 1 year", daysLeft: 15, image: "HI" },
  { id: "scaledb-auto-sharding", title: "ScaleDB — Auto-Sharding Engine", description: "Postgres extension that auto-shards based on query patterns", goal: 600000, raised: 245000, backers: 530, reward: "Lifetime premium access + exclusive coupon", daysLeft: 22, image: "SD" },
];

// ─── Coupons ───

export const coupons: Coupon[] = [
  { id: "c1", code: "VALU-DIAMOND-30", title: "Diamond Tier Reward", discount: "30% off", source: "Portfolio milestone: Diamond staking level", status: "active", expiresAt: "2026-06-30" },
  { id: "c2", code: "FUND-RESUME-AI", title: "AI Resume Builder Backer", discount: "30% off Premium", source: "Funded: AI-Powered Resume Builder", status: "active", expiresAt: "2027-01-15" },
  { id: "c3", code: "VALU-EARLY-50", title: "Early Adopter Bonus", discount: "50% off first trade", source: "Early sign-up bonus", status: "used", expiresAt: "2026-03-01" },
  { id: "c4", code: "MENTOR-FREE-3", title: "Mentor Sessions Pack", discount: "3 free sessions", source: "Funded: Mentor Match Platform", status: "active", expiresAt: "2026-12-31" },
  { id: "c5", code: "VALU-WEEKLY-10", title: "Weekly Trading Reward", discount: "10% fee waiver", source: "Weekly trading volume milestone", status: "expired", expiresAt: "2026-04-01" },
  { id: "c6", code: "HIREIQ-FREE-10K", title: "HireIQ API Access", discount: "Free 10K calls/mo", source: "Funded: HireIQ — ML Hiring Engine", status: "active", expiresAt: "2027-04-15" },
];

// ─── Wallet ───

export const wallet = {
  balance: 10000,
  invested: 6900,
  currentValue: 8166,
  pnl: 1266,
  pnlPercent: 18.35,
};

// ─── Trading page helpers ───

export interface OrderBookEntry {
  price: number;
  quantity: number;
  total: number;
}

export interface RecentTrade {
  id: string;
  type: "buy" | "sell";
  price: number;
  quantity: number;
  time: string;
  user: string;
}

export interface ProjectStats24h {
  open: number;
  high: number;
  low: number;
  close: number;
  volume24h: string;
  trades24h: number;
  avgPrice: number;
  holders: number;
  allTimeHigh: number;
  allTimeLow: number;
  rank: number;
  creatorScore: number;
  endorsements: number;
  backers: string;
}

function generateOrderBook(basePrice: number): { bids: OrderBookEntry[]; asks: OrderBookEntry[] } {
  const bids: OrderBookEntry[] = [];
  const asks: OrderBookEntry[] = [];
  let bidTotal = 0;
  let askTotal = 0;
  for (let i = 0; i < 8; i++) {
    const bidQty = Math.floor(Math.random() * 500 + 50);
    bidTotal += bidQty;
    bids.push({
      price: parseFloat((basePrice - (i + 1) * basePrice * 0.003).toFixed(2)),
      quantity: bidQty,
      total: bidTotal,
    });
    const askQty = Math.floor(Math.random() * 500 + 50);
    askTotal += askQty;
    asks.push({
      price: parseFloat((basePrice + (i + 1) * basePrice * 0.003).toFixed(2)),
      quantity: askQty,
      total: askTotal,
    });
  }
  return { bids, asks };
}

const tradeNames = ["Aarav M.", "Diya S.", "Kabir R.", "Ishaan P.", "Saanvi K.", "Vihaan D.", "Anaya B.", "Arjun T.", "Myra G.", "Reyansh L."];

function generateRecentTrades(basePrice: number): RecentTrade[] {
  const trades: RecentTrade[] = [];
  const now = Date.now();
  for (let i = 0; i < 15; i++) {
    const isBuy = Math.random() > 0.45;
    const offset = (Math.random() - 0.5) * basePrice * 0.01;
    trades.push({
      id: `trade-${i}`,
      type: isBuy ? "buy" : "sell",
      price: parseFloat((basePrice + offset).toFixed(2)),
      quantity: Math.floor(Math.random() * 20 + 1),
      time: new Date(now - i * (Math.random() * 120000 + 30000)).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
      user: tradeNames[Math.floor(Math.random() * tradeNames.length)],
    });
  }
  return trades;
}

function generateProjectStats(project: ProjectStock): ProjectStats24h {
  const variance = project.price * 0.08;
  const high = parseFloat((project.price + Math.random() * variance).toFixed(2));
  const low = parseFloat((project.price - Math.random() * variance).toFixed(2));
  return {
    open: parseFloat((project.price - project.change).toFixed(2)),
    high,
    low,
    close: project.price,
    volume24h: project.volume,
    trades24h: Math.floor(Math.random() * 5000 + 800),
    avgPrice: parseFloat(((high + low) / 2).toFixed(2)),
    holders: Math.floor(Math.random() * 10000 + 500),
    allTimeHigh: parseFloat((project.price * (1.2 + Math.random() * 0.5)).toFixed(2)),
    allTimeLow: parseFloat((project.price * (0.15 + Math.random() * 0.2)).toFixed(2)),
    rank: Math.floor(Math.random() * 50 + 1),
    creatorScore: project.creator.score,
    endorsements: Math.floor(Math.random() * 500 + 50),
    backers: `${project.backers.toLocaleString("en-IN")}`,
  };
}

// ─── Lookups ───

export function getProjectById(id: string) {
  return projects.find((p) => p.id === id);
}

export function getCreatorById(id: string) {
  return creators.find((c) => c.id === id);
}

export function getOrderBook(projectId: string) {
  const project = projects.find((p) => p.id === projectId);
  return generateOrderBook(project ? project.price : 30);
}

export function getRecentTrades(projectId: string) {
  const project = projects.find((p) => p.id === projectId);
  return generateRecentTrades(project ? project.price : 30);
}

export function get24hStats(projectId: string) {
  const project = projects.find((p) => p.id === projectId);
  if (!project) return generateProjectStats(projects[0]);
  return generateProjectStats(project);
}

export function getChartData(projectId: string) {
  const project = projects.find((p) => p.id === projectId);
  if (!project) return generateChartData(30, 90);
  return generateChartData(project.price, 90);
}

// ─── Project health computation ───

export function computeProjectHealth(project: ProjectStock): ProjectHealth {
  const completed = project.batches.filter((b) => b.status === "completed");
  const overdue = project.batches.find((b) => b.status === "overdue");
  const inProgress = project.batches.find((b) => b.status === "in_progress");
  const currentBatch = overdue || inProgress || null;

  let overdueDays = 0;
  if (overdue) {
    const deadline = new Date(overdue.deadline);
    const now = new Date();
    overdueDays = Math.max(0, Math.floor((now.getTime() - deadline.getTime()) / 86400000));
  }

  const priceDecayPerDay = 0.5;
  const credibilityDecayPerDay = 2;
  const priceBoostCompleted = completed.reduce((sum, b) => sum + b.priceImpact, 0);

  let adjustedPrice = project.price;
  if (overdueDays > 0) {
    adjustedPrice = project.price * (1 - (overdueDays * priceDecayPerDay) / 100);
  }

  let adjustedScore = project.creator.score;
  if (overdueDays > 0) {
    adjustedScore = Math.max(0, project.creator.score - overdueDays * credibilityDecayPerDay);
  }

  if (project.dispute?.status === "confirmed") {
    adjustedScore = Math.max(0, adjustedScore - 30);
  }

  const batchStatus: ProjectHealth["batchStatus"] =
    overdue ? "overdue" : completed.length === project.batches.length ? "all_done" : "on_track";

  return {
    adjustedPrice: parseFloat(adjustedPrice.toFixed(2)),
    adjustedCreatorScore: adjustedScore,
    overdueDays,
    currentBatch,
    completedCount: completed.length,
    totalBatches: project.batches.length,
    batchStatus,
  };
}

export function getDisputeStatus(project: ProjectStock): "none" | "open" | "confirmed" | "cleared" {
  if (!project.dispute) return "none";
  return project.dispute.status;
}

// ─── Sorted lists ───

export const topGainers = [...projects].sort((a, b) => b.changePercent - a.changePercent).slice(0, 5);
export const topLosers = [...projects].sort((a, b) => a.changePercent - b.changePercent).slice(0, 5);
