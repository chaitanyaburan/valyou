import { NextResponse } from "next/server";
import { getSessionFromCookies } from "@/lib/auth-session";

export async function GET() {
  const user = await getSessionFromCookies();
  if (!user) {
    return NextResponse.json({ user: null });
  }
  return NextResponse.json({ user });
}
