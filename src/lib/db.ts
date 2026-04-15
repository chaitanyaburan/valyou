import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

let isConnected = false;

export async function connectDb(): Promise<boolean> {
  if (!MONGODB_URI) {
    return false;
  }

  if (isConnected) {
    return true;
  }

  try {
    await mongoose.connect(MONGODB_URI, {
      dbName: process.env.MONGODB_DB_NAME ?? "valyou",
    });
    isConnected = true;
    return true;
  } catch (error) {
    console.error("MongoDB connection failed, falling back to in-memory store.", error);
    return false;
  }
}
