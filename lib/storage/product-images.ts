import "server-only";

import { randomUUID } from "node:crypto";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/types";

/**
 * Supabase Storage — product images
 *
 * Dashboard uploads run server-side with the service role (see `createServiceRoleClient`).
 * You still need a bucket and (for storefront URLs) public read access to objects.
 *
 * Setup (Supabase Dashboard → Storage):
 * 1. Create a bucket named `product-images` (or override via `SUPABASE_STORAGE_PRODUCT_IMAGES_BUCKET`).
 * 2. Mark the bucket **public** if you store public URLs in `products.image_url` (recommended for this app).
 *    Alternatively, use a private bucket + signed URLs — that would require app changes beyond `image_url` strings.
 * 3. Upload path prefix used by this code: `products/` (objects look like `products/<slug>-<timestamp>-<uuid>.<ext>`).
 *
 * No extra Storage RLS policies are required for server-side service-role uploads; the service role bypasses RLS.
 */

/** Default bucket; override with SUPABASE_STORAGE_PRODUCT_IMAGES_BUCKET for non-default names. */
export const DEFAULT_PRODUCT_IMAGES_BUCKET = "product-images";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MiB

const ALLOWED_IMAGE_TYPES: ReadonlySet<string> = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
]);

const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/webp": "webp",
};

/** Map browser quirks to canonical types we send to Storage (must match bucket rules if any). */
function normalizeImageMimeType(raw: string): string {
  const t = raw.toLowerCase().trim();
  if (t === "image/jpg" || t === "image/pjpeg") return "image/jpeg";
  return t;
}

export function getProductImagesBucket(): string {
  const fromEnv = process.env.SUPABASE_STORAGE_PRODUCT_IMAGES_BUCKET?.trim();
  return fromEnv?.length ? fromEnv : DEFAULT_PRODUCT_IMAGES_BUCKET;
}

function sanitizeSlugForPath(slug: string): string {
  return slug.replace(/[^a-z0-9-]/g, "").slice(0, 120) || "product";
}

/**
 * Returns a non-empty File when the user selected an image for field `image`, otherwise null.
 */
export function getFormImageFile(formData: FormData): File | null {
  const v = formData.get("image");
  if (!v || typeof v === "string") return null;
  if (v instanceof File && v.size > 0) return v;
  return null;
}

function validateImageFile(file: File): string | null {
  if (file.size > MAX_IMAGE_BYTES) {
    return "Image must be 5 MB or smaller.";
  }
  const type = normalizeImageMimeType(file.type);
  if (!ALLOWED_IMAGE_TYPES.has(type)) {
    return "Please upload a JPEG, PNG, GIF, or WebP image.";
  }
  const ext = MIME_TO_EXT[type];
  if (!ext) return "Please upload a JPEG, PNG, GIF, or WebP image.";
  return null;
}

export type UploadProductImageResult =
  | { ok: true; publicUrl: string }
  | { ok: false; error: string };

function friendlyStorageError(
  bucket: string,
  err: { message: string; status?: number; statusCode?: string },
): string {
  const message = err.message;
  const m = message.toLowerCase();
  console.error("[uploadProductImage]", bucket, err.status, err.statusCode, message);

  if (
    m.includes("bucket not found") ||
    (m.includes("not found") && m.includes("bucket")) ||
    m.includes("no such bucket")
  ) {
    return `Storage bucket "${bucket}" is missing. In Supabase → Storage, create a public bucket with that name (or set SUPABASE_STORAGE_PRODUCT_IMAGES_BUCKET to match your bucket).`;
  }
  if (
    m.includes("mime") ||
    m.includes("invalid type") ||
    m.includes("not allowed") ||
    m.includes("unsupported") ||
    err.statusCode === "InvalidMimeType"
  ) {
    return "This image type was rejected by Storage. Use JPEG, PNG, GIF, or WebP. If it still fails, in Supabase → Storage → product-images, remove MIME restrictions or run migration 20260417200000_storage_product_images_relax_mime.sql.";
  }
  if (m.includes("row-level security") || m.includes("rls") || m.includes("policy")) {
    return "Storage blocked the upload. For service-role uploads, confirm the bucket exists and Storage is enabled for your project.";
  }
  if (m.includes("payload too large") || m.includes("413") || m.includes("entity too large")) {
    return "Image must be 5 MB or smaller.";
  }
  return "Could not upload image. Try again or use a smaller file.";
}

/**
 * Uploads to `product-images/products/<slug>-<timestamp>-<uuid>.<ext>` (bucket configurable).
 */
export async function uploadProductImage(
  admin: SupabaseClient<Database>,
  file: File,
  productSlug: string,
): Promise<UploadProductImageResult> {
  const validationError = validateImageFile(file);
  if (validationError) return { ok: false, error: validationError };

  const bucket = getProductImagesBucket();
  const safeSlug = sanitizeSlugForPath(productSlug);
  const normalizedMime = normalizeImageMimeType(file.type);
  const ext = MIME_TO_EXT[normalizedMime] ?? "jpg";
  const objectPath = `products/${safeSlug}-${Date.now()}-${randomUUID()}.${ext}`;

  // Use a Buffer in Node server actions — passing `File` to the Storage API can fail in some runtimes.
  const body = Buffer.from(await file.arrayBuffer());
  const contentType = normalizedMime || "application/octet-stream";

  const { error: uploadError } = await admin.storage.from(bucket).upload(objectPath, body, {
    contentType,
    upsert: false,
  });

  if (uploadError) {
    return {
      ok: false,
      error: friendlyStorageError(bucket, {
        message: uploadError.message,
        status: uploadError.status,
        statusCode: uploadError.statusCode,
      }),
    };
  }

  const { data } = admin.storage.from(bucket).getPublicUrl(objectPath);
  const publicUrl = data.publicUrl;
  if (!publicUrl?.length) {
    return { ok: false, error: "Could not resolve image URL after upload." };
  }

  return { ok: true, publicUrl };
}

/**
 * Best-effort removal when replacing an image. Only deletes objects in our bucket under `products/`
 * whose public URL matches the configured project URL.
 */
export async function tryRemoveReplacedProductImage(
  admin: SupabaseClient<Database>,
  supabaseProjectUrl: string,
  previousPublicUrl: string | null,
): Promise<void> {
  if (!previousPublicUrl?.length) return;

  const bucket = getProductImagesBucket();
  const objectPath = parseOwnedProductObjectPath(supabaseProjectUrl, bucket, previousPublicUrl);
  if (!objectPath) return;

  const { error } = await admin.storage.from(bucket).remove([objectPath]);
  if (error) {
    console.warn("[tryRemoveReplacedProductImage]", error.message);
  }
}

function parseOwnedProductObjectPath(
  supabaseProjectUrl: string,
  bucket: string,
  publicUrl: string,
): string | null {
  try {
    const base = new URL(supabaseProjectUrl.replace(/\/$/, ""));
    const target = new URL(publicUrl);
    if (target.origin !== base.origin) return null;

    const prefix = `/storage/v1/object/public/${bucket}/`;
    if (!target.pathname.startsWith(prefix)) return null;

    const encoded = target.pathname.slice(prefix.length);
    const objectPath = decodeURIComponent(encoded);
    if (!objectPath.startsWith("products/") || objectPath.includes("..")) return null;
    return objectPath;
  } catch {
    return null;
  }
}
