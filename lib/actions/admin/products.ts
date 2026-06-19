"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  parseBooleanField,
  parseNonNegativePrice,
  parseOptionalString,
  parseRequiredString,
  SLUG_RE,
  UUID_RE,
} from "@/lib/admin/validation";
import type { ProductFormState } from "@/lib/admin/action-form-state";
import { guardDashboardFormMutation, guardDashboardVoidMutation } from "@/lib/auth/dashboard-access";
import {
  getFormImageFile,
  tryRemoveReplacedProductImage,
  uploadProductImage,
} from "@/lib/storage/product-images";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { getSupabaseServiceRoleConfig } from "@/lib/supabase/env";

export async function createProductAction(_prev: ProductFormState, formData: FormData): Promise<ProductFormState> {
  const denied = await guardDashboardFormMutation();
  if (denied) return denied;
  const admin = createServiceRoleClient();
  if (!admin) return { error: "Service role is not configured on this server." };

  const name = parseRequiredString(formData, "name");
  const slug = parseRequiredString(formData, "slug");
  const categoryId = parseRequiredString(formData, "category_id");
  const bookSubcategoryId = parseOptionalString(formData, "book_subcategory_id");
  const price = parseNonNegativePrice(formData, "price");
  const description = parseOptionalString(formData, "description");
  const grade = parseOptionalString(formData, "grade");
  const isFeatured = parseBooleanField(formData, "is_featured");

  if (!name) return { error: "Name is required." };
  if (!slug) return { error: "Slug is required." };
  if (!SLUG_RE.test(slug)) return { error: "Slug must be lowercase letters, digits, and single hyphens only." };
  if (!categoryId || !UUID_RE.test(categoryId)) return { error: "Choose a valid category." };
  if (price === null) return { error: "Price must be a non-negative number." };

  const { data: cat, error: catErr } = await admin.from("categories").select("id, type").eq("id", categoryId).maybeSingle();
  if (catErr || !cat) return { error: "That category does not exist." };

  const isBookCategory = cat.type === "books";

  let normalizedBookSubcategoryId: string | null = null;
  if (isBookCategory) {
    if (!bookSubcategoryId || !UUID_RE.test(bookSubcategoryId)) return { error: "Choose a book type." };
    const { data: bookSubcategory, error: bookSubcategoryErr } = await admin
      .from("book_subcategories")
      .select("id")
      .eq("id", bookSubcategoryId)
      .maybeSingle();
    if (bookSubcategoryErr || !bookSubcategory) return { error: "That book type does not exist." };
    normalizedBookSubcategoryId = bookSubcategory.id;
  } else if (bookSubcategoryId) {
    return { error: "Book type can only be set for Books." };
  }

  let imageUrl: string | null = null;
  const imageFile = getFormImageFile(formData);
  if (imageFile) {
    const uploaded = await uploadProductImage(admin, imageFile, slug);
    if (!uploaded.ok) return { error: uploaded.error };
    imageUrl = uploaded.publicUrl;
  }

  const { error: insertError } = await admin.from("products").insert({
    name,
    slug,
    category_id: categoryId,
    book_subcategory_id: normalizedBookSubcategoryId,
    price,
    image_url: imageUrl,
    description,
    grade,
    is_featured: isFeatured,
  });

  if (insertError) {
    if (insertError.code === "23505") return { error: "A product with that slug already exists." };
    console.error("[createProductAction]", insertError.message);
    return { error: "Could not create product." };
  }

  revalidatePath("/dashboard/products");
  revalidatePath("/products");
  revalidatePath("/");
  return { error: null, success: true };
}

export async function updateProductAction(_prev: ProductFormState, formData: FormData): Promise<ProductFormState> {
  const denied = await guardDashboardFormMutation();
  if (denied) return denied;
  const admin = createServiceRoleClient();
  if (!admin) return { error: "Service role is not configured on this server." };

  const id = parseRequiredString(formData, "id");
  const name = parseRequiredString(formData, "name");
  const slug = parseRequiredString(formData, "slug");
  const categoryId = parseRequiredString(formData, "category_id");
  const bookSubcategoryId = parseOptionalString(formData, "book_subcategory_id");
  const price = parseNonNegativePrice(formData, "price");
  const description = parseOptionalString(formData, "description");
  const grade = parseOptionalString(formData, "grade");
  const isFeatured = parseBooleanField(formData, "is_featured");

  if (!id || !UUID_RE.test(id)) return { error: "Invalid product." };
  if (!name) return { error: "Name is required." };
  if (!slug) return { error: "Slug is required." };
  if (!SLUG_RE.test(slug)) return { error: "Slug must be lowercase letters, digits, and single hyphens only." };
  if (!categoryId || !UUID_RE.test(categoryId)) return { error: "Choose a valid category." };
  if (price === null) return { error: "Price must be a non-negative number." };

  const { data: cat, error: catErr } = await admin.from("categories").select("id, type").eq("id", categoryId).maybeSingle();
  if (catErr || !cat) return { error: "That category does not exist." };

  const isBookCategory = cat.type === "books";

  let normalizedBookSubcategoryId: string | null = null;
  if (isBookCategory) {
    if (!bookSubcategoryId || !UUID_RE.test(bookSubcategoryId)) return { error: "Choose a book type." };
    const { data: bookSubcategory, error: bookSubcategoryErr } = await admin
      .from("book_subcategories")
      .select("id")
      .eq("id", bookSubcategoryId)
      .maybeSingle();
    if (bookSubcategoryErr || !bookSubcategory) return { error: "That book type does not exist." };
    normalizedBookSubcategoryId = bookSubcategory.id;
  } else if (bookSubcategoryId) {
    return { error: "Book type can only be set for Books." };
  }

  const { data: existing, error: existingErr } = await admin
    .from("products")
    .select("image_url")
    .eq("id", id)
    .maybeSingle();
  if (existingErr || !existing) return { error: "That product could not be found." };

  let imageUrl: string | null = existing.image_url;
  const imageFile = getFormImageFile(formData);
  if (imageFile) {
    const uploaded = await uploadProductImage(admin, imageFile, slug);
    if (!uploaded.ok) return { error: uploaded.error };
    const previousUrl = existing.image_url;
    imageUrl = uploaded.publicUrl;
    const cfg = getSupabaseServiceRoleConfig();
    if (cfg && previousUrl && previousUrl !== imageUrl) {
      await tryRemoveReplacedProductImage(admin, cfg.url, previousUrl);
    }
  }

  const { error: updateError } = await admin
    .from("products")
    .update({
      name,
      slug,
      category_id: categoryId,
      book_subcategory_id: normalizedBookSubcategoryId,
      price,
      image_url: imageUrl,
      description,
      grade,
      is_featured: isFeatured,
    })
    .eq("id", id);

  if (updateError) {
    if (updateError.code === "23505") return { error: "A product with that slug already exists." };
    console.error("[updateProductAction]", updateError.message);
    return { error: "Could not update product." };
  }

  revalidatePath("/dashboard/products");
  revalidatePath("/products");
  revalidatePath(`/products/${slug}`);
  revalidatePath("/");
  return { error: null, success: true };
}

export async function deleteProductAction(formData: FormData): Promise<void> {
  const allowed = await guardDashboardVoidMutation();
  if (!allowed) return;
  const admin = createServiceRoleClient();
  if (!admin) {
    redirect("/dashboard/products?error=delete");
  }

  const id = parseRequiredString(formData, "id");
  const slugHint = parseOptionalString(formData, "slug_hint");
  if (!id || !UUID_RE.test(id)) return;

  const { error: deleteError } = await admin.from("products").delete().eq("id", id);
  if (deleteError) {
    console.error("[deleteProductAction]", deleteError.message);
    redirect("/dashboard/products?error=delete");
  }

  revalidatePath("/dashboard/products");
  revalidatePath("/products");
  if (slugHint) revalidatePath(`/products/${slugHint}`);
  revalidatePath("/");
  redirect("/dashboard/products");
}
