import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

export const SESSION_COOKIE = "valyou_session";

export type SessionUser = {
  userId: string;
  email: string;
  displayName: string;
};

const DEV_SESSION_FALLBACK = "development-only-secret-min-32-characters-long!";

function getSecretKey() {
  const raw = process.env.SESSION_SECRET?.trim();
  let secret = raw && raw.length >= 32 ? raw : undefined;

  if (!secret && process.env.NODE_ENV === "development") {
    secret = DEV_SESSION_FALLBACK;
  }

  if (!secret || secret.length < 32) {
    throw new Error(
      "SESSION_SECRET must be set to a random string of at least 32 characters (see .env.example). On Vercel, add it under Project → Settings → Environment Variables.",
    );
  }
  return new TextEncoder().encode(secret);
}

export async function createSessionToken(user: SessionUser): Promise<string> {
  return new SignJWT({
    email: user.email,
    name: user.displayName,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.userId)
    .setIssuedAt()
    .setExpirationTime("14d")
    .sign(getSecretKey());
}

export async function verifySessionToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey(), { algorithms: ["HS256"] });
    const userId = typeof payload.sub === "string" ? payload.sub : null;
    const email = typeof payload.email === "string" ? payload.email : null;
    const displayName = typeof payload.name === "string" ? payload.name : null;
    if (!userId || !email || !displayName) return null;
    return { userId, email, displayName };
  } catch {
    return null;
  }
}

export async function getSessionFromCookies(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export const sessionCookieOptions = {
  httpOnly: true as const,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 14,
};
