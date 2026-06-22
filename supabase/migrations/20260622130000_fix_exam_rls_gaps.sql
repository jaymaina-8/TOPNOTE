-- Security Fixes for Exam Ordering System RLS Gaps

-- 1. Storage Security: Restrict PDF access
-- The existing policy allows public users to read ANY order PDF if they guess the path.
-- The application uses signed URLs or the service role for legitimate access.
DROP POLICY IF EXISTS "exam_order_pdfs_public_read" ON storage.objects;

-- Allow authenticated dashboard administrators to manage all PDFs in the bucket
-- This ensures the dashboard can interact with the bucket via the client SDK if needed.
CREATE POLICY "exam_order_pdfs_admin_manage" ON storage.objects
  FOR ALL
  TO authenticated
  USING (bucket_id = 'exam-order-pdfs')
  WITH CHECK (bucket_id = 'exam-order-pdfs');

-- 2. Administrator Access: Table-level RLS
-- Currently, administrators mostly rely on the service role key which bypasses RLS.
-- Adding explicit policies for the 'authenticated' role ensures defense-in-depth.
-- Note: These policies assume that the application handles specific admin allowlisting (e.g., via emails).

-- Exam Sessions: Full management for admins
DROP POLICY IF EXISTS "exam_sessions_admin_all" ON public.exam_sessions;
CREATE POLICY "exam_sessions_admin_all" ON public.exam_sessions
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Exam Session Prices: Full management for admins
DROP POLICY IF EXISTS "exam_session_prices_admin_all" ON public.exam_session_prices;
CREATE POLICY "exam_session_prices_admin_all" ON public.exam_session_prices
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Exam Orders: Full management for admins
DROP POLICY IF EXISTS "exam_orders_admin_all" ON public.exam_orders;
CREATE POLICY "exam_orders_admin_all" ON public.exam_orders
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Exam Order Counters: Allow admins to view current sequence status
DROP POLICY IF EXISTS "exam_order_counters_admin_select" ON public.exam_order_counters;
CREATE POLICY "exam_order_counters_admin_select" ON public.exam_order_counters
  FOR SELECT
  TO authenticated
  USING (true);

-- 3. Cleanup: Tighten existing Storage 'service' policies
-- The initial migration added policies without role restrictions. 
-- We restrict them to 'authenticated' as a baseline for security.

DROP POLICY IF EXISTS "exam_order_pdfs_service_insert" ON storage.objects;
CREATE POLICY "exam_order_pdfs_service_insert" ON storage.objects
  FOR INSERT 
  TO authenticated
  WITH CHECK (bucket_id = 'exam-order-pdfs');

DROP POLICY IF EXISTS "exam_order_pdfs_service_update" ON storage.objects;
CREATE POLICY "exam_order_pdfs_service_update" ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'exam-order-pdfs');

DROP POLICY IF EXISTS "exam_order_pdfs_service_delete" ON storage.objects;
CREATE POLICY "exam_order_pdfs_service_delete" ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'exam-order-pdfs');
