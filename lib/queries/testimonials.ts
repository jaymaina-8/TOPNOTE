import { createClient } from "@/lib/supabase/server";
import type { TestimonialRow } from "@/lib/supabase/types";

export async function getTestimonials(): Promise<TestimonialRow[]> {
  const supabase = await createClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("testimonials")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`getTestimonials: ${error.message}`);
  }

  return data ?? [];
}
