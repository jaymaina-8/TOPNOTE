"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { consumeRateLimit, getRateLimitContext, getFriendlyRateLimitMessage } from "@/lib/security/rate-limiter";
import { RATE_LIMITS } from "@/lib/rate-limit/config";
import { trackBlocked, trackSuspicious } from "@/lib/security/monitoring";

import type { LoginFormState } from "./login-form-state";

export async function loginAction(_prev: LoginFormState, formData: FormData): Promise<LoginFormState> {
  const ctx = await getRateLimitContext();
  const email = formData.get("email")?.toString().trim() ?? "";
  const password = formData.get("password")?.toString() ?? "";

  // Bot detection: empty inputs submitted extremely rapidly or malformed
  if (!email || !password) {
    await trackSuspicious(ctx.ip, "/login", "empty_login_credentials", { email });
    return { error: "Email and password are required." };
  }

  // Rate Limit Check
  const rateLimitResult = await consumeRateLimit(ctx, RATE_LIMITS.login);
  if (!rateLimitResult.allowed) {
    await trackBlocked(ctx.ip, "/login", "login_rate_limit_exceeded", {
      email,
      sessionId: ctx.sessionId,
      userAgent: ctx.userAgent,
      remainingWaitTime: rateLimitResult.retryAfter,
    });
    return { error: getFriendlyRateLimitMessage(rateLimitResult.retryAfter) };
  }

  try {
    const supabase = await createClient();
    if (!supabase) {
      return { error: "Supabase is not configured on this server." };
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      return { error: "Invalid email or password." }; // Safe warning, do not leak internal details
    }
  } catch (err: any) {
    console.error("[loginAction] Unexpected error:", err);
    return { error: "An unexpected error occurred. Please try again later." };
  }

  redirect("/dashboard");
}