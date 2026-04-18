import { sortCategoriesByDisplayOrder } from "@/lib/categories/display-order";
import { createClient } from "@/lib/supabase/server";
import type { CategoryRow, CategoryType } from "@/lib/supabase/types";

export async function getCategories(): Promise<CategoryRow[]> {
  const supabase = await createClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    throw new Error(`getCategories: ${error.message}`);
  }

  return data ?? [];
}

/**
 * Categories whose `type` is in `types`, sorted by {@link sortCategoriesByDisplayOrder}
 * (slug map in `lib/categories/display-order.ts`), not DB or alphabetical order.
 */
export async function getCategoriesByTypes(types: readonly CategoryType[]): Promise<CategoryRow[]> {
  const supabase = await createClient();
  if (!supabase || types.length === 0) return [];
  const { data, error } = await supabase.from("categories").select("*").in("type", [...types]);

  if (error) {
    throw new Error(`getCategoriesByTypes: ${error.message}`);
  }

  const allowed = new Set(types);
  const rows = (data ?? []).filter((c) => allowed.has(c.type));

  console.log(rows.map((c) => c.slug));

  return sortCategoriesByDisplayOrder(rows);
}
