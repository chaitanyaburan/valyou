import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectMongo } from "@/lib/db";
import { isValidEmail, normalizeEmail } from "@/lib/auth-helpers";
import {
  createSessionToken,
  SESSION_COOKIE,
  sessionCookieOptions,
} from "@/lib/auth-session";
import { AuthCredentialModel } from "@/models";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { email?: string; password?: string };
    const email = normalizeEmail(typeof body.email === "string" ? body.email : "");
    const password = typeof body.password === "string" ? body.password : "";

    if (!isValidEmail(email) || !password) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    await connectMongo();
    const account = await AuthCredentialModel.findOne({ email }).lean();
    if (!account) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    const ok = await bcrypt.compare(password, account.passwordHash);
    if (!ok) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    const user = {
      userId: account.userId,
      email: account.email,
      displayName: account.displayName,
    };
    const token = await createSessionToken(user);
    const res = NextResponse.json({ ok: true, user });
    res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions);
    return res;
  } catch (e) {
    console.error("login", e);
    return NextResponse.json({ error: "Sign in failed. Try again later." }, { status: 500 });
  }
}
