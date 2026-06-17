import { fallbackProducts, getFallbackProductsByCategoryTypes } from "@/lib/content/catalogFallback";
import { createClient } from "@/lib/supabase/server";
import type { CategoryType, ProductWithCategory } from "@/lib/supabase/types";

const productWithCategorySelect = "*, categories(*), bookSubcategory:book_subcategories(*)" as const;

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
  if (types.length === 0) return [];
  if (!supabase) return getFallbackProductsByCategoryTypes(types);

  try {
    const { data: categories, error: categoriesError } = await supabase
      .from("categories")
      .select("id")
      .in("type", [...types]);

    if (categoriesError) return getFallbackProductsByCategoryTypes(types);

    const categoryIds = (categories ?? []).map((c) => c.id);
    if (categoryIds.length === 0) return getFallbackProductsByCategoryTypes(types);

    const { data, error } = await supabase
      .from("products")
      .select(productWithCategorySelect)
      .in("category_id", categoryIds)
      .order("name", { ascending: true });

    if (error) return getFallbackProductsByCategoryTypes(types);

    return (data as ProductWithCategory[]) ?? [];
  } catch {
    return getFallbackProductsByCategoryTypes(types);
  }
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
  if (!supabase) return sortFeaturedProducts(fallbackProducts);

  try {
    const { data, error } = await supabase
      .from("products")
      .select(productWithCategorySelect)
      .eq("is_featured", true);

    if (error) return sortFeaturedProducts(fallbackProducts);

    const rows = (data as ProductWithCategory[]) ?? [];
    return sortFeaturedProducts(rows);
  } catch {
    return sortFeaturedProducts(fallbackProducts);
  }
}

export async function getAllProducts(): Promise<ProductWithCategory[]> {
  const supabase = await createClient();
  if (!supabase) return sortProductsByName(fallbackProducts);

  try {
    const { data, error } = await supabase
      .from("products")
      .select(productWithCategorySelect)
      .order("name", { ascending: true });

    if (error) return sortProductsByName(fallbackProducts);

    return (data as ProductWithCategory[]) ?? [];
  } catch {
    return sortProductsByName(fallbackProducts);
  }
}

export async function getProductBySlug(
  slug: string,
): Promise<ProductWithCategory | null> {
  const supabase = await createClient();
  if (!supabase) return getFallbackProductBySlug(slug);

  try {
    const { data, error } = await supabase
      .from("products")
      .select(productWithCategorySelect)
      .eq("slug", slug)
      .maybeSingle();

    if (error) return getFallbackProductBySlug(slug);

    return data as ProductWithCategory | null;
  } catch {
    return getFallbackProductBySlug(slug);
  }
}

function sortFeaturedProducts(products: ProductWithCategory[]): ProductWithCategory[] {
  return products
    .filter((product) => product.is_featured)
    .sort((a, b) => {
      const diff = gradeSortKey(a.grade) - gradeSortKey(b.grade);
      if (diff !== 0) return diff;
      return a.name.localeCompare(b.name);
    });
}

function sortProductsByName(products: ProductWithCategory[]): ProductWithCategory[] {
  return [...products].sort((a, b) => a.name.localeCompare(b.name));
}

function getFallbackProductBySlug(slug: string): ProductWithCategory | null {
  return fallbackProducts.find((product) => product.slug === slug) ?? null;
}
