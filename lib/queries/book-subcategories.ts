import { fallbackBookSubcategories } from "@/lib/content/catalogFallback";
import { createClient } from "@/lib/supabase/server";
import type { BookSubcategoryRow } from "@/lib/supabase/types";

export async function getBookSubcategories(): Promise<BookSubcategoryRow[]> {
  const supabase = await createClient();
  if (!supabase) return fallbackBookSubcategories;

  try {
    const { data, error } = await supabase.from("book_subcategories").select("*").order("name", { ascending: true });

    if (error) return fallbackBookSubcategories;

    return data ?? [];
  } catch {
    return fallbackBookSubcategories;
  }
}