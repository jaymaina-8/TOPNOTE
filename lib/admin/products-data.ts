import { createServiceRoleClient } from "@/lib/supabase/admin";
import type { ProductWithCategory } from "@/lib/supabase/types";

const productWithCategorySelect = "*, categories(*)" as const;

export async function listProductsAdmin(): Promise<ProductWithCategory[]> {
  const admin = createServiceRoleClient();
  if (!admin) return [];
  const { data, error } = await admin
    .from("products")
    .select(productWithCategorySelect)
    .order("name", { ascending: true });

  if (error) {
    console.error("[listProductsAdmin]", error.message);
    return [];
  }

  return (data as ProductWithCategory[]) ?? [];
}

export async function getProductByIdAdmin(id: string): Promise<ProductWithCategory | null> {
  const admin = createServiceRoleClient();
  if (!admin) return null;
  const { data, error } = await admin
    .from("products")
    .select(productWithCategorySelect)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("[getProductByIdAdmin]", error.message);
    return null;
  }

  return data as ProductWithCategory | null;
}
