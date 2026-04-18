import type { CategoryType } from "@/lib/supabase/types";

export const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** URL-safe slug: lowercase letters, digits, single hyphens between segments. */
export const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const CATEGORY_TYPES: CategoryType[] = ["books", "exams", "stationery", "lab"];

export function isCategoryType(v: string): v is CategoryType {
  return (CATEGORY_TYPES as readonly string[]).includes(v);
}

export function parseOptionalString(formData: FormData, key: string): string | null {
  const raw = formData.get(key)?.toString() ?? "";
  const t = raw.trim();
  return t.length ? t : null;
}

export function parseRequiredString(formData: FormData, key: string): string | null {
  const t = (formData.get(key)?.toString() ?? "").trim();
  return t.length ? t : null;
}

export function parseNonNegativePrice(formData: FormData, key: string): number | null {
  const raw = (formData.get(key)?.toString() ?? "").trim();
  if (!raw.length) return null;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}

export function parseBooleanField(formData: FormData, key: string): boolean {
  return formData.get(key) === "on" || formData.get(key) === "true";
}
