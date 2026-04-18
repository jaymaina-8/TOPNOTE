import { createServiceRoleClient } from "@/lib/supabase/admin";
import type { TestimonialRow } from "@/lib/supabase/types";

export async function listTestimonialsAdmin(): Promise<TestimonialRow[]> {
  const admin = createServiceRoleClient();
  if (!admin) return [];
  const { data, error } = await admin
    .from("testimonials")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[listTestimonialsAdmin]", error.message);
    return [];
  }

  return data ?? [];
}
