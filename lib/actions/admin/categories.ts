"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { countProductsInCategory } from "@/lib/admin/categories-data";
import {
  isCategoryType,
  parseRequiredString,
  SLUG_RE,
  UUID_RE,
} from "@/lib/admin/validation";
import type { CategoryFormState } from "@/lib/admin/action-form-state";
import { guardDashboardFormMutation, guardDashboardVoidMutation } from "@/lib/auth/dashboard-access";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import type { CategoryType } from "@/lib/supabase/types";

export async function createCategoryAction(
  _prev: CategoryFormState,
  formData: FormData,
): Promise<CategoryFormState> {
  const denied = await guardDashboardFormMutation();
  if (denied) return denied;
  const admin = createServiceRoleClient();
  if (!admin) return { error: "Service role is not configured on this server." };

  const name = parseRequiredString(formData, "name");
  const slug = parseRequiredString(formData, "slug");
  const typeRaw = parseRequiredString(formData, "type");

  if (!name) return { error: "Name is required." };
  if (!slug) return { error: "Slug is required." };
  if (!SLUG_RE.test(slug)) return { error: "Slug must be lowercase letters, digits, and single hyphens only." };
  if (!typeRaw || !isCategoryType(typeRaw)) return { error: "Choose a valid type." };

  const type = typeRaw as CategoryType;

  const { error: insertError } = await admin.from("categories").insert({ name, slug, type });

  if (insertError) {
    if (insertError.code === "23505") return { error: "A category with that slug already exists." };
    console.error("[createCategoryAction]", insertError.message);
    return { error: "Could not create category." };
  }

  revalidatePath("/dashboard/categories");
  revalidatePath("/products");
  revalidatePath("/");
  redirect("/dashboard/categories");
}

export async function deleteCategoryAction(formData: FormData): Promise<void> {
  const allowed = await guardDashboardVoidMutation();
  if (!allowed) return;
  const admin = createServiceRoleClient();
  if (!admin) {
    redirect("/dashboard/categories?error=delete");
  }

  const id = parseRequiredString(formData, "id");
  if (!id || !UUID_RE.test(id)) return;

  const n = await countProductsInCategory(id);
  if (n === null) {
    redirect("/dashboard/categories?error=count");
  }
  if (n > 0) {
    redirect(`/dashboard/categories?blocked=1&count=${n}`);
  }

  const { error: deleteError } = await admin.from("categories").delete().eq("id", id);
  if (deleteError) {
    console.error("[deleteCategoryAction]", deleteError.message);
    redirect("/dashboard/categories?error=delete");
  }

  revalidatePath("/dashboard/categories");
  revalidatePath("/dashboard/products");
  revalidatePath("/products");
  revalidatePath("/");
  redirect("/dashboard/categories");
}
