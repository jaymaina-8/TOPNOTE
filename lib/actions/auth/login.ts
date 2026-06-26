"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { consumeRateLimit } from "@/lib/security/rate-limiter";
import { RATE_LIMIT_POLICIES } from "@/lib/security/config";
import { trackBlocked, trackSuspicious } from "@/lib/security/monitoring";

import type { LoginFormState } from "./login-form-state";

export async function loginAction(_prev: LoginFormState, formData: FormData): Promise<LoginFormState> {
  const reqHeaders = await headers();
  const rawIp = reqHeaders.get("x-forwarded-for")?.split(",")[0] ||
                reqHeaders.get("x-real-ip") ||
                "127.0.0.1";
  const ip = rawIp.trim();

  const email = formData.get("email")?.toString().trim() ?? "";
  const password = formData.get("password")?.toString() ?? "";

  // Bot detection: empty inputs submitted extremely rapidly or malformed
  if (!email || !password) {
    await trackSuspicious(ip, "/login", "empty_login_credentials", { email });
    return { error: "Email and password are required." };
  }

  // Rate Limit Check
  const rateLimitResult = await consumeRateLimit(ip, RATE_LIMIT_POLICIES.loginAttempt);
  if (!rateLimitResult.allowed) {
    await trackBlocked(ip, "/login", "login_rate_limit_exceeded", { email });
    return { error: `Too many login attempts. Please try again in ${rateLimitResult.retryAfter} seconds.` };
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