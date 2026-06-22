import { type NextRequest, NextResponse } from "next/server";

import { updateSession } from "@/lib/supabase/middleware";

/**
 * Supabase Auth: refresh session cookies and light route gating for `/login` and `/dashboard/*`.
 * Allowlist and full access checks live in `app/dashboard/layout.tsx` and server actions — not here.
 */
export async function proxy(request: NextRequest) {
  const { response, user } = await updateSession(request);
  const url = request.nextUrl.clone();
  const pathname = url.pathname;

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
  matcher: ["/login", "/login/:path*", "/dashboard", "/dashboard/:path*"],
};
