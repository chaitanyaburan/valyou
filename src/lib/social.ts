import { creators, projects } from "./data";

export interface ProjectPost {
  id: string;
  creatorId: string;
  creatorName: string;
  creatorAvatar: string;
  creatorUsername: string;
  creatorScore: number;
  creatorTier: string;
  title: string;
  tagline: string;
  description: string;
  category: string;
  tags: string[];
  coverGradient: string;
  coverIcon: string;
  pricePerShare: number;
  priceChange24h: number;
  fundingGoal: number;
  fundingRaised: number;
  backers: number;
  daysLeft: number;
  milestone: string;
  milestoneProgress: number;
  likes: number;
  comments: number;
  timeAgo: string;
}

export interface TradeRecord {
  id: string;
  projectId: string;
  projectTitle: string;
  creatorName: string;
  creatorAvatar: string;
  type: "invest" | "sell";
  amount: number;
  shares: number;
  pricePerShare: number;
  timestamp: string;
  status: "pending" | "confirmed" | "cancelled";
}

export const projectFeed: ProjectPost[] = [
  {
    id: "ai-resume-builder",
    creatorId: "sneha-iyer",
    creatorName: "Sneha Iyer",
    creatorAvatar: "SI",
    creatorUsername: "@snehaiyer",
    creatorScore: 96,
    creatorTier: "Diamond",
    title: "AI-Powered Resume Builder",
    tagline: "Resumes that actually get callbacks",
    description: "An AI engine that analyzes job descriptions and auto-generates ATS-friendly resumes with role-specific keywords. Beta live with 500+ signups in 24 hours.",
    category: "AI / SaaS",
    tags: ["AI", "Career Tech", "SaaS"],
    coverGradient: "from-violet-600/30 via-purple-600/20 to-fuchsia-600/30",
    coverIcon: "M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z",
    pricePerShare: 42.50,
    priceChange24h: 8.3,
    fundingGoal: 500000,
    fundingRaised: 387500,
    backers: 1240,
    daysLeft: 12,
    milestone: "Beta launched — 500 signups",
    milestoneProgress: 78,
    likes: 342,
    comments: 47,
    timeAgo: "2h ago",
  },
  {
    id: "ux-audit-toolkit",
    creatorId: "priya-patel",
    creatorName: "Priya Patel",
    creatorAvatar: "PP",
    creatorUsername: "@priyapatel",
    creatorScore: 89,
    creatorTier: "Platinum",
    title: "UX Audit Toolkit",
    tagline: "Auto accessibility reports for Figma",
    description: "A Figma plugin that scans your designs and auto-generates WCAG accessibility audit reports, color contrast checks, and screen reader annotations.",
    category: "Design / Tools",
    tags: ["Design", "Accessibility", "Figma"],
    coverGradient: "from-cyan-600/30 via-blue-600/20 to-indigo-600/30",
    coverIcon: "M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z M15 12a3 3 0 11-6 0 3 3 0 016 0z",
    pricePerShare: 28.75,
    priceChange24h: 5.1,
    fundingGoal: 200000,
    fundingRaised: 134000,
    backers: 720,
    daysLeft: 18,
    milestone: "Plugin alpha — 200 testers",
    milestoneProgress: 67,
    likes: 189,
    comments: 23,
    timeAgo: "4h ago",
  },
  {
    id: "decentralized-skill-verification",
    creatorId: "rahul-dev",
    creatorName: "Rahul Dev",
    creatorAvatar: "RD",
    creatorUsername: "@rahuldev",
    creatorScore: 71,
    creatorTier: "Gold",
    title: "Decentralized Skill Verification",
    tagline: "On-chain skill badges employers trust",
    description: "Issue and verify skill credentials on-chain. Smart contracts deployed on testnet. Employers can verify in one click. Building the future of trustless hiring.",
    category: "Blockchain / HR Tech",
    tags: ["Web3", "Solidity", "Identity"],
    coverGradient: "from-emerald-600/30 via-teal-600/20 to-green-600/30",
    coverIcon: "M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z",
    pricePerShare: 15.20,
    priceChange24h: -3.8,
    fundingGoal: 750000,
    fundingRaised: 412000,
    backers: 890,
    daysLeft: 24,
    milestone: "Smart contracts on testnet",
    milestoneProgress: 55,
    likes: 156,
    comments: 31,
    timeAgo: "6h ago",
  },
  {
    id: "mentor-match-platform",
    creatorId: "anita-desai",
    creatorName: "Anita Desai",
    creatorAvatar: "AD",
    creatorUsername: "@anitadesai",
    creatorScore: 87,
    creatorTier: "Platinum",
    title: "Mentor Match Platform",
    tagline: "AI-matched mentorship sessions",
    description: "Connect with the right mentor using compatibility scores powered by ML. Already matched 800+ pairs with a 94% satisfaction rate.",
    category: "EdTech / AI",
    tags: ["Mentorship", "AI/ML", "EdTech"],
    coverGradient: "from-amber-600/30 via-orange-600/20 to-yellow-600/30",
    coverIcon: "M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z",
    pricePerShare: 55.80,
    priceChange24h: 12.4,
    fundingGoal: 300000,
    fundingRaised: 267000,
    backers: 2100,
    daysLeft: 5,
    milestone: "800 mentor matches — 94% satisfaction",
    milestoneProgress: 89,
    likes: 267,
    comments: 38,
    timeAgo: "8h ago",
  },
  {
    id: "cicd-pipeline-generator",
    creatorId: "amit-joshi",
    creatorName: "Amit Joshi",
    creatorAvatar: "AJ",
    creatorUsername: "@amitjoshi",
    creatorScore: 88,
    creatorTier: "Platinum",
    title: "CI/CD Pipeline Generator",
    tagline: "Auto-generate GitHub Actions from your repo",
    description: "Analyze your repo structure, detect frameworks, and auto-generate production-ready CI/CD pipelines. Supports monorepos, Docker, and Kubernetes deployments.",
    category: "DevOps / Tools",
    tags: ["DevOps", "CI/CD", "Automation"],
    coverGradient: "from-rose-600/30 via-pink-600/20 to-red-600/30",
    coverIcon: "M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5",
    pricePerShare: 38.90,
    priceChange24h: 6.7,
    fundingGoal: 400000,
    fundingRaised: 198000,
    backers: 650,
    daysLeft: 30,
    milestone: "MVP live — 150 repos analyzed",
    milestoneProgress: 50,
    likes: 203,
    comments: 29,
    timeAgo: "10h ago",
  },
  {
    id: "hireiq-ml-hiring-engine",
    creatorId: "meera-nair",
    creatorName: "Meera Nair",
    creatorAvatar: "MN",
    creatorUsername: "@meeranair",
    creatorScore: 91,
    creatorTier: "Platinum",
    title: "HireIQ — ML Hiring Engine",
    tagline: "Predict candidate success before hiring",
    description: "Machine learning model trained on 50K+ anonymized hiring outcomes. Predicts candidate-role fit with 94% accuracy. Removes bias, surfaces hidden talent.",
    category: "AI / HR Tech",
    tags: ["Machine Learning", "Hiring", "AI"],
    coverGradient: "from-indigo-600/30 via-blue-600/20 to-sky-600/30",
    coverIcon: "M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6",
    pricePerShare: 67.30,
    priceChange24h: 4.2,
    fundingGoal: 800000,
    fundingRaised: 523000,
    backers: 1450,
    daysLeft: 15,
    milestone: "94% accuracy — enterprise pilot live",
    milestoneProgress: 65,
    likes: 312,
    comments: 52,
    timeAgo: "12h ago",
  },
  {
    id: "defi-lending-pool",
    creatorId: "karan-mehta",
    creatorName: "Karan Mehta",
    creatorAvatar: "KM",
    creatorUsername: "@karanmehta",
    creatorScore: 55,
    creatorTier: "Bronze",
    title: "DeFi Lending Pool",
    tagline: "Peer-to-peer micro-loans on Solana",
    description: "A decentralized lending protocol on Solana enabling micro-loans with dynamic interest rates. Smart contract passed security audit with zero critical issues.",
    category: "DeFi / Blockchain",
    tags: ["DeFi", "Solana", "Lending"],
    coverGradient: "from-lime-600/30 via-green-600/20 to-emerald-600/30",
    coverIcon: "M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    pricePerShare: 8.45,
    priceChange24h: -2.1,
    fundingGoal: 350000,
    fundingRaised: 87000,
    backers: 310,
    daysLeft: 40,
    milestone: "Audit passed — mainnet next week",
    milestoneProgress: 25,
    likes: 112,
    comments: 16,
    timeAgo: "1d ago",
  },
  {
    id: "scaledb-auto-sharding",
    creatorId: "rohan-gupta",
    creatorName: "Rohan Gupta",
    creatorAvatar: "RG",
    creatorUsername: "@rohangupta",
    creatorScore: 76,
    creatorTier: "Gold",
    title: "ScaleDB — Auto-Sharding Engine",
    tagline: "Zero-downtime database scaling",
    description: "A Postgres extension that auto-shards your database based on query patterns. Handles 10x traffic spikes with zero config changes. Built in Rust.",
    category: "Infrastructure / DB",
    tags: ["Rust", "Postgres", "Infra"],
    coverGradient: "from-slate-600/30 via-gray-600/20 to-zinc-600/30",
    coverIcon: "M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125",
    pricePerShare: 22.10,
    priceChange24h: 3.5,
    fundingGoal: 600000,
    fundingRaised: 245000,
    backers: 530,
    daysLeft: 22,
    milestone: "Benchmark: 10x throughput vs vanilla PG",
    milestoneProgress: 41,
    likes: 178,
    comments: 34,
    timeAgo: "1d ago",
  },
];

export interface Story {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  content: string;
  type: "update" | "milestone" | "launch";
  gradient: string;
  viewed: boolean;
  projectId?: string;
}

export interface Message {
  id: string;
  content: string;
  timestamp: string;
  isMine: boolean;
}

export interface Conversation {
  userId: string;
  userName: string;
  userAvatar: string;
  username: string;
  lastMessage: string;
  lastTime: string;
  unread: number;
  sharesHeld: number;
  messages: Message[];
}

export interface Notification {
  id: string;
  type: "investment" | "social" | "milestone" | "alert";
  message: string;
  detail: string;
  timeAgo: string;
  read: boolean;
  icon: string;
}

export interface UserProfile {
  id: string;
  name: string;
  username: string;
  avatar: string;
  bio: string;
  coverGradient: string;
  followers: number;
  following: number;
  projects: number;
  score: number;
  isVerified: boolean;
  joinedDate: string;
  skills: string[];
  githubStars: number;
  githubRepos: number;
  githubStreak: number;
  linkedinConnections: number;
}

const bios: Record<string, string> = {
  "arun-sharma": "Full-stack engineer building the future of fintech. 3 successful exits. Open-source enthusiast.",
  "priya-patel": "UX Designer & Product Thinker. Currently building AI-powered tools for creators.",
  "rahul-dev": "Blockchain developer. Solidity & Rust. Building decentralized identity solutions.",
  "sneha-iyer": "Senior UX Researcher at scale. Shipped products used by 10M+ users. Design systems nerd.",
  "vikram-singh": "Mobile developer. Flutter & React Native. Working on next-gen social apps.",
  "meera-nair": "Data scientist turned founder. ML/AI for hiring. Ex-Google, Ex-Microsoft.",
  "karan-mehta": "College student exploring Web3. Building my first DeFi project. Learning in public.",
  "anita-desai": "Product Manager with 8 years in SaaS. Passionate about creator economy tools.",
  "rohan-gupta": "Backend engineer. Go, Rust, Postgres. Building scalable infrastructure.",
  "divya-krishnan": "Content strategist & growth hacker. Helped 5 startups reach PMF.",
  "amit-joshi": "DevOps & Cloud architect. AWS certified. Building deployment automation tools.",
  "neha-kapoor": "Frontend developer learning systems design. React, Next.js, TypeScript.",
};

const gradients = [
  "from-indigo-600 via-purple-600 to-pink-500",
  "from-cyan-600 via-blue-600 to-indigo-500",
  "from-emerald-600 via-teal-600 to-cyan-500",
  "from-rose-600 via-pink-600 to-purple-500",
  "from-amber-600 via-orange-600 to-red-500",
  "from-violet-600 via-indigo-600 to-blue-500",
];

const skillSets: Record<string, string[]> = {
  "arun-sharma": ["TypeScript", "Node.js", "React", "PostgreSQL", "AWS"],
  "priya-patel": ["Figma", "UX Research", "Prototyping", "Design Systems", "AI/ML"],
  "rahul-dev": ["Solidity", "Rust", "Ethereum", "DeFi", "Web3"],
  "sneha-iyer": ["UX Research", "Figma", "Design Systems", "Accessibility", "Workshops"],
  "vikram-singh": ["Flutter", "React Native", "Dart", "Firebase", "Mobile UX"],
  "meera-nair": ["Python", "TensorFlow", "Data Science", "ML Ops", "Hiring Tech"],
  "karan-mehta": ["Solidity", "JavaScript", "DeFi", "Smart Contracts"],
  "anita-desai": ["Product Strategy", "Roadmapping", "Analytics", "SaaS", "Growth"],
  "rohan-gupta": ["Go", "Rust", "PostgreSQL", "Docker", "Kubernetes"],
  "divya-krishnan": ["Content Strategy", "SEO", "Growth Hacking", "Analytics", "Copywriting"],
  "amit-joshi": ["AWS", "Terraform", "CI/CD", "Docker", "Monitoring"],
  "neha-kapoor": ["React", "Next.js", "TypeScript", "Tailwind CSS", "GraphQL"],
};

export function getUserProfile(id: string): UserProfile | undefined {
  const creator = creators.find((c) => c.id === id);
  if (!creator) return undefined;
  const idx = creators.indexOf(creator);
  const creatorProjects = projects.filter((p) => p.creator.id === id);
  return {
    id: creator.id,
    name: creator.name,
    username: creator.username,
    avatar: creator.avatar,
    bio: bios[creator.id] || "Creator on Valyou. Building the future.",
    coverGradient: gradients[idx % gradients.length],
    followers: Math.floor(Math.random() * 20000 + 1000),
    following: Math.floor(Math.random() * 500 + 50),
    projects: creatorProjects.length || Math.floor(Math.random() * 6 + 1),
    score: creator.score,
    isVerified: creator.score >= 75,
    joinedDate: "Jan 2025",
    skills: skillSets[creator.id] || ["JavaScript", "React"],
    githubStars: Math.floor(Math.random() * 5000 + 100),
    githubRepos: Math.floor(Math.random() * 80 + 10),
    githubStreak: Math.floor(Math.random() * 300 + 30),
    linkedinConnections: Math.floor(Math.random() * 5000 + 500),
  };
}

export interface Post {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  username: string;
  type: "text" | "milestone" | "trade" | "project";
  content: string;
  likes: number;
  comments: number;
  shares: number;
  endorsements: number;
  timestamp: string;
  timeAgo: string;
  liked: boolean;
}

export const posts: Post[] = [
  { id: "p1", userId: "sneha-iyer", userName: "Sneha Iyer", userAvatar: "SI", username: "@snehaiyer", type: "milestone", content: "Just shipped the Beta for AI Resume Builder! 500+ signups in the first 24 hours. Thank you to all 1,240 backers who believed in this project. We're just getting started.", likes: 342, comments: 47, shares: 28, endorsements: 15, timestamp: "2h ago", timeAgo: "2h", liked: false },
  { id: "p2", userId: "arun-sharma", userName: "Arun Sharma", userAvatar: "AS", username: "@arunsharma", type: "text", content: "Hot take: The best way to prove your skills isn't a resume or a LinkedIn post — it's shipping a funded project with real returns. That's what Valyou gets right. Your track record IS your credential.", likes: 218, comments: 34, shares: 56, endorsements: 8, timestamp: "4h ago", timeAgo: "4h", liked: true },
  { id: "p3", userId: "priya-patel", userName: "Priya Patel", userAvatar: "PP", username: "@priyapatel", type: "project", content: "Excited to announce my new project: UX Audit Toolkit — a Figma plugin that auto-generates accessibility reports. Funding is now live! Early backers get lifetime access.", likes: 189, comments: 23, shares: 41, endorsements: 12, timestamp: "6h ago", timeAgo: "6h", liked: false },
  { id: "p4", userId: "meera-nair", userName: "Meera Nair", userAvatar: "MN", username: "@meeranair", type: "trade", content: "Just invested 200 VALU in Priya's UX Audit Toolkit. Her consistency score is 91% and she's shipped 3/3 projects on time. This is the kind of project I back with confidence.", likes: 156, comments: 19, shares: 12, endorsements: 5, timestamp: "8h ago", timeAgo: "8h", liked: false },
  { id: "p5", userId: "rahul-dev", userName: "Rahul Dev", userAvatar: "RD", username: "@rahuldev", type: "text", content: "Building in public: Day 47 of the Decentralized Skill Verification project. Smart contracts are deployed on testnet. Next up — frontend integration and user testing.", likes: 98, comments: 15, shares: 8, endorsements: 3, timestamp: "10h ago", timeAgo: "10h", liked: false },
  { id: "p6", userId: "anita-desai", userName: "Anita Desai", userAvatar: "AD", username: "@anitadesai", type: "milestone", content: "Mentor Match Platform just crossed 2,100 backers and ₹2.67L raised! 89% of goal reached with 5 days left. If you've been on the fence — now is the time.", likes: 267, comments: 38, shares: 45, endorsements: 20, timestamp: "12h ago", timeAgo: "12h", liked: true },
  { id: "p7", userId: "rohan-gupta", userName: "Rohan Gupta", userAvatar: "RG", username: "@rohangupta", type: "text", content: "Unpopular opinion: GitHub stars are a vanity metric. What matters is whether your code is actually used in production. Valyou's credibility score gets this right — it tracks real outcomes, not claps.", likes: 134, comments: 42, shares: 22, endorsements: 4, timestamp: "14h ago", timeAgo: "14h", liked: false },
  { id: "p8", userId: "amit-joshi", userName: "Amit Joshi", userAvatar: "AJ", username: "@amitjoshi", type: "project", content: "Launching today: CI/CD Pipeline Generator — auto-generates GitHub Actions workflows from your repo structure. Backed by 3 years of DevOps experience. Funding goal: 100K VALU.", likes: 203, comments: 29, shares: 33, endorsements: 11, timestamp: "18h ago", timeAgo: "18h", liked: false },
  { id: "p9", userId: "vikram-singh", userName: "Vikram Singh", userAvatar: "VS", username: "@vikramsingh", type: "text", content: "Week 2 of learning Rust for my next project. Coming from Dart/Flutter, the borrow checker is humbling. Any Rustaceans here willing to mentor? My DMs are open.", likes: 76, comments: 28, shares: 3, endorsements: 1, timestamp: "20h ago", timeAgo: "20h", liked: false },
  { id: "p10", userId: "karan-mehta", userName: "Karan Mehta", userAvatar: "KM", username: "@karanmehta", type: "milestone", content: "First project update! DeFi Lending Pool smart contract passed security audit. Zero critical issues. Deployment to mainnet next week. My credibility score jumped from 42 to 55!", likes: 112, comments: 16, shares: 14, endorsements: 7, timestamp: "1d ago", timeAgo: "1d", liked: false },
  { id: "p11", userId: "neha-kapoor", userName: "Neha Kapoor", userAvatar: "NK", username: "@nehakapoor", type: "text", content: "Just redesigned my portfolio using the new Valyou profile templates. Love how it pulls in my GitHub contribution graph and LinkedIn career timeline automatically. This is the future of resumes.", likes: 64, comments: 9, shares: 5, endorsements: 2, timestamp: "1d ago", timeAgo: "1d", liked: false },
];

export const stories: Story[] = [
  { id: "s1", userId: "sneha-iyer", userName: "Sneha Iyer", userAvatar: "SI", content: "AI Resume Builder beta is LIVE! Link in bio.", type: "launch", gradient: "from-purple-600 to-pink-500", viewed: false, projectId: "ai-resume-builder" },
  { id: "s2", userId: "priya-patel", userName: "Priya Patel", userAvatar: "PP", content: "New project dropping tomorrow. Stay tuned.", type: "update", gradient: "from-cyan-600 to-blue-500", viewed: false, projectId: "ux-audit-toolkit" },
  { id: "s3", userId: "arun-sharma", userName: "Arun Sharma", userAvatar: "AS", content: "Hit 500 GitHub stars on my open-source project today!", type: "milestone", gradient: "from-emerald-600 to-teal-500", viewed: true },
  { id: "s4", userId: "meera-nair", userName: "Meera Nair", userAvatar: "MN", content: "My credibility score just crossed 90. Diamond tier incoming!", type: "milestone", gradient: "from-indigo-600 to-purple-500", viewed: false, projectId: "hireiq-ml-hiring-engine" },
  { id: "s5", userId: "amit-joshi", userName: "Amit Joshi", userAvatar: "AJ", content: "CI/CD Generator is live for funding! Early backers get 2x rewards.", type: "launch", gradient: "from-rose-600 to-orange-500", viewed: true, projectId: "cicd-pipeline-generator" },
  { id: "s6", userId: "rahul-dev", userName: "Rahul Dev", userAvatar: "RD", content: "Smart contracts deployed on testnet. Building in public, day 47.", type: "update", gradient: "from-amber-600 to-red-500", viewed: false, projectId: "decentralized-skill-verification" },
  { id: "s7", userId: "anita-desai", userName: "Anita Desai", userAvatar: "AD", content: "Mentor Match is 89% funded! 5 days left. Let's gooo!", type: "milestone", gradient: "from-violet-600 to-indigo-500", viewed: false, projectId: "mentor-match-platform" },
  { id: "s8", userId: "divya-krishnan", userName: "Divya Krishnan", userAvatar: "DK", content: "Portfolio review: +34% this month. Here's my strategy...", type: "update", gradient: "from-teal-600 to-cyan-500", viewed: true },
];

export const conversations: Conversation[] = [
  {
    userId: "sneha-iyer", userName: "Sneha Iyer", userAvatar: "SI", username: "@snehaiyer",
    lastMessage: "Thanks for the investment! Beta access sent.", lastTime: "2m ago", unread: 2, sharesHeld: 60,
    messages: [
      { id: "m1", content: "Hey Sneha! Just backed your AI Resume Builder. Excited about this project!", timestamp: "10:30 AM", isMine: true },
      { id: "m2", content: "Thank you so much! Really means a lot. We just hit our beta milestone.", timestamp: "10:32 AM", isMine: false },
      { id: "m3", content: "That's amazing! How's the user feedback so far?", timestamp: "10:35 AM", isMine: true },
      { id: "m4", content: "Overwhelmingly positive. 94% of beta users said they'd recommend it.", timestamp: "10:38 AM", isMine: false },
      { id: "m5", content: "Love it. Holding my shares long term for sure.", timestamp: "10:40 AM", isMine: true },
      { id: "m6", content: "Thanks for the investment! Beta access sent to your email.", timestamp: "10:45 AM", isMine: false },
    ],
  },
  {
    userId: "priya-patel", userName: "Priya Patel", userAvatar: "PP", username: "@priyapatel",
    lastMessage: "Early backer rewards drop next week!", lastTime: "1h ago", unread: 1, sharesHeld: 24,
    messages: [
      { id: "m7", content: "Priya, your UX Audit Toolkit looks really promising!", timestamp: "9:00 AM", isMine: true },
      { id: "m8", content: "Thanks! I've been working on it for 3 months.", timestamp: "9:05 AM", isMine: false },
      { id: "m9", content: "When do early backers get access?", timestamp: "9:10 AM", isMine: true },
      { id: "m10", content: "Early backer rewards drop next week! You'll get lifetime premium access.", timestamp: "9:15 AM", isMine: false },
    ],
  },
  {
    userId: "arun-sharma", userName: "Arun Sharma", userAvatar: "AS", username: "@arunsharma",
    lastMessage: "Check out my latest open-source release!", lastTime: "3h ago", unread: 0, sharesHeld: 0,
    messages: [
      { id: "m11", content: "Arun, your open-source API framework is incredible.", timestamp: "Yesterday", isMine: true },
      { id: "m12", content: "That's great to hear! Feel free to open issues if you find any bugs.", timestamp: "Yesterday", isMine: false },
      { id: "m13", content: "Will do. Any plans for a v2?", timestamp: "Yesterday", isMine: true },
      { id: "m14", content: "Check out my latest open-source release! v2 beta is out with WebSocket support.", timestamp: "3h ago", isMine: false },
    ],
  },
  {
    userId: "meera-nair", userName: "Meera Nair", userAvatar: "MN", username: "@meeranair",
    lastMessage: "The ML model accuracy is now at 94%!", lastTime: "5h ago", unread: 0, sharesHeld: 20,
    messages: [
      { id: "m15", content: "Meera, how's the ML hiring tool coming along?", timestamp: "Yesterday", isMine: true },
      { id: "m16", content: "Great progress! We're training on 50K anonymized hiring outcomes.", timestamp: "Yesterday", isMine: false },
      { id: "m17", content: "The ML model accuracy is now at 94%! Paper coming next month.", timestamp: "5h ago", isMine: false },
    ],
  },
];

export const notifications: Notification[] = [
  { id: "n1", type: "investment", message: "AI Resume Builder price rose +8.3%", detail: "Your holdings gained ₹135.60", timeAgo: "2m ago", read: false, icon: "trending_up" },
  { id: "n2", type: "social", message: "Priya Patel endorsed your project", detail: "Staked 10 VALU on your credibility", timeAgo: "15m ago", read: false, icon: "thumb_up" },
  { id: "n3", type: "milestone", message: "AI Resume Builder hit 80% funding!", detail: "Project you backed is close to goal", timeAgo: "1h ago", read: false, icon: "flag" },
  { id: "n4", type: "social", message: "Meera Nair started following you", detail: "Score: 91 · Platinum tier", timeAgo: "2h ago", read: false, icon: "person_add" },
  { id: "n5", type: "investment", message: "Buy order filled: 20 shares of CI/CD Pipeline Generator", detail: "Avg price: 38.90 VALU", timeAgo: "3h ago", read: true, icon: "check_circle" },
  { id: "n6", type: "alert", message: "Your credibility score rose to 76", detail: "Up from 74 · Approaching Gold tier", timeAgo: "4h ago", read: true, icon: "star" },
  { id: "n7", type: "milestone", message: "Mentor Match crossed 2,000 backers", detail: "You backed this project", timeAgo: "5h ago", read: true, icon: "group" },
  { id: "n8", type: "social", message: "Arun Sharma commented on your post", detail: "\"Great insight! Totally agree with this take.\"", timeAgo: "6h ago", read: true, icon: "comment" },
  { id: "n9", type: "investment", message: "DeFi Lending Pool price dropped -2.1%", detail: "Project you're watching declined", timeAgo: "8h ago", read: true, icon: "trending_down" },
  { id: "n10", type: "alert", message: "Price alert: ScaleDB crossed ₹22", detail: "Your target price was reached", timeAgo: "10h ago", read: true, icon: "notifications" },
  { id: "n11", type: "social", message: "Rohan Gupta shared your post", detail: "Your post reached 50+ new viewers", timeAgo: "12h ago", read: true, icon: "share" },
  { id: "n12", type: "milestone", message: "ScaleDB hit 41% funding", detail: "22 days left · You're a backer", timeAgo: "1d ago", read: true, icon: "flag" },
];

export function getPostsForUser(userId: string): Post[] {
  return posts.filter((p) => p.userId === userId);
}
