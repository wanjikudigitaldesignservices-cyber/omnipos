import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "omnipos-super-secret-jwt-key-2026-secure-token"
);

const COOKIE_NAME = "omnipos_session";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Static assets and internal routes bypass
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Legacy route redirections to new structured routes
  if (pathname === "/setup") {
    return NextResponse.redirect(new URL("/onboarding", request.url));
  }
  if (pathname === "/inventory") {
    return NextResponse.redirect(new URL("/dashboard/inventory", request.url));
  }
  if (pathname === "/customers") {
    return NextResponse.redirect(new URL("/dashboard/customers", request.url));
  }
  if (pathname === "/reports" || pathname === "/expenses") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }
  if (pathname === "/shifts") {
    return NextResponse.redirect(new URL("/dashboard/shifts", request.url));
  }

  const token = request.cookies.get(COOKIE_NAME)?.value;
  let sessionPayload: { userId: string; tenantId: string; onboardingCompleted?: boolean } | null = null;

  if (token) {
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      sessionPayload = payload as unknown as { userId: string; tenantId: string; onboardingCompleted?: boolean };
    } catch {
      sessionPayload = null;
    }
  }

  const isAuthRoute = pathname === "/login" || pathname === "/register";
  const isOnboardingRoute = pathname === "/onboarding";
  const isRootRoute = pathname === "/";

  // 1. Root route handling
  if (isRootRoute) {
    if (!sessionPayload) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    if (sessionPayload.onboardingCompleted === false) {
      return NextResponse.redirect(new URL("/onboarding", request.url));
    }
    return NextResponse.redirect(new URL("/pos", request.url));
  }

  // 2. Auth routes (/login, /register)
  if (isAuthRoute) {
    if (sessionPayload) {
      if (sessionPayload.onboardingCompleted === false) {
        return NextResponse.redirect(new URL("/onboarding", request.url));
      }
      return NextResponse.redirect(new URL("/pos", request.url));
    }
    return NextResponse.next();
  }

  // 3. Onboarding route (/onboarding)
  if (isOnboardingRoute) {
    if (!sessionPayload) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    if (sessionPayload.onboardingCompleted === true) {
      return NextResponse.redirect(new URL("/pos", request.url));
    }
    return NextResponse.next();
  }

  // 4. Protected ERP / POS routes (/pos, /dashboard/*)
  if (!sessionPayload) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (sessionPayload.onboardingCompleted === false) {
    return NextResponse.redirect(new URL("/onboarding", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/login",
    "/register",
    "/onboarding",
    "/setup",
    "/pos/:path*",
    "/dashboard/:path*",
    "/inventory/:path*",
    "/customers/:path*",
    "/expenses/:path*",
    "/reports/:path*",
    "/shifts/:path*",
  ],
};
