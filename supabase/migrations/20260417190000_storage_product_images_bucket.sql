-- Public Storage bucket for dashboard product image uploads (see lib/storage/product-images.ts).
-- Apply with: `supabase db push` / `supabase migration up`, or run in Supabase SQL Editor.
--
-- Bucket name matches DEFAULT_PRODUCT_IMAGES_BUCKET / SUPABASE_STORAGE_PRODUCT_IMAGES_BUCKET.

-- allowed_mime_types NULL = no extra Storage-level MIME filter (app validates). Strict arrays often break real uploads (e.g. image/jpg vs image/jpeg).
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  5242880, -- 5 MiB (aligned with app validation)
  NULL
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Anonymous/public read so storefront and next/image can load objects via public URLs.
DROP POLICY IF EXISTS "product_images_select_public" ON storage.objects;

CREATE POLICY "product_images_select_public"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'product-images');

-- Uploads from the Next.js app use the service role on the server (bypasses RLS).
-- No INSERT policy for anon/authenticated clients unless you add client-side uploads later.
