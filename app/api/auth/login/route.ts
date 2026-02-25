import { NextRequest, NextResponse } from "next/server";
import { createSession, validateCredentials, SESSION_COOKIE } from "@/lib/auth";

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

const failedAttempts = new Map<string, { count: number; firstAttempt: number }>();

function getClientIp(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

function isRateLimited(ip: string): boolean {
  const entry = failedAttempts.get(ip);
  if (!entry) return false;

  if (Date.now() - entry.firstAttempt > WINDOW_MS) {
    failedAttempts.delete(ip);
    return false;
  }

  return entry.count >= MAX_ATTEMPTS;
}

function recordFailure(ip: string): void {
  const entry = failedAttempts.get(ip);
  if (!entry || Date.now() - entry.firstAttempt > WINDOW_MS) {
    failedAttempts.set(ip, { count: 1, firstAttempt: Date.now() });
  } else {
    entry.count++;
  }
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Too many login attempts. Please try again later." },
      { status: 429 }
    );
  }

  const { email, password } = await req.json();

  if (!(await validateCredentials(email, password))) {
    recordFailure(ip);
    return NextResponse.json(
      { error: "Invalid email or password" },
      { status: 401 }
    );
  }

  // Clear failed attempts on successful login
  failedAttempts.delete(ip);

  const token = await createSession();

  const response = NextResponse.json({ success: true });
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  });

  return response;
}
