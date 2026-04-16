import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectMongo } from "@/lib/db";
import {
  displayNameToInitials,
  emailToUsername,
  isValidEmail,
  newUserId,
  normalizeEmail,
} from "@/lib/auth-helpers";
import {
  createSessionToken,
  SESSION_COOKIE,
  sessionCookieOptions,
} from "@/lib/auth-session";
import { AuthCredentialModel, UserProfileModel, WalletModel } from "@/models";

const SALT_ROUNDS = 11;

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      email?: string;
      password?: string;
      displayName?: string;
    };
    const displayName = typeof body.displayName === "string" ? body.displayName.trim() : "";
    const emailRaw = typeof body.email === "string" ? body.email : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!displayName || displayName.length < 2) {
      return NextResponse.json({ error: "Display name must be at least 2 characters." }, { status: 400 });
    }
    if (displayName.length > 80) {
      return NextResponse.json({ error: "Display name is too long." }, { status: 400 });
    }
    const email = normalizeEmail(emailRaw);
    if (!isValidEmail(email)) {
      return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
    }

    await connectMongo();

    const existing = await AuthCredentialModel.findOne({ email }).lean();
    if (existing) {
      return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
    }

    const userId = newUserId();
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    await AuthCredentialModel.create({
      userId,
      email,
      passwordHash,
      displayName,
    });

    await WalletModel.create({
      userId,
      balance: 10_000,
      invested: 0,
      currentValue: 0,
      pnl: 0,
      pnlPercent: 0,
    });

    const joinedDate = new Date().toLocaleDateString("en-IN", { month: "short", year: "numeric" });
    await UserProfileModel.create({
      id: userId,
      name: displayName,
      username: emailToUsername(email, userId),
      avatar: displayNameToInitials(displayName),
      bio: "Valyou member — fund ideas, track outcomes, build reputation.",
      coverGradient: "from-indigo-600 via-purple-600 to-pink-500",
      followers: 0,
      following: 0,
      projects: 0,
      score: 50,
      isVerified: false,
      joinedDate,
      skills: [],
      githubStars: 0,
      githubRepos: 0,
      githubStreak: 0,
      linkedinConnections: 0,
    });

    const token = await createSessionToken({ userId, email, displayName });
    const res = NextResponse.json({
      ok: true,
      user: { userId, email, displayName },
    });
    res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions);
    return res;
  } catch (e) {
    console.error("register", e);
    return NextResponse.json({ error: "Could not create account. Try again later." }, { status: 500 });
  }
}
