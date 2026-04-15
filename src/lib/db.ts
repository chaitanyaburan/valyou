import mongoose from "mongoose";
import fs from "node:fs";
import path from "node:path";

type Cached = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

declare global {
  // eslint-disable-next-line no-var
  var __mongoose_cache__: Cached | undefined;
}

const cached: Cached = global.__mongoose_cache__ ?? { conn: null, promise: null };

if (!global.__mongoose_cache__) {
  global.__mongoose_cache__ = cached;
}

function getEnvValue(key: string): string | undefined {
  if (process.env[key]) return process.env[key];
  const candidates = [".env.local", "env.local"];
  for (const fileName of candidates) {
    const filePath = path.join(process.cwd(), fileName);
    if (!fs.existsSync(filePath)) continue;
    const txt = fs.readFileSync(filePath, "utf8");
    for (const line of txt.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const idx = trimmed.indexOf("=");
      if (idx < 0) continue;
      const k = trimmed.slice(0, idx).trim();
      if (k !== key) continue;
      let v = trimmed.slice(idx + 1).trim();
      if (v.startsWith("\"") && v.endsWith("\"")) v = v.slice(1, -1);
      process.env[key] = v;
      return v;
    }
  }
  return undefined;
}

export async function connectMongo() {
  const uri = getEnvValue("MONGODB_URI");
  if (!uri) {
    throw new Error("Missing MONGODB_URI environment variable");
  }
  const dbName = getEnvValue("MONGODB_DB") || "valyou";
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    cached.promise = mongoose.connect(uri, {
      dbName,
      autoIndex: true,
    });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}

