import { createHash } from "node:crypto";

export type ProofEvidenceType = "commit" | "deployment" | "task_board" | "video" | "wallet_attestation";

export type ProofEvidenceInput = {
  type: ProofEvidenceType;
  label: string;
  url: string;
  metadata?: Record<string, unknown>;
};

export type ProofVerificationStatus = "verified" | "needs_review" | "rejected" | "blocked";

export type VerifierOutput = {
  verificationStatus: ProofVerificationStatus;
  verificationScore: number;
  riskFlags: string[];
  checks: string[];
  artifactHashes: string[];
};

function sha256(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}

function stable(value: unknown): string {
  return JSON.stringify(value, Object.keys((value as Record<string, unknown>) || {}).sort());
}

export function buildExpectedSignature(payload: string, walletAddress: string): string {
  return sha256(`${payload}:${walletAddress.toLowerCase()}`);
}

export function hashEvidence(ev: ProofEvidenceInput): string {
  return sha256(`${ev.type}|${ev.label.trim()}|${ev.url.trim()}|${stable(ev.metadata ?? {})}`);
}

async function isUrlReachable(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { method: "HEAD", cache: "no-store" });
    return res.ok;
  } catch {
    return false;
  }
}

function isHttpUrl(url: string): boolean {
  return /^https?:\/\//i.test(url);
}

export async function verifyProofPackage(args: {
  projectId: string;
  batchId: string;
  payload: string;
  walletAddress: string;
  signature: string;
  evidence: ProofEvidenceInput[];
  expectedRepoPrefix?: string;
  existingHashes?: Set<string>;
}): Promise<VerifierOutput> {
  const checks: string[] = [];
  const riskFlags: string[] = [];
  let score = 100;

  const requiredTypes: ProofEvidenceType[] = ["commit", "deployment", "task_board", "video", "wallet_attestation"];
  const byType = new Map<ProofEvidenceType, ProofEvidenceInput[]>();
  for (const ev of args.evidence) {
    const list = byType.get(ev.type) ?? [];
    list.push(ev);
    byType.set(ev.type, list);
  }

  for (const rt of requiredTypes) {
    if (!byType.get(rt)?.length) {
      riskFlags.push(`missing_${rt}`);
      score -= 25;
    } else {
      checks.push(`required_${rt}_present`);
    }
  }

  const expectedSig = buildExpectedSignature(args.payload, args.walletAddress);
  if (expectedSig !== args.signature.trim().toLowerCase()) {
    riskFlags.push("signature_mismatch");
    score -= 35;
  } else {
    checks.push("signature_verified");
  }

  const artifactHashes = args.evidence.map((ev) => hashEvidence(ev));
  if (new Set(artifactHashes).size !== artifactHashes.length) {
    riskFlags.push("duplicate_evidence_in_submission");
    score -= 20;
  } else {
    checks.push("artifact_hashes_unique_in_submission");
  }

  if (args.existingHashes) {
    const reused = artifactHashes.some((h) => args.existingHashes?.has(h));
    if (reused) {
      riskFlags.push("duplicate_evidence_reused");
      score -= 40;
    } else {
      checks.push("no_reused_hashes");
    }
  }

  for (const ev of args.evidence) {
    if (!ev.label.trim()) {
      riskFlags.push("empty_evidence_label");
      score -= 8;
    }
    if (!isHttpUrl(ev.url)) {
      riskFlags.push("invalid_url_protocol");
      score -= 20;
      continue;
    }
    if (ev.type === "commit") {
      if (!/github\.com\/.+\/.+\/(commit|pull)\//i.test(ev.url)) {
        riskFlags.push("invalid_commit_link");
        score -= 20;
      }
      if (args.expectedRepoPrefix && !ev.url.toLowerCase().includes(args.expectedRepoPrefix.toLowerCase())) {
        riskFlags.push("repo_mismatch");
        score -= 18;
      }
    }
    if (ev.type === "deployment" && !/vercel|netlify|render|fly\.io|cloudflare|railway|aws|azure|gcp/i.test(ev.url)) {
      riskFlags.push("suspicious_deployment_link");
      score -= 12;
    }
    const reachable = await isUrlReachable(ev.url);
    if (!reachable) {
      riskFlags.push(`url_unreachable_${ev.type}`);
      score -= 8;
    } else {
      checks.push(`url_reachable_${ev.type}`);
    }
  }

  let verificationStatus: ProofVerificationStatus = "verified";
  if (riskFlags.includes("duplicate_evidence_reused") || riskFlags.includes("signature_mismatch")) {
    verificationStatus = "blocked";
  } else if (score < 60) {
    verificationStatus = "rejected";
  } else if (score < 80) {
    verificationStatus = "needs_review";
  }

  return {
    verificationStatus,
    verificationScore: Math.max(0, Math.min(100, score)),
    riskFlags: Array.from(new Set(riskFlags)),
    checks: Array.from(new Set(checks)),
    artifactHashes,
  };
}

