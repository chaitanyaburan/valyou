"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Avatar from "@/components/Avatar";
import { formatAlgo } from "@/lib/algo";
import type { AuthUser } from "@/contexts/AuthContext";
import { useAuth } from "@/contexts/AuthContext";
import type { Creator } from "@/lib/data";
import { getCreatorById } from "@/lib/data";
import {
  VISUAL_PRESETS,
  buildPostedProject,
  countProofLinks,
  savePostedProject,
  validateHttpUrl,
  type ListingBias,
  type PostProjectFormPayload,
  type StageStatus,
  type VisualPresetId,
} from "@/lib/market-projects";
import { estimateRaiseInLakhs } from "@/lib/raise-estimator";

const LISTING_BIAS: ListingBias[] = ["New Listing", "Trending", "Top Performer"];
const STAGE_STATUS: StageStatus[] = ["In Progress", "Completed", "Upcoming"];

const INR_HINT = 89;

const PROJECT_CATEGORIES = [
  "AI / SaaS",
  "Design / Tools",
  "Blockchain / HR Tech",
  "EdTech / AI",
  "DevOps / Tools",
  "AI / HR Tech",
  "DeFi / Blockchain",
  "Infrastructure / DB",
  "FinTech",
  "HealthTech",
  "Climate / Energy",
  "Other",
] as const;

const selectClassName =
  "w-full min-h-[42px] cursor-pointer rounded-lg border border-card-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition focus:border-accent/40 focus:ring-1 focus:ring-accent/20";

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" as const } },
};

function avatarFromDisplayName(displayName: string): string {
  const parts = displayName.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0]!.slice(0, 1)}${parts[1]!.slice(0, 1)}`.toUpperCase();
  return displayName.trim().slice(0, 2).toUpperCase() || "U";
}

/** Creator shown on the listing: logged-in profile when known, otherwise a sensible default card. */
function creatorForListing(user: AuthUser | null): Creator {
  if (user) {
    const found = getCreatorById(user.userId);
    if (found) return found;
    const handle = user.email.includes("@") ? `@${user.email.split("@")[0]!}` : `@${user.userId}`;
    return {
      id: user.userId,
      name: user.displayName,
      username: handle,
      avatar: avatarFromDisplayName(user.displayName),
      score: 82,
      consistency: 78,
      stakingLevel: "Gold",
    };
  }
  const fallback = getCreatorById("sneha-iyer");
  if (fallback) return fallback;
  return {
    id: "guest",
    name: "Guest",
    username: "@guest",
    avatar: "GU",
    score: 0,
    consistency: 0,
    stakingLevel: "Bronze",
  };
}

export default function PostProjectPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [step, setStep] = useState<1 | 2>(1);
  const [title, setTitle] = useState("");
  const [tagline, setTagline] = useState("");
  const [category, setCategory] = useState<string>("");
  const [listingBias, setListingBias] = useState<ListingBias>("New Listing");
  const [description, setDescription] = useState("");
  const [tagsRaw, setTagsRaw] = useState("");
  const [sharePrice, setSharePrice] = useState("");
  const [fundingGoalInr, setFundingGoalInr] = useState("");
  const [fundingRaisedInr, setFundingRaisedInr] = useState("");
  const [totalShares, setTotalShares] = useState("");
  const [backers, setBackers] = useState("0");
  const [daysLeft, setDaysLeft] = useState("30");
  const [presetId, setPresetId] = useState<VisualPresetId>("ocean");

  const [currentMilestone, setCurrentMilestone] = useState("");
  const [milestoneProgress, setMilestoneProgress] = useState(40);
  const [currentStageTitle, setCurrentStageTitle] = useState("");
  const [currentStageStatus, setCurrentStageStatus] = useState<StageStatus>("In Progress");
  const [currentStageDescription, setCurrentStageDescription] = useState("");
  const [currentStageDeadline, setCurrentStageDeadline] = useState("");
  const [completedVerifiedRaw, setCompletedVerifiedRaw] = useState("");
  const [currentWorkRaw, setCurrentWorkRaw] = useState("");
  const [nextStageTitle, setNextStageTitle] = useState("");
  const [nextStageDeadline, setNextStageDeadline] = useState("");
  const [nextStageDescription, setNextStageDescription] = useState("");
  const [proofGithub, setProofGithub] = useState("");
  const [proofDemo, setProofDemo] = useState("");
  const [proofDocs, setProofDocs] = useState("");

  const [step1Errors, setStep1Errors] = useState<Record<string, string>>({});
  const [step2Errors, setStep2Errors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const creator = useMemo(() => creatorForListing(user), [user]);
  const tags = useMemo(
    () =>
      tagsRaw
        .split(/[,]+/)
        .map((t) => t.trim())
        .filter(Boolean),
    [tagsRaw],
  );

  const preset = useMemo(() => VISUAL_PRESETS.find((p) => p.id === presetId) ?? VISUAL_PRESETS[0]!, [presetId]);

  const proofCount = useMemo(() => countProofLinks(proofGithub, proofDemo, proofDocs), [proofDemo, proofDocs, proofGithub]);

  const raiseEstimate = useMemo(() => {
    const dl = parseInt(daysLeft, 10);
    return estimateRaiseInLakhs({
      category,
      listingBias,
      daysLeft: Number.isFinite(dl) && dl > 0 ? dl : 30,
      proofCount,
    });
  }, [category, listingBias, daysLeft, proofCount]);

  const previewPrice = useMemo(() => {
    const n = parseFloat(sharePrice);
    return Number.isFinite(n) && n > 0 ? n : 0;
  }, [sharePrice]);

  const previewGoal = useMemo(() => {
    const n = parseFloat(fundingGoalInr);
    return Number.isFinite(n) && n > 0 ? n : 0;
  }, [fundingGoalInr]);

  const previewRaised = useMemo(() => {
    const n = parseFloat(fundingRaisedInr);
    return Number.isFinite(n) && n >= 0 ? n : 0;
  }, [fundingRaisedInr]);

  const previewFundedPct = previewGoal > 0 ? Math.min(100, Math.round((previewRaised / previewGoal) * 100)) : 0;

  const validateStep1 = useCallback(() => {
    const e: Record<string, string> = {};
    if (!title.trim()) e.title = "Title is required.";
    if (!tagline.trim()) e.tagline = "Tagline is required.";
    if (!category.trim()) e.category = "Choose a category from the list.";
    if (!description.trim()) e.description = "Description is required.";
    if (!tags.length) e.tags = "Add at least one tag.";
    const sp = parseFloat(sharePrice);
    if (!Number.isFinite(sp) || sp <= 0) e.sharePrice = "Share price must be greater than 0.";
    const fg = parseFloat(fundingGoalInr);
    if (!Number.isFinite(fg) || fg <= 0) e.fundingGoalInr = "Funding goal must be greater than 0.";
    else if (fg > raiseEstimate.platformCap) {
      e.fundingGoalInr = `Funding goal is above the suggested platform maximum of ₹${Math.round(
        raiseEstimate.platformCap / 100_000,
      ).toLocaleString("en-IN")}L. Lower the amount or break the roadmap into multiple batches.`;
    }
    const ts = parseInt(totalShares, 10);
    if (!Number.isFinite(ts) || ts <= 0) e.totalShares = "Total shares must be greater than 0.";
    const dl = parseInt(daysLeft, 10);
    if (!Number.isFinite(dl) || dl < 1) e.daysLeft = "Days left must be at least 1.";
    setStep1Errors(e);
    return Object.keys(e).length === 0;
  }, [category, daysLeft, description, fundingGoalInr, raiseEstimate.platformCap, sharePrice, tagline, tags.length, title, totalShares]);

  const validateStep2 = useCallback(() => {
    const e: Record<string, string> = {};
    if (!currentMilestone.trim()) e.currentMilestone = "Required.";
    if (!currentStageTitle.trim()) e.currentStageTitle = "Required.";
    if (!currentStageDescription.trim()) e.currentStageDescription = "Required.";
    if (!currentStageDeadline.trim()) e.currentStageDeadline = "Required.";
    if (!nextStageTitle.trim()) e.nextStageTitle = "Required.";
    if (!nextStageDeadline.trim()) e.nextStageDeadline = "Required.";
    if (!nextStageDescription.trim()) e.nextStageDescription = "Required.";
    const proofs = [proofGithub, proofDemo, proofDocs].map((s) => s.trim()).filter(Boolean);
    if (proofs.length < 1) e.proof = "Add at least one proof link (https).";
    if (proofGithub.trim() && !validateHttpUrl(proofGithub)) e.proofGithub = "Must be a valid http(s) URL.";
    if (proofDemo.trim() && !validateHttpUrl(proofDemo)) e.proofDemo = "Must be a valid http(s) URL.";
    if (proofDocs.trim() && !validateHttpUrl(proofDocs)) e.proofDocs = "Must be a valid http(s) URL.";
    setStep2Errors(e);
    return Object.keys(e).length === 0;
  }, [
    currentMilestone,
    currentStageDeadline,
    currentStageDescription,
    currentStageTitle,
    nextStageDeadline,
    nextStageDescription,
    nextStageTitle,
    proofDemo,
    proofDocs,
    proofGithub,
  ]);

  const onContinue = () => {
    if (validateStep1()) setStep(2);
  };

  const onSubmit = () => {
    setSubmitError(null);
    if (!validateStep2()) return;
    const payload: PostProjectFormPayload = {
      step1: {
        title: title.trim(),
        tagline: tagline.trim(),
        category: category.trim(),
        listingBias,
        description: description.trim(),
        tags,
        sharePrice: parseFloat(sharePrice),
        fundingGoalInr: parseFloat(fundingGoalInr),
        fundingRaisedInr: parseFloat(fundingRaisedInr),
        totalShares: parseInt(totalShares, 10) || 0,
        backers: parseInt(backers, 10) || 0,
        daysLeft: parseInt(daysLeft, 10),
        visualPresetId: presetId,
      },
      step2: {
        currentMilestone: currentMilestone.trim(),
        milestoneProgress,
        currentStageTitle: currentStageTitle.trim(),
        currentStageStatus,
        currentStageDescription: currentStageDescription.trim(),
        currentStageDeadline: currentStageDeadline.trim(),
        completedVerifiedRaw,
        currentWorkRaw,
        nextStageTitle: nextStageTitle.trim(),
        nextStageDeadline: nextStageDeadline.trim(),
        nextStageDescription: nextStageDescription.trim(),
        proofGithub,
        proofDemo,
        proofDocs,
      },
    };
    try {
      const project = buildPostedProject(payload, creator);
      savePostedProject(project);
      const q = new URLSearchParams({ posted: "1", title: project.title });
      router.push(`/market?${q.toString()}`);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Could not save listing.");
    }
  };

  const biasFilterLabel =
    listingBias === "New Listing" ? "new" : listingBias === "Trending" ? "trending" : "top";

  return (
    <section className="mx-auto max-w-7xl px-3 py-8 sm:px-4 sm:py-10">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
        <div className="min-w-0 max-w-2xl space-y-3">
          <span className="inline-flex rounded-full border border-accent/25 bg-accent/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-accent-light">
            Two-step project listing flow
          </span>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Post Project</h1>
          <p className="text-sm text-muted leading-relaxed">
            Publish a market-ready project card with a locked investor timeline. Listings you save here stay in this browser and appear alongside live listings on
            Market, Discover, and Trade.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2 sm:justify-end">
          <Link
            href="/market"
            className="inline-flex items-center justify-center rounded-lg border border-card-border bg-card px-3 py-2 text-xs font-semibold text-foreground transition hover:border-accent/40 sm:min-w-[8.5rem]"
          >
            Back to Market
          </Link>
          <Link
            href={user ? `/profile/${encodeURIComponent(user.userId)}` : "/auth/sign-in"}
            className="inline-flex items-center justify-center rounded-lg border border-card-border bg-card px-3 py-2 text-xs font-semibold text-accent-light transition hover:border-accent/40 sm:min-w-[8.5rem]"
          >
            {user ? "View Creator Profile" : "Sign in"}
          </Link>
        </div>
      </motion.div>

      <div className="mb-6 flex flex-wrap items-center gap-1 border-b border-card-border pb-3 text-sm font-medium">
        <button
          type="button"
          onClick={() => setStep(1)}
          className={`rounded-t-lg px-3 py-2 transition ${step === 1 ? "border-b-2 border-accent text-foreground" : "text-muted hover:text-foreground"}`}
        >
          Listing Details
        </button>
        <span className="px-1 text-muted/50">·</span>
        <button
          type="button"
          onClick={() => {
            if (step === 1) {
              if (validateStep1()) setStep(2);
            } else setStep(2);
          }}
          className={`rounded-t-lg px-3 py-2 transition ${step === 2 ? "border-b-2 border-accent text-foreground" : "text-muted hover:text-foreground"}`}
        >
          Progress &amp; Timeline
        </button>
      </div>

      <div className="grid gap-6 md:grid-cols-[minmax(0,1fr),minmax(280px,32%)] lg:grid-cols-[minmax(0,1fr),340px] xl:grid-cols-[minmax(0,1fr),380px]">
        <motion.div variants={container} initial="hidden" animate="show" className="min-w-0 space-y-6 md:pr-1">
          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.div
                key="s1"
                variants={item}
                initial="hidden"
                animate="show"
                exit={{ opacity: 0, y: -8 }}
                className="glass-card space-y-5 p-5 sm:p-6"
              >
                <h2 className="text-base font-semibold text-foreground">Listing Details</h2>
                <label className="block space-y-1.5">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">Project Title</span>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full rounded-lg border border-card-border bg-background px-3 py-2.5 text-sm outline-none transition focus:border-accent/40"
                    placeholder="Your product name"
                  />
                  {step1Errors.title && <p className="text-xs text-loss">{step1Errors.title}</p>}
                </label>
                <label className="block space-y-1.5">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">Tagline</span>
                  <input
                    value={tagline}
                    onChange={(e) => setTagline(e.target.value)}
                    className="w-full rounded-lg border border-card-border bg-background px-3 py-2.5 text-sm outline-none transition focus:border-accent/40"
                    placeholder="One line investors see on cards"
                  />
                  {step1Errors.tagline && <p className="text-xs text-loss">{step1Errors.tagline}</p>}
                </label>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block min-w-0 space-y-1.5">
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">Category</span>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className={selectClassName}
                    >
                      <option value="">Select category</option>
                      {PROJECT_CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                    {step1Errors.category && <p className="text-xs text-loss">{step1Errors.category}</p>}
                  </label>
                  <label className="block min-w-0 space-y-1.5">
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">Listing Bias</span>
                    <select
                      value={listingBias}
                      onChange={(e) => setListingBias(e.target.value as ListingBias)}
                      className={selectClassName}
                    >
                      {LISTING_BIAS.map((b) => (
                        <option key={b} value={b}>
                          {b}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <label className="block space-y-1.5">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">Description</span>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={5}
                    className="w-full rounded-lg border border-card-border bg-background px-3 py-2.5 text-sm outline-none transition focus:border-accent/40"
                    placeholder="What you are building and why it belongs on the market."
                  />
                  {step1Errors.description && <p className="text-xs text-loss">{step1Errors.description}</p>}
                </label>
                <label className="block space-y-1.5">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">Tags (comma-separated)</span>
                  <input
                    value={tagsRaw}
                    onChange={(e) => setTagsRaw(e.target.value)}
                    className="w-full rounded-lg border border-card-border bg-background px-3 py-2.5 text-sm outline-none transition focus:border-accent/40"
                    placeholder="AI, B2B, API"
                  />
                  {step1Errors.tags && <p className="text-xs text-loss">{step1Errors.tags}</p>}
                </label>
                <div className="grid gap-4 sm:grid-cols-3">
                  <label className="block space-y-1.5">
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">Share Price (SOL)</span>
                    <input
                      type="number"
                      min={0}
                      step="0.0001"
                      value={sharePrice}
                      onChange={(e) => setSharePrice(e.target.value)}
                      className="w-full rounded-lg border border-card-border bg-background px-3 py-2.5 text-sm outline-none transition focus:border-accent/40"
                      placeholder="0.42"
                    />
                    <p className="text-[10px] leading-snug text-muted">Stored as ALGO-scale for Valyou.</p>
                    {step1Errors.sharePrice && <p className="text-xs text-loss">{step1Errors.sharePrice}</p>}
                  </label>
                  <label className="block space-y-1.5">
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">Funding Goal (INR)</span>
                    <input
                      type="number"
                      min={0}
                      value={fundingGoalInr}
                      onChange={(e) => {
                        const next = e.target.value;
                        setFundingGoalInr(next);
                        const fg = parseFloat(next);
                        const sp = parseFloat(sharePrice);
                        if (Number.isFinite(fg) && fg > 0 && Number.isFinite(sp) && sp > 0) {
                          const shares = Math.max(1, Math.round(fg / sp));
                          setTotalShares(String(shares));
                        }
                      }}
                      className="w-full rounded-lg border border-card-border bg-background px-3 py-2.5 text-sm outline-none transition focus:border-accent/40"
                    />
                    {step1Errors.fundingGoalInr && <p className="text-xs text-loss">{step1Errors.fundingGoalInr}</p>}
                  </label>
                  <label className="block space-y-1.5">
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">Funding Raised (INR)</span>
                    <input
                      type="number"
                      min={0}
                      value={fundingRaisedInr}
                      onChange={(e) => setFundingRaisedInr(e.target.value)}
                      className="w-full rounded-lg border border-card-border bg-background px-3 py-2.5 text-sm outline-none transition focus:border-accent/40"
                    />
                  </label>
                </div>
                <div className="grid gap-4 sm:grid-cols-3 sm:items-end">
                  <label className="block space-y-1.5">
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">Total Shares</span>
                    <input
                      type="number"
                      min={0}
                      value={totalShares}
                      onChange={(e) => setTotalShares(e.target.value)}
                      className="w-full rounded-lg border border-card-border bg-background px-3 py-2.5 text-sm outline-none transition focus:border-accent/40"
                    />
                    <p className="text-[10px] leading-snug text-muted">Calculated as funding goal ÷ share price. Locked after listing.</p>
                    {step1Errors.totalShares && <p className="text-xs text-loss">{step1Errors.totalShares}</p>}
                  </label>
                </div>
                <div className="grid gap-4 sm:grid-cols-3 sm:items-end">
                  <label className="block space-y-1.5">
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">Backers</span>
                    <input
                      type="number"
                      min={0}
                      value={backers}
                      onChange={(e) => setBackers(e.target.value)}
                      className="w-full rounded-lg border border-card-border bg-background px-3 py-2.5 text-sm outline-none transition focus:border-accent/40"
                    />
                  </label>
                  <label className="block space-y-1.5">
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">Days Left</span>
                    <input
                      type="number"
                      min={1}
                      value={daysLeft}
                      onChange={(e) => setDaysLeft(e.target.value)}
                      className="w-full rounded-lg border border-card-border bg-background px-3 py-2.5 text-sm outline-none transition focus:border-accent/40"
                    />
                    {step1Errors.daysLeft && <p className="text-xs text-loss">{step1Errors.daysLeft}</p>}
                  </label>
                  <div className="rounded-xl border border-card-border bg-card/30 p-3 sm:min-h-[88px]">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">Listing as</p>
                    {!user && (
                      <p className="mt-1 text-[10px] text-muted">Sign in to publish under your profile.</p>
                    )}
                    <div className="mt-2 flex items-center gap-2">
                      <Avatar initials={creator.avatar} size="sm" />
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold">{creator.name}</p>
                        <p className="truncate text-[10px] text-muted">{creator.username}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-xl border border-card-border bg-card/40 p-3 sm:col-span-2">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">Valyou Raise Guidance (AI)</p>
                    <p className="mt-1 text-xs text-muted">
                      Based on your category, listing bias, timeline, and proof links, we suggest a realistic raise range for this listing.
                    </p>
                    <div className="mt-3 flex flex-wrap items-baseline gap-3 text-sm">
                      <div>
                        <p className="text-[11px] text-muted">Suggested range</p>
                        <p className="text-sm font-semibold text-foreground">
                          ₹{Math.round(raiseEstimate.suggestedMin / 100_000).toLocaleString("en-IN")}L – ₹
                          {Math.round(raiseEstimate.suggestedMax / 100_000).toLocaleString("en-IN")}L
                        </p>
                      </div>
                      <div>
                        <p className="text-[11px] text-muted">Platform max</p>
                        <p className="text-sm font-semibold text-foreground">
                          ₹{Math.round(raiseEstimate.platformCap / 100_000).toLocaleString("en-IN")}L
                        </p>
                      </div>
                      <span className="ml-auto rounded-full bg-card border border-card-border px-2 py-0.5 text-[10px] font-medium text-muted">
                        Confidence: {raiseEstimate.confidence}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 border-t border-card-border pt-5">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">Visual style</p>
                    <p className="mt-1 text-xs text-muted">Choose the market card style that fits this project.</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
                    {VISUAL_PRESETS.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setPresetId(p.id)}
                        className={`relative flex flex-col gap-2 rounded-xl border p-3 text-left transition ${
                          presetId === p.id ? "border-accent/60 bg-accent/10 ring-1 ring-accent/25" : "border-card-border bg-card/40 hover:border-accent/30"
                        }`}
                      >
                        {presetId === p.id && (
                          <span className="absolute right-2 top-2 rounded-full bg-accent px-1.5 py-0.5 text-[8px] font-bold uppercase text-white">Selected</span>
                        )}
                        <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br ${p.coverGradient}`}>
                          <svg className="h-5 w-5 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d={p.coverIcon} />
                          </svg>
                        </div>
                        <span className="text-xs font-semibold text-foreground">{p.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onContinue}
                  className="w-full rounded-lg bg-accent py-2.5 text-sm font-semibold text-white transition hover:bg-accent/90 sm:w-auto sm:px-8"
                >
                  Continue to Progress
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="s2"
                variants={item}
                initial="hidden"
                animate="show"
                exit={{ opacity: 0, y: 8 }}
                className="space-y-5"
              >
                <div className="glass-card space-y-4 p-5 sm:p-6">
                  <h2 className="text-base font-semibold text-foreground">Progress &amp; Timeline</h2>
                  <label className="block space-y-1">
                    <span className="text-xs font-medium text-muted">Current Milestone</span>
                    <input
                      value={currentMilestone}
                      onChange={(e) => setCurrentMilestone(e.target.value)}
                      className="w-full rounded-lg border border-card-border bg-background px-3 py-2 text-sm outline-none focus:border-accent/40"
                      placeholder="Short headline on the card"
                    />
                    {step2Errors.currentMilestone && <p className="text-xs text-loss">{step2Errors.currentMilestone}</p>}
                  </label>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-muted">
                      <span>Milestone progress</span>
                      <span className="font-semibold text-foreground">{milestoneProgress}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={milestoneProgress}
                      onChange={(e) => setMilestoneProgress(Number(e.target.value))}
                      className="slider-thumb w-full accent-accent"
                    />
                  </div>
                  <label className="block space-y-1">
                    <span className="text-xs font-medium text-muted">Current Stage Title</span>
                    <input
                      value={currentStageTitle}
                      onChange={(e) => setCurrentStageTitle(e.target.value)}
                      className="w-full rounded-lg border border-card-border bg-background px-3 py-2 text-sm outline-none focus:border-accent/40"
                    />
                    {step2Errors.currentStageTitle && <p className="text-xs text-loss">{step2Errors.currentStageTitle}</p>}
                  </label>
                  <div className="space-y-1">
                    <span className="text-xs font-medium text-muted">Current Status</span>
                    <div className="flex flex-wrap gap-2">
                      {STAGE_STATUS.map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setCurrentStageStatus(s)}
                          className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                            currentStageStatus === s ? "border-gain/40 bg-gain/10 text-gain" : "border-card-border text-muted hover:text-foreground"
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                  <label className="block space-y-1">
                    <span className="text-xs font-medium text-muted">Current Stage Description</span>
                    <textarea
                      value={currentStageDescription}
                      onChange={(e) => setCurrentStageDescription(e.target.value)}
                      rows={3}
                      className="w-full rounded-lg border border-card-border bg-background px-3 py-2 text-sm outline-none focus:border-accent/40"
                    />
                    {step2Errors.currentStageDescription && <p className="text-xs text-loss">{step2Errors.currentStageDescription}</p>}
                  </label>
                  <label className="block space-y-1">
                    <span className="text-xs font-medium text-muted">Current Stage Deadline</span>
                    <input
                      type="date"
                      value={currentStageDeadline}
                      onChange={(e) => setCurrentStageDeadline(e.target.value)}
                      className="w-full rounded-lg border border-card-border bg-background px-3 py-2 text-sm outline-none focus:border-accent/40"
                    />
                    {step2Errors.currentStageDeadline && <p className="text-xs text-loss">{step2Errors.currentStageDeadline}</p>}
                  </label>

                  <div className="rounded-lg border border-accent/20 bg-accent/5 p-3">
                    <p className="text-xs font-semibold text-accent-light">What investors see here</p>
                    <p className="mt-1 text-[11px] text-muted leading-relaxed">
                      This stage becomes the first batch on your published timeline. Work lines and proof links surface in the investor timeline and transparency
                      rail—titles and deadlines stay locked after you publish.
                    </p>
                  </div>

                  <label className="block space-y-1">
                    <span className="text-xs font-medium text-muted">Completed / Verified Items (one per line)</span>
                    <textarea
                      value={completedVerifiedRaw}
                      onChange={(e) => setCompletedVerifiedRaw(e.target.value)}
                      rows={3}
                      className="w-full rounded-lg border border-card-border bg-background px-3 py-2 text-sm outline-none focus:border-accent/40 font-mono text-xs"
                      placeholder={"Shipped deliverable one\nShipped deliverable two"}
                    />
                  </label>
                  <label className="block space-y-1">
                    <span className="text-xs font-medium text-muted">Current Work / Scope (one per line)</span>
                    <textarea
                      value={currentWorkRaw}
                      onChange={(e) => setCurrentWorkRaw(e.target.value)}
                      rows={3}
                      className="w-full rounded-lg border border-card-border bg-background px-3 py-2 text-sm outline-none focus:border-accent/40 font-mono text-xs"
                    />
                  </label>

                  <div className="border-t border-card-border pt-4 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="text-sm font-semibold text-foreground">Progress Proof</h3>
                      <span className="rounded-full bg-card border border-card-border px-2 py-0.5 text-[10px] font-semibold text-muted">
                        {proofCount} link{proofCount === 1 ? "" : "s"}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted">At least one https link is required before you can publish.</p>
                    <label className="block space-y-1">
                      <span className="text-xs font-medium text-muted">GitHub / Repo URL</span>
                      <input
                        value={proofGithub}
                        onChange={(e) => setProofGithub(e.target.value)}
                        className="w-full rounded-lg border border-card-border bg-background px-3 py-2 text-sm outline-none focus:border-accent/40"
                        placeholder="https://github.com/org/repo"
                      />
                      {step2Errors.proofGithub && <p className="text-xs text-loss">{step2Errors.proofGithub}</p>}
                    </label>
                    <label className="block space-y-1">
                      <span className="text-xs font-medium text-muted">Demo / Build Preview URL</span>
                      <input
                        value={proofDemo}
                        onChange={(e) => setProofDemo(e.target.value)}
                        className="w-full rounded-lg border border-card-border bg-background px-3 py-2 text-sm outline-none focus:border-accent/40"
                        placeholder="https://…"
                      />
                      {step2Errors.proofDemo && <p className="text-xs text-loss">{step2Errors.proofDemo}</p>}
                    </label>
                    <label className="block space-y-1">
                      <span className="text-xs font-medium text-muted">Docs / Screenshots / Drive Folder URL</span>
                      <input
                        value={proofDocs}
                        onChange={(e) => setProofDocs(e.target.value)}
                        className="w-full rounded-lg border border-card-border bg-background px-3 py-2 text-sm outline-none focus:border-accent/40"
                        placeholder="https://…"
                      />
                      {step2Errors.proofDocs && <p className="text-xs text-loss">{step2Errors.proofDocs}</p>}
                    </label>
                    {step2Errors.proof && <p className="text-xs text-loss">{step2Errors.proof}</p>}
                  </div>

                  <label className="block space-y-1">
                    <span className="text-xs font-medium text-muted">Next Stage Title</span>
                    <input
                      value={nextStageTitle}
                      onChange={(e) => setNextStageTitle(e.target.value)}
                      className="w-full rounded-lg border border-card-border bg-background px-3 py-2 text-sm outline-none focus:border-accent/40"
                    />
                    {step2Errors.nextStageTitle && <p className="text-xs text-loss">{step2Errors.nextStageTitle}</p>}
                  </label>
                  <label className="block space-y-1">
                    <span className="text-xs font-medium text-muted">Next Stage Deadline</span>
                    <input
                      type="date"
                      value={nextStageDeadline}
                      onChange={(e) => setNextStageDeadline(e.target.value)}
                      className="w-full rounded-lg border border-card-border bg-background px-3 py-2 text-sm outline-none focus:border-accent/40"
                    />
                    {step2Errors.nextStageDeadline && <p className="text-xs text-loss">{step2Errors.nextStageDeadline}</p>}
                  </label>
                  <label className="block space-y-1">
                    <span className="text-xs font-medium text-muted">Next Stage Description</span>
                    <textarea
                      value={nextStageDescription}
                      onChange={(e) => setNextStageDescription(e.target.value)}
                      rows={3}
                      className="w-full rounded-lg border border-card-border bg-background px-3 py-2 text-sm outline-none focus:border-accent/40"
                    />
                    {step2Errors.nextStageDescription && <p className="text-xs text-loss">{step2Errors.nextStageDescription}</p>}
                  </label>
                </div>

                {submitError && <p className="rounded-lg border border-loss/30 bg-loss/10 px-3 py-2 text-sm text-loss">{submitError}</p>}

                <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="rounded-lg border border-card-border px-4 py-2 text-sm text-muted hover:bg-card"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={onSubmit}
                    className="rounded-lg bg-accent px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-accent/90"
                  >
                    Publish listing
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <aside className="min-w-0 md:sticky md:top-24 md:self-start md:max-h-[calc(100vh-6rem)] md:overflow-y-auto md:overflow-x-hidden md:pl-1">
          <div className="glass-card overflow-hidden p-4 sm:p-5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">Live preview</p>
            <div className={`mt-3 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br ${preset.coverGradient}`}>
              <svg className="h-7 w-7 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d={preset.coverIcon} />
              </svg>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded-full bg-card border border-card-border px-2 py-0.5 text-[10px] font-medium text-muted">{category || "Category"}</span>
              <span className="rounded-full bg-accent/10 border border-accent/20 px-2 py-0.5 text-[10px] font-semibold text-accent-light">
                {daysLeft || "—"}d left
              </span>
            </div>
            <p className="mt-2 text-lg font-bold tabular-nums">{previewPrice > 0 ? formatAlgo(previewPrice, 2) : "—"}</p>
            <p className="text-sm font-semibold leading-snug">{title || "Project title"}</p>
            <p className="text-xs text-muted line-clamp-2">{tagline || "Tagline"}</p>
            <div className="mt-2 flex items-center gap-2">
              <Avatar initials={creator.avatar} size="xs" />
              <span className="text-xs text-muted">{creator.name}</span>
            </div>
            <p className="mt-3 text-xs text-muted line-clamp-4">{description || "Description preview"}</p>
            <div className="mt-2 flex flex-wrap gap-1">
              {(tags.length ? tags : ["tag"]).map((t) => (
                <span key={t} className="rounded-full bg-card border border-card-border px-2 py-0.5 text-[10px] text-muted">
                  {t}
                </span>
              ))}
            </div>
            <div className="mt-4 space-y-1 rounded-lg border border-card-border bg-card/30 p-3">
              <div className="flex justify-between text-[10px] text-muted">
                <span>Funding</span>
                <span className="font-semibold text-foreground">{previewFundedPct}%</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-card-border">
                <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500" style={{ width: `${previewFundedPct}%` }} />
              </div>
              <p className="text-[10px] text-muted">
                Raised {previewRaised ? previewRaised.toLocaleString("en-IN") : "0"} / goal {previewGoal ? previewGoal.toLocaleString("en-IN") : "0"} INR
              </p>
            </div>
            <div className="mt-3 rounded-lg border border-card-border bg-background/40 p-3 text-[11px] text-muted">
              <p className="font-semibold text-foreground text-xs">Current milestone</p>
              <p className="mt-1 line-clamp-2">{currentMilestone || "—"}</p>
              <p className="mt-2 text-[10px]">{milestoneProgress}% complete</p>
            </div>
            <div className="mt-3 space-y-2 rounded-lg border border-card-border bg-card/20 p-3 text-[10px] text-muted">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-foreground/80">Listing summary</p>
              <div className="flex justify-between gap-2">
                <span>Market cap est.</span>
                <span className="font-mono text-foreground/90">{previewPrice > 0 ? `${(previewPrice * 1.1).toFixed(1)}M ALGO` : "—"}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span>INR share (hint)</span>
                <span className="font-mono text-foreground/90">
                  {previewPrice > 0 ? `≈ ${Math.round(previewPrice * INR_HINT).toLocaleString("en-IN")}` : "—"}
                </span>
              </div>
              <div className="flex justify-between gap-2">
                <span>Listing bias</span>
                <span className="text-accent-light">{biasFilterLabel}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span>Proof links</span>
                <span>{proofCount}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span>Timeline lock</span>
                <span className="text-gain">Enabled</span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
