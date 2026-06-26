import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { isAllowedRedirectTarget } from "@/lib/conversion/validate-redirect";
import { trackPhoneClick, trackWhatsAppClick } from "@/lib/conversion/track";
import { consumeRateLimit } from "@/lib/security/rate-limiter";
import { RATE_LIMIT_POLICIES } from "@/lib/security/config";
import { trackBlocked } from "@/lib/security/monitoring";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(request: Request) {
  const reqHeaders = await headers();
  const rawIp = reqHeaders.get("x-forwarded-for")?.split(",")[0] ||
                reqHeaders.get("x-real-ip") ||
                "127.0.0.1";
  const ip = rawIp.trim();

  const rateLimitResult = await consumeRateLimit(ip, RATE_LIMIT_POLICIES.analyticsTrack);
  if (!rateLimitResult.allowed) {
    await trackBlocked(ip, "/api/track-and-redirect", "analytics_rate_limit_exceeded");
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }

  const { searchParams } = new URL(request.url);
  const event = searchParams.get("event");
  const to = searchParams.get("to");
  const sourcePage = searchParams.get("source_page");
  const sourceProductRaw = searchParams.get("source_product_id");

  if (!to || !isAllowedRedirectTarget(to)) {
    return NextResponse.json({ error: "Invalid redirect target." }, { status: 400 });
  }

  if (event !== "whatsapp_click" && event !== "phone_click") {
    return NextResponse.json({ error: "Invalid event." }, { status: 400 });
  }

  let sourceProductId: string | null = null;
  if (sourceProductRaw) {
    if (!UUID_RE.test(sourceProductRaw)) {
      return NextResponse.json({ error: "Invalid source product." }, { status: 400 });
    }
    sourceProductId = sourceProductRaw;
  }

  if (event === "whatsapp_click") {
    await trackWhatsAppClick({ sourcePage, sourceProductId });
  } else {
    await trackPhoneClick({ sourcePage, sourceProductId });
  }

  return NextResponse.redirect(to, 302);
}
