import mongoose, { type InferSchemaType, Schema } from "mongoose";

const userSchema = new Schema(
  {
    wallet_address: { type: String, required: true, unique: true, index: true },
  },
  { timestamps: true },
);

const projectSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    description: { type: String, required: true },
    total_tokens: { type: Number, required: true },
    price_per_token: { type: Number, required: true },
    sold_tokens: { type: Number, required: true, default: 0 },
  },
  { timestamps: true },
);

const investmentSchema = new Schema(
  {
    user_wallet: { type: String, required: true, index: true },
    project_id: { type: String, required: true, index: true },
    tokens_owned: { type: Number, required: true },
    transaction_hash: { type: String, required: true },
  },
  { timestamps: true },
);

export type ProjectDoc = InferSchemaType<typeof projectSchema>;
export type InvestmentDoc = InferSchemaType<typeof investmentSchema>;

export const UserModel = mongoose.models.User || mongoose.model("User", userSchema);
export const ProjectModel = mongoose.models.Project || mongoose.model("Project", projectSchema);
export const InvestmentModel =
  mongoose.models.Investment || mongoose.model("Investment", investmentSchema);
