import { createServiceRoleClient } from "@/lib/supabase/admin";
import type { CategoryRow } from "@/lib/supabase/types";

export async function listCategoriesAdmin(): Promise<CategoryRow[]> {
  const admin = createServiceRoleClient();
  if (!admin) return [];
  const { data, error } = await admin.from("categories").select("*").order("name", { ascending: true });

  if (error) {
    console.error("[listCategoriesAdmin]", error.message);
    return [];
  }

  return data ?? [];
}

export async function countProductsInCategory(categoryId: string): Promise<number | null> {
  const admin = createServiceRoleClient();
  if (!admin) return null;
  const { count, error } = await admin
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("category_id", categoryId);

  if (error) {
    console.error("[countProductsInCategory]", error.message);
    return null;
  }

  return count ?? 0;
}
