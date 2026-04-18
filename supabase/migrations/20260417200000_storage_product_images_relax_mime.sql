-- If you already applied the earlier migration with a strict allowed_mime_types array,
-- Storage may reject uploads (e.g. image/jpg vs image/jpeg). Clear the allowlist; the app still validates MIME + size.
UPDATE storage.buckets
SET allowed_mime_types = NULL
WHERE id = 'product-images';
