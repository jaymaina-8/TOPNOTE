-- Security Fixes for Exam Ordering System RLS Gaps

-- 1. Storage Security: Restrict PDF access
-- The existing policy allows public users to read ANY order PDF if they guess the path.
-- The application uses signed URLs or the service role for legitimate access.
DROP POLICY IF EXISTS "exam_order_pdfs_public_read" ON storage.objects;

-- Do not grant broad authenticated access to private order PDFs.
DROP POLICY IF EXISTS "exam_order_pdfs_admin_manage" ON storage.objects;

-- 2. Administrator Access: Table-level RLS
-- Currently, administrators mostly rely on the service role key which bypasses RLS.
-- Adding explicit policies for the 'authenticated' role ensures defense-in-depth.
-- Note: These policies assume that the application handles specific admin allowlisting (e.g., via emails).

-- Exam Sessions: keep public read policy from base migration only
DROP POLICY IF EXISTS "exam_sessions_admin_all" ON public.exam_sessions;

-- Exam Session Prices: keep public read policy from base migration only
DROP POLICY IF EXISTS "exam_session_prices_admin_all" ON public.exam_session_prices;

-- Exam Orders: never allow direct authenticated-role access to all rows.
DROP POLICY IF EXISTS "exam_orders_admin_all" ON public.exam_orders;

-- Keep the public insert-only behavior for submitting orders.
DROP POLICY IF EXISTS "exam_orders_insert_public" ON public.exam_orders;
CREATE POLICY "exam_orders_insert_public" ON public.exam_orders
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Exam Order Counters: no broad authenticated access.
DROP POLICY IF EXISTS "exam_order_counters_admin_select" ON public.exam_order_counters;

-- 3. Cleanup: remove bucket policies that granted authenticated-role access.

DROP POLICY IF EXISTS "exam_order_pdfs_service_insert" ON storage.objects;

DROP POLICY IF EXISTS "exam_order_pdfs_service_update" ON storage.objects;

DROP POLICY IF EXISTS "exam_order_pdfs_service_delete" ON storage.objects;
