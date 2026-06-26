import { NextResponse, type NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/middleware";
import { consumeRateLimit } from "@/lib/security/rate-limiter";
import { RATE_LIMIT_POLICIES } from "@/lib/security/config";

/**
 * Root Middleware:
 * 1. Global rate limiting for pages and API routes
 * 2. Supabase Auth: refresh session cookies and light route gating for `/login` and `/dashboard/*`.
 */
export async function proxy(request: NextRequest) {
  // 1. Rate Limiting
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "127.0.0.1";
  const url = request.nextUrl.clone();
  const pathname = url.pathname;

  // Determine policy based on route
  let policy = RATE_LIMIT_POLICIES.globalPageLoad;
  if (pathname.startsWith("/search")) {
    policy = RATE_LIMIT_POLICIES.search;
  } else if (pathname.startsWith("/dashboard/api") || pathname.startsWith("/api/dashboard")) {
    policy = RATE_LIMIT_POLICIES.dashboardApi;
  }

  // Exempt static assets and Next.js internal paths from strict rate limits
  if (
    pathname.startsWith("/_next") ||
    pathname.match(/\.(jpeg|jpg|png|gif|svg|ico|css|js)$/)
  ) {
    // skip rate limiting for assets
  } else {
    try {
      const rateLimitResult = await consumeRateLimit(ip, policy);
      if (!rateLimitResult.allowed) {
        return new NextResponse("Too Many Requests. Please try again later.", {
          status: 429,
          headers: {
            "Retry-After": rateLimitResult.retryAfter.toString(),
            "X-RateLimit-Limit": policy.limit.toString(),
            "X-RateLimit-Remaining": rateLimitResult.remaining.toString(),
          },
        });
      }
    } catch (error) {
      console.warn("[Middleware Rate Limiter Error]", error);
    }
  }

  // 2. Auth Session & Gating (from proxy.ts)
  const { response, user } = await updateSession(request);

  if (pathname === "/login" || pathname.startsWith("/login/")) {
    if (user) {
      url.pathname = "/dashboard";
      url.search = "";
      return NextResponse.redirect(url);
    }
    return response;
  }

  if (pathname === "/dashboard" || pathname.startsWith("/dashboard/")) {
    if (!user) {
      url.pathname = "/login";
      url.searchParams.set("next", `${pathname}${request.nextUrl.search}`);
      return NextResponse.redirect(url);
    }
    return response;
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
