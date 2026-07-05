import { NextResponse, type NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/middleware";
import { consumeRateLimit } from "@/lib/security/rate-limiter";
import { RATE_LIMITS, type RateLimitPolicy } from "@/lib/rate-limit/config";
import { trackBlocked } from "@/lib/security/monitoring";

export async function proxy(request: NextRequest) {
  const url = request.nextUrl.clone();
  const pathname = url.pathname;

  // Exempt static assets and Next.js internal paths
  if (
    pathname.startsWith("/_next") ||
    pathname.match(/\.(jpeg|jpg|png|gif|svg|ico|css|js)$/)
  ) {
    return NextResponse.next({ request });
  }

  // 1. Session and Browser Fingerprint Cookie Management
  let response = NextResponse.next({ request });
  let cookiesUpdated = false;

  let sessionId = request.cookies.get("session_id")?.value;
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    request.cookies.set("session_id", sessionId);
    cookiesUpdated = true;
  }

  let visitorId = request.cookies.get("visitor_id")?.value;
  if (!visitorId) {
    visitorId = crypto.randomUUID();
    request.cookies.set("visitor_id", visitorId);
    cookiesUpdated = true;
  }

  if (cookiesUpdated) {
    response = NextResponse.next({
      request: {
        headers: new Headers(request.headers),
      },
    });
    // Set cookies on response to send back to client
    response.cookies.set("session_id", sessionId, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
    });
    response.cookies.set("visitor_id", visitorId, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365, // 1 year
    });
  }

  // 2. Rate Limiting
  let policy: RateLimitPolicy = RATE_LIMITS.public;
  if (pathname.startsWith("/search")) {
    policy = RATE_LIMITS.search;
  } else if (pathname.startsWith("/dashboard/api") || pathname.startsWith("/api/dashboard")) {
    policy = RATE_LIMITS.dashboard;
  }

  try {
    const ctx = {
      ip: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
          request.headers.get("x-real-ip")?.trim() ||
          "127.0.0.1",
      sessionId,
      userAgent: request.headers.get("user-agent") || undefined,
      fingerprint: visitorId,
    };

    const rateLimitResult = await consumeRateLimit(ctx, policy);
    if (!rateLimitResult.allowed) {
      await trackBlocked(ctx.ip, pathname, "rate_limit_exceeded", {
        sessionId: ctx.sessionId,
        userAgent: ctx.userAgent,
        remainingWaitTime: rateLimitResult.retryAfter,
      });

      // Friendly rate limit message formatting
      const waitMessage = getFriendlyRateLimitMessage(rateLimitResult.retryAfter);
      return new NextResponse(waitMessage, {
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

  // 3. Auth Session & Gating (delegated to Supabase middleware helper)
  const { response: authResponse, user } = await updateSession(request);

  // Merge the cookies generated above onto the auth response
  if (sessionId) {
    authResponse.cookies.set("session_id", sessionId, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
    });
  }
  if (visitorId) {
    authResponse.cookies.set("visitor_id", visitorId, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 365,
    });
  }

  if (pathname === "/login" || pathname.startsWith("/login/")) {
    if (user) {
      url.pathname = "/dashboard";
      url.search = "";
      return NextResponse.redirect(url);
    }
    return authResponse;
  }

  if (pathname === "/dashboard" || pathname.startsWith("/dashboard/")) {
    if (!user) {
      url.pathname = "/login";
      url.searchParams.set("next", `${pathname}${request.nextUrl.search}`);
      return NextResponse.redirect(url);
    }
    return authResponse;
  }

  return authResponse;
}

export function getFriendlyRateLimitMessage(retryAfter: number): string {
  if (retryAfter < 60) {
    const sec = Math.max(1, retryAfter);
    return `You're submitting requests very quickly. Please wait about ${sec} seconds before trying again.`;
  }
  const minutes = Math.ceil(retryAfter / 60);
  if (minutes < 60) {
    return `Too many requests. Please try again in approximately ${minutes} ${minutes === 1 ? "minute" : "minutes"}.`;
  }
  const hours = Math.ceil(minutes / 60);
  return `Too many requests. Please try again in approximately ${hours} ${hours === 1 ? "hour" : "hours"}.`;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except static files and icons
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
