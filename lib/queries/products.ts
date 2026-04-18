import { createClient } from "@/lib/supabase/server";
import type { CategoryType, ProductWithCategory } from "@/lib/supabase/types";

const productWithCategorySelect = "*, categories(*)" as const;

/** Categories shown on the parent catalog (home & individual purchase). */
export const PARENT_CATEGORY_TYPES: readonly CategoryType[] = ["books", "stationery"];

/** Categories shown on the school / bulk catalog (same canonical order as catalog filters). */
export const SCHOOL_CATEGORY_TYPES: readonly CategoryType[] = ["books", "exams", "lab", "stationery"];

/** Category types for the public /products page filters (four pills). */
export const ALL_CATALOG_CATEGORY_TYPES: readonly CategoryType[] = ["books", "exams", "lab", "stationery"];

/**
 * Products whose category `type` is one of the given values (via `categories.type`, not name).
 */
export async function getProductsByCategoryTypes(
  types: readonly CategoryType[],
): Promise<ProductWithCategory[]> {
  const supabase = await createClient();
  if (!supabase || types.length === 0) return [];

  const { data: categories, error: categoriesError } = await supabase
    .from("categories")
    .select("id")
    .in("type", [...types]);

  if (categoriesError) {
    throw new Error(`getProductsByCategoryTypes (categories): ${categoriesError.message}`);
  }

  const categoryIds = (categories ?? []).map((c) => c.id);
  if (categoryIds.length === 0) return [];

  const { data, error } = await supabase
    .from("products")
    .select(productWithCategorySelect)
    .in("category_id", categoryIds)
    .order("name", { ascending: true });

  if (error) {
    throw new Error(`getProductsByCategoryTypes: ${error.message}`);
  }

  return (data as ProductWithCategory[]) ?? [];
}

export async function getParentProducts(): Promise<ProductWithCategory[]> {
  return getProductsByCategoryTypes(PARENT_CATEGORY_TYPES);
}

export async function getSchoolProducts(): Promise<ProductWithCategory[]> {
  return getProductsByCategoryTypes(SCHOOL_CATEGORY_TYPES);
}

/** Numeric grade for sort (e.g. "Grade 4", "4" → 4). Missing grade sorts last. */
function gradeSortKey(grade: string | null): number {
  if (grade == null || grade.trim() === "") return 10_000;
  const match = grade.match(/\d+/);
  return match ? parseInt(match[0], 10) : 10_000;
}

export async function getFeaturedProducts(): Promise<ProductWithCategory[]> {
  const supabase = await createClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("products")
    .select(productWithCategorySelect)
    .eq("is_featured", true);

  if (error) {
    throw new Error(`getFeaturedProducts: ${error.message}`);
  }

  const rows = (data as ProductWithCategory[]) ?? [];
  return [...rows].sort((a, b) => {
    const diff = gradeSortKey(a.grade) - gradeSortKey(b.grade);
    if (diff !== 0) return diff;
    return a.name.localeCompare(b.name);
  });
}

export async function getAllProducts(): Promise<ProductWithCategory[]> {
  const supabase = await createClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("products")
    .select(productWithCategorySelect)
    .order("name", { ascending: true });

  if (error) {
    throw new Error(`getAllProducts: ${error.message}`);
  }

  return (data as ProductWithCategory[]) ?? [];
}

export async function getProductBySlug(
  slug: string,
): Promise<ProductWithCategory | null> {
  const supabase = await createClient();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("products")
    .select(productWithCategorySelect)
    .eq("slug", slug)
    .maybeSingle();

  if (error) {
    throw new Error(`getProductBySlug: ${error.message}`);
  }

  return data as ProductWithCategory | null;
}
