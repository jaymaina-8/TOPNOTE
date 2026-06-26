"use server";

import { headers } from "next/headers";

import { createInquiry } from "@/lib/queries/inquiries";
import { validateInquiryInput } from "@/lib/validation/inquiry";
import { consumeRateLimit } from "@/lib/security/rate-limiter";
import { RATE_LIMIT_POLICIES } from "@/lib/security/config";
import { trackBlocked } from "@/lib/security/monitoring";

export type InquiryActionState =
  | { status: "idle" }
  | { status: "error"; error: string }
  | { status: "success"; message: string };

const SUCCESS_MESSAGE =
  "Thank you — we’ve received your message. We’ll get back to you soon.";

export async function submitInquiryAction(
  _prev: InquiryActionState,
  formData: FormData,
): Promise<InquiryActionState> {
  const reqHeaders = await headers();
  const rawIp = reqHeaders.get("x-forwarded-for")?.split(",")[0] ||
                reqHeaders.get("x-real-ip") ||
                "127.0.0.1";
  const ip = rawIp.trim();

  const rateLimitResult = await consumeRateLimit(ip, RATE_LIMIT_POLICIES.inquirySubmit);
  if (!rateLimitResult.allowed) {
    await trackBlocked(ip, "/submit-inquiry", "inquiry_rate_limit_exceeded");
    return { status: "error", error: `Too many requests. Please try again in ${rateLimitResult.retryAfter} seconds.` };
  }

  const validated = validateInquiryInput({
    name: formData.get("name")?.toString(),
    phone: formData.get("phone")?.toString(),
    message: formData.get("message")?.toString(),
    sourceProductId: formData.get("source_product_id")?.toString(),
    sourcePage: formData.get("source_page")?.toString(),
    sourceType: formData.get("source_type")?.toString(),
  });

  if (!validated.ok) {
    return { status: "error", error: validated.error };
  }

  const result = await createInquiry(validated.data);
  if (!result.ok) {
    return { status: "error", error: result.error };
  }

  return { status: "success", message: SUCCESS_MESSAGE };
}
