import { NextRequest, NextResponse } from "next/server";
import { verifySession, SESSION_COOKIE } from "@/lib/auth";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow login page, auth API routes, and cron GET to refresh endpoint
  if (
    pathname === "/login" ||
    pathname.startsWith("/api/auth/") ||
    (pathname === "/api/deals/refresh" && req.method === "GET")
  ) {
    return NextResponse.next();
  }

  const token = req.cookies.get(SESSION_COOKIE)?.value;

  if (!token || !(await verifySession(token))) {
    const loginUrl = new URL("/login", req.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Protect everything except static files and Next internals
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
