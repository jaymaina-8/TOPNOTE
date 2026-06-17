import type { BookSubcategoryRow, BookTypeFilter } from "@/lib/supabase/types";

export function getBookTypeOptions(bookSubcategories: readonly BookSubcategoryRow[]): {
  value: BookTypeFilter;
  label: string;
}[] {
  return [{ value: "all", label: "All" }, ...bookSubcategories.map((subcategory) => ({ value: subcategory.slug, label: subcategory.name }))];
}

export function parseBookType(value: string | undefined, allowedSlugs: readonly string[]): BookTypeFilter {
  if (!value) return "all";
  const normalized = value.trim().toLowerCase();
  if (normalized === "all") return "all";
  if (allowedSlugs.includes(normalized)) return normalized as BookTypeFilter;
  return "all";
}

export function bookTypeLabel(value: BookTypeFilter): string {
  if (value === "all") return "All";
  return value
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}