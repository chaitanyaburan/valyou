import mongoose, { Schema, type InferSchemaType } from "mongoose";

const batchLinkSchema = new Schema(
  {
    label: { type: String, required: true },
    href: { type: String, required: true },
  },
  { _id: false },
);

const batchSchema = new Schema(
  {
    id: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    deadline: { type: String, required: true },
    completedAt: { type: String },
    status: { type: String, enum: ["completed", "in_progress", "overdue", "upcoming", "blocked"], required: true },
    priceImpact: { type: Number, required: true },
    deliverablesDone: [{ type: String }],
    workInProgress: [{ type: String }],
    plannedScope: [{ type: String }],
    transparencyNote: { type: String },
    transparencyLinks: [batchLinkSchema],
    lastInvestorUpdate: { type: String },
    proofPackageId: { type: String },
    verificationStatus: {
      type: String,
      enum: ["unverified", "verified", "needs_review", "rejected", "blocked"],
      default: "unverified",
    },
    verificationScore: { type: Number },
    riskFlags: [{ type: String }],
    submittedAt: { type: Date },
    verifiedAt: { type: Date },
  },
  { _id: false },
);

const disputeSchema = new Schema(
  {
    id: { type: String, required: true },
    reportedBy: { type: String, required: true },
    reason: { type: String, required: true },
    proofLinks: [{ type: String }],
    votesFor: { type: Number, required: true },
    votesAgainst: { type: Number, required: true },
    status: { type: String, enum: ["open", "confirmed", "cleared"], required: true },
    createdAt: { type: String, required: true },
  },
  { _id: false },
);

const creatorSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    username: { type: String, required: true },
    avatar: { type: String, required: true },
    score: { type: Number, required: true },
    consistency: { type: Number, required: true },
    stakingLevel: { type: String, required: true },
  },
  { timestamps: true, versionKey: false },
);

const projectSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true },
    tagline: { type: String, required: true },
    creatorId: { type: String, required: true, index: true },
    creator: {
      id: { type: String, required: true },
      name: { type: String, required: true },
      username: { type: String, required: true },
      avatar: { type: String, required: true },
      score: { type: Number, required: true },
      consistency: { type: Number, required: true },
      stakingLevel: { type: String, required: true },
    },
    price: { type: Number, required: true },
    change: { type: Number, required: true },
    changePercent: { type: Number, required: true },
    sparkline: [{ type: Number }],
    volume: { type: String, required: true },
    marketCap: { type: String, required: true },
    category: { type: String, required: true },
    tags: [{ type: String }],
    coverGradient: { type: String, required: true },
    coverIcon: { type: String, required: true },
    fundingGoal: { type: Number, required: true },
    fundingRaised: { type: Number, required: true },
    backers: { type: Number, required: true },
    daysLeft: { type: Number, required: true },
    milestone: { type: String, required: true },
    milestoneProgress: { type: Number, required: true },
    filterCategory: { type: String, enum: ["trending", "top", "new"], required: true },
    timelineLocked: { type: Boolean, required: true },
    /** Once true, batches and timeline lock cannot change (enforced in pre-save). */
    publicationLocked: { type: Boolean, default: false },
    publishedAt: { type: Date },
    batches: [batchSchema],
    dispute: disputeSchema,
  },
  { timestamps: true, versionKey: false },
);

projectSchema.pre("save", function projectPublicationImmutability() {
  if (this.isNew) return;
  if (this.publicationLocked) {
    if (this.isModified("batches")) {
      throw new Error("Published timeline batches are immutable.");
    }
    if (this.isModified("timelineLocked")) {
      throw new Error("Timeline lock is immutable after publication.");
    }
  }
});

const holdingSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    projectId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    creatorName: { type: String, required: true },
    avatar: { type: String, required: true },
    invested: { type: Number, required: true },
    currentValue: { type: Number, required: true },
    quantity: { type: Number, required: true },
    reservedQuantity: { type: Number, required: true, default: 0 },
    avgPrice: { type: Number, required: true },
    currentPrice: { type: Number, required: true },
  },
  { timestamps: true, versionKey: false },
);

holdingSchema.index({ userId: 1, projectId: 1 }, { unique: true });

const fundingProjectSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    goal: { type: Number, required: true },
    raised: { type: Number, required: true },
    backers: { type: Number, required: true },
    reward: { type: String, required: true },
    daysLeft: { type: Number, required: true },
    image: { type: String, required: true },
    /** Funding hub lists startup campaigns only; use "other" for non-startup rows (hidden from GET /api/funding). */
    segment: { type: String, enum: ["startup", "other"], default: "startup" },
  },
  { timestamps: true, versionKey: false },
);

const couponSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    userId: { type: String, required: true, index: true },
    code: { type: String, required: true },
    title: { type: String, required: true },
    discount: { type: String, required: true },
    source: { type: String, required: true },
    status: { type: String, enum: ["active", "used", "expired"], required: true },
    expiresAt: { type: String, required: true },
  },
  { timestamps: true, versionKey: false },
);

const walletSchema = new Schema(
  {
    userId: { type: String, required: true, unique: true, index: true },
    balance: { type: Number, required: true },
    availableBalance: { type: Number, required: true, default: 0 },
    reservedBalance: { type: Number, required: true, default: 0 },
    invested: { type: Number, required: true },
    currentValue: { type: Number, required: true },
    pnl: { type: Number, required: true },
    pnlPercent: { type: Number, required: true },
  },
  { timestamps: true, versionKey: false },
);

const profileSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    username: { type: String, required: true },
    avatar: { type: String, required: true },
    bio: { type: String, required: true },
    coverGradient: { type: String, required: true },
    followers: { type: Number, required: true },
    following: { type: Number, required: true },
    projects: { type: Number, required: true },
    score: { type: Number, required: true },
    isVerified: { type: Boolean, required: true },
    joinedDate: { type: String, required: true },
    skills: [{ type: String }],
    githubStars: { type: Number, required: true },
    githubRepos: { type: Number, required: true },
    githubStreak: { type: Number, required: true },
    linkedinConnections: { type: Number, required: true },
    /** Developer credibility (credibility-platform) — optional */
    credibilityGithub: { type: String, trim: true },
    credibilityLeetcode: { type: String, trim: true },
    credibilityCodeforces: { type: String, trim: true },
    walletAddress: { type: String, trim: true, lowercase: true },
    credibilityResult: { type: Schema.Types.Mixed },
    credibilityAt: { type: Date },
  },
  { timestamps: true, versionKey: false },
);

const postSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    userId: { type: String, required: true, index: true },
    userName: { type: String, required: true },
    userAvatar: { type: String, required: true },
    username: { type: String, required: true },
    type: { type: String, enum: ["text", "milestone", "trade", "project"], required: true },
    content: { type: String, required: true },
    likes: { type: Number, required: true },
    comments: { type: Number, required: true },
    shares: { type: Number, required: true },
    endorsements: { type: Number, required: true },
    timestamp: { type: String, required: true },
    timeAgo: { type: String, required: true },
    liked: { type: Boolean, required: true },
  },
  { timestamps: true, versionKey: false },
);

const storySchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    userId: { type: String, required: true, index: true },
    userName: { type: String, required: true },
    userAvatar: { type: String, required: true },
    content: { type: String, required: true },
    type: { type: String, enum: ["update", "milestone", "launch"], required: true },
    gradient: { type: String, required: true },
    viewed: { type: Boolean, required: true },
    projectId: { type: String },
  },
  { timestamps: true, versionKey: false },
);

const messageSchema = new Schema(
  {
    id: { type: String, required: true },
    content: { type: String, required: true },
    timestamp: { type: String, required: true },
    isMine: { type: Boolean, required: true },
  },
  { _id: false },
);

const conversationSchema = new Schema(
  {
    userId: { type: String, required: true, unique: true, index: true },
    userName: { type: String, required: true },
    userAvatar: { type: String, required: true },
    username: { type: String, required: true },
    lastMessage: { type: String, required: true },
    lastTime: { type: String, required: true },
    unread: { type: Number, required: true },
    sharesHeld: { type: Number, required: true },
    messages: [messageSchema],
  },
  { timestamps: true, versionKey: false },
);

const notificationSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    userId: { type: String, required: true, index: true },
    type: { type: String, enum: ["investment", "social", "milestone", "alert"], required: true },
    message: { type: String, required: true },
    detail: { type: String, required: true },
    timeAgo: { type: String, required: true },
    read: { type: Boolean, required: true },
    icon: { type: String, required: true },
  },
  { timestamps: true, versionKey: false },
);

const projectFeedMetaSchema = new Schema(
  {
    projectId: { type: String, required: true, unique: true, index: true },
    description: { type: String, required: true },
    likes: { type: Number, required: true },
    comments: { type: Number, required: true },
    timeAgo: { type: String, required: true },
  },
  { timestamps: true, versionKey: false },
);

/** Append-only publication / transparency audit trail (never updated in app code). */
const transparencyLedgerSchema = new Schema(
  {
    projectId: { type: String, required: true, index: true },
    seq: { type: Number, required: true },
    kind: {
      type: String,
      enum: ["published", "proof_submitted", "proof_verified", "proof_rejected", "penalty_applied", "project_suspended"],
      required: true,
    },
    actorUserId: { type: String, required: true },
    headline: { type: String, required: true },
    snapshot: { type: Schema.Types.Mixed, required: true },
  },
  { timestamps: true, versionKey: false },
);

transparencyLedgerSchema.index({ projectId: 1, seq: 1 }, { unique: true });

const batchProofEvidenceSchema = new Schema(
  {
    type: { type: String, enum: ["commit", "deployment", "task_board", "video", "wallet_attestation"], required: true },
    label: { type: String, required: true },
    url: { type: String, required: true },
    metadata: { type: Schema.Types.Mixed },
  },
  { _id: false },
);

const batchProofVerifierSchema = new Schema(
  {
    verificationStatus: {
      type: String,
      enum: ["verified", "needs_review", "rejected", "blocked"],
      required: true,
    },
    verificationScore: { type: Number, required: true },
    riskFlags: [{ type: String }],
    checks: [{ type: String }],
  },
  { _id: false },
);

const batchProofSubmissionSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    projectId: { type: String, required: true, index: true },
    batchId: { type: String, required: true, index: true },
    submitterUserId: { type: String, required: true, index: true },
    walletAddress: { type: String, required: true, lowercase: true, trim: true },
    signature: { type: String, required: true, trim: true },
    payload: { type: String, required: true },
    evidence: [batchProofEvidenceSchema],
    artifactHashes: [{ type: String, required: true }],
    verifierResult: { type: batchProofVerifierSchema, required: true },
  },
  { timestamps: true, versionKey: false },
);

batchProofSubmissionSchema.index({ projectId: 1, batchId: 1, createdAt: -1 });

const orderSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    projectId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    side: { type: String, enum: ["buy", "sell"], required: true },
    type: { type: String, enum: ["market", "limit"], required: true },
    limitPrice: { type: Number },
    quantity: { type: Number, required: true },
    remainingQuantity: { type: Number, required: true },
    status: { type: String, enum: ["open", "partially_filled", "filled", "cancelled", "rejected"], required: true },
    reservedAlgo: { type: Number, required: true, default: 0 },
    reservedShares: { type: Number, required: true, default: 0 },
  },
  { timestamps: true, versionKey: false },
);

orderSchema.index({ projectId: 1, side: 1, status: 1, limitPrice: 1, createdAt: 1 });
orderSchema.index({ userId: 1, status: 1, createdAt: -1 });

const tradeSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    projectId: { type: String, required: true, index: true },
    type: { type: String, enum: ["buy", "sell"], required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true },
    time: { type: String, required: true },
    user: { type: String, required: true },
    buyerUserId: { type: String },
    sellerUserId: { type: String },
    buyOrderId: { type: String },
    sellOrderId: { type: String },
  },
  { timestamps: true, versionKey: false },
);

tradeSchema.index({ projectId: 1, createdAt: -1 });
tradeSchema.index({ buyerUserId: 1, createdAt: -1 });
tradeSchema.index({ sellerUserId: 1, createdAt: -1 });

const candleSchema = new Schema(
  {
    projectId: { type: String, required: true, index: true },
    time: { type: String, required: true },
    open: { type: Number, required: true },
    high: { type: Number, required: true },
    low: { type: Number, required: true },
    close: { type: Number, required: true },
    volume: { type: Number, required: true },
  },
  { timestamps: true, versionKey: false },
);

candleSchema.index({ projectId: 1, time: 1 }, { unique: true });

const authCredentialSchema = new Schema(
  {
    userId: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, required: true },
    displayName: { type: String, required: true, trim: true },
  },
  { timestamps: true, versionKey: false },
);

/** Razorpay Orders API — server stores expected ALGO credit until payment is verified. */
const razorpayWalletOrderSchema = new Schema(
  {
    razorpayOrderId: { type: String, required: true, unique: true, index: true },
    userId: { type: String, required: true, index: true },
    amountPaise: { type: Number, required: true },
    amountInr: { type: Number, required: true },
    algoCredit: { type: Number, required: true },
    status: { type: String, enum: ["created", "paid", "failed"], required: true, default: "created" },
    razorpayPaymentId: { type: String },
  },
  { timestamps: true, versionKey: false },
);

razorpayWalletOrderSchema.index({ userId: 1, status: 1, createdAt: -1 });

export const CreatorModel = mongoose.models.Creator || mongoose.model("Creator", creatorSchema);
export const ProjectModel = mongoose.models.Project || mongoose.model("Project", projectSchema);
export const HoldingModel = mongoose.models.Holding || mongoose.model("Holding", holdingSchema);
export const FundingProjectModel = mongoose.models.FundingProject || mongoose.model("FundingProject", fundingProjectSchema);
export const CouponModel = mongoose.models.Coupon || mongoose.model("Coupon", couponSchema);
export const WalletModel = mongoose.models.Wallet || mongoose.model("Wallet", walletSchema);
export const UserProfileModel = mongoose.models.UserProfile || mongoose.model("UserProfile", profileSchema);
export const PostModel = mongoose.models.Post || mongoose.model("Post", postSchema);
export const StoryModel = mongoose.models.Story || mongoose.model("Story", storySchema);
export const ConversationModel = mongoose.models.Conversation || mongoose.model("Conversation", conversationSchema);
export const NotificationModel = mongoose.models.Notification || mongoose.model("Notification", notificationSchema);
export const ProjectFeedMetaModel = mongoose.models.ProjectFeedMeta || mongoose.model("ProjectFeedMeta", projectFeedMetaSchema);
export const TransparencyLedgerModel =
  mongoose.models.TransparencyLedger || mongoose.model("TransparencyLedger", transparencyLedgerSchema);
export const BatchProofSubmissionModel =
  mongoose.models.BatchProofSubmission || mongoose.model("BatchProofSubmission", batchProofSubmissionSchema);
export const OrderModel = mongoose.models.Order || mongoose.model("Order", orderSchema);
export const TradeModel = mongoose.models.Trade || mongoose.model("Trade", tradeSchema);
export const CandleModel = mongoose.models.Candle || mongoose.model("Candle", candleSchema);
export const AuthCredentialModel =
  mongoose.models.AuthCredential || mongoose.model("AuthCredential", authCredentialSchema);
export const RazorpayWalletOrderModel =
  mongoose.models.RazorpayWalletOrder || mongoose.model("RazorpayWalletOrder", razorpayWalletOrderSchema);

export type ProjectDoc = InferSchemaType<typeof projectSchema>;
export type TransparencyLedgerDoc = InferSchemaType<typeof transparencyLedgerSchema>;
export type BatchProofSubmissionDoc = InferSchemaType<typeof batchProofSubmissionSchema>;
export type OrderDoc = InferSchemaType<typeof orderSchema>;
export type AuthCredentialDoc = InferSchemaType<typeof authCredentialSchema>;
export type RazorpayWalletOrderDoc = InferSchemaType<typeof razorpayWalletOrderSchema>;

