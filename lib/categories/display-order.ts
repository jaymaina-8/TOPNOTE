import type { CategoryType } from "@/lib/supabase/types";

/**
 * Strict public catalog order by normalized slug (not display name, not DB insertion order).
 * Books → Exams → Lab Equipment → Stationery
 *
 * Seed slugs: books, exams, stationery, lab-equipment (`type` for lab is still `lab`).
 */
export const CATEGORY_ORDER: Record<string, number> = {
  books: 1,
  book: 1,
  exams: 2,
  exam: 2,
  "lab-equipment": 3,
  lab: 3,
  stationery: 4,
};

/** Fallback when slug is missing from map — keyed by `categories.type`. */
export const CATEGORY_TYPE_DISPLAY_ORDER: Record<CategoryType, number> = {
  books: 1,
  exams: 2,
  lab: 3,
  stationery: 4,
};

const UNKNOWN_ORDER = 999;

/** Normalize slug for lookup (lowercase, underscores → hyphens). */
export function normalizeCategorySlugKey(slug: string): string {
  return slug.trim().toLowerCase().replace(/_/g, "-");
}

/**
 * Sort key for catalog categories: slug map first, then `type`, then unknown last.
 */
export function categoryDisplaySortIndex(c: { slug: string; type: CategoryType }): number {
  const fromSlug = CATEGORY_ORDER[normalizeCategorySlugKey(c.slug)];
  if (fromSlug !== undefined) return fromSlug;
  const fromType = CATEGORY_TYPE_DISPLAY_ORDER[c.type];
  if (fromType !== undefined) return fromType;
  return UNKNOWN_ORDER;
}

/**
 * Sort category rows for public catalog tabs/filters (slug-driven order).
 */
export function sortCategoriesByDisplayOrder<T extends { type: CategoryType; slug: string }>(
  categories: readonly T[],
): T[] {
  return [...categories].sort((a, b) => {
    const diff = categoryDisplaySortIndex(a) - categoryDisplaySortIndex(b);
    if (diff !== 0) return diff;
    return normalizeCategorySlugKey(a.slug).localeCompare(normalizeCategorySlugKey(b.slug));
  });
}
