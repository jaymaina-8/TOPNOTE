import { sortCategoriesByDisplayOrder } from "@/lib/categories/display-order";
import { fallbackCategories, getFallbackCategoriesByTypes } from "@/lib/content/catalogFallback";
import { createClient } from "@/lib/supabase/server";
import type { CategoryRow, CategoryType } from "@/lib/supabase/types";

export async function getCategories(): Promise<CategoryRow[]> {
  const supabase = await createClient();
  if (!supabase) return fallbackCategories;

  try {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("name", { ascending: true });

    if (error) return fallbackCategories;

    return data ?? [];
  } catch {
    return fallbackCategories;
  }
}

/**
 * Categories whose `type` is in `types`, sorted by {@link sortCategoriesByDisplayOrder}
 * (slug map in `lib/categories/display-order.ts`), not DB or alphabetical order.
 */
export async function getCategoriesByTypes(types: readonly CategoryType[]): Promise<CategoryRow[]> {
  const supabase = await createClient();
  if (types.length === 0) return [];
  if (!supabase) return getFallbackCategoriesByTypes(types);

  try {
    const { data, error } = await supabase.from("categories").select("*").in("type", [...types]);

    if (error) return getFallbackCategoriesByTypes(types);

    const allowed = new Set(types);
    const rows = (data ?? []).filter((c) => allowed.has(c.type));

    return sortCategoriesByDisplayOrder(rows);
  } catch {
    return getFallbackCategoriesByTypes(types);
  }
}
