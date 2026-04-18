"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import type { LoginFormState } from "./login-form-state";

export async function loginAction(_prev: LoginFormState, formData: FormData): Promise<LoginFormState> {
  const email = formData.get("email")?.toString().trim() ?? "";
  const password = formData.get("password")?.toString() ?? "";

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const supabase = await createClient();
  if (!supabase) {
    return { error: "Supabase is not configured on this server." };
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: error.message || "Could not sign in." };
  }

  redirect("/dashboard");
}