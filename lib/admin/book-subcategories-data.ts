import { createServiceRoleClient } from "@/lib/supabase/admin";
import type { BookSubcategoryRow } from "@/lib/supabase/types";

/** Dashboard-only: load real book subcategory IDs (avoids stale fallback UUIDs in admin forms). */
export async function listBookSubcategoriesAdmin(): Promise<BookSubcategoryRow[]> {
  const admin = createServiceRoleClient();
  if (!admin) return [];

  const { data, error } = await admin.from("book_subcategories").select("*").order("name", { ascending: true });

  if (error) {
    console.error("[listBookSubcategoriesAdmin]", error.message);
    return [];
  }

  return data ?? [];
}
