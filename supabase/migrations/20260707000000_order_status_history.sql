-- Migration: Create Order Status History
CREATE TABLE IF NOT EXISTS public.exam_order_status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.exam_orders(id) ON DELETE CASCADE,
  previous_status text,
  new_status text NOT NULL,
  changed_at timestamptz NOT NULL DEFAULT now(),
  changed_by text
);

CREATE INDEX IF NOT EXISTS idx_exam_order_status_history_order_id ON public.exam_order_status_history(order_id);
CREATE INDEX IF NOT EXISTS idx_exam_order_status_history_changed_at ON public.exam_order_status_history(changed_at ASC);

-- Enable RLS
ALTER TABLE public.exam_order_status_history ENABLE ROW LEVEL SECURITY;

-- Select policy
DROP POLICY IF EXISTS "exam_order_status_history_select_authenticated" ON public.exam_order_status_history;
CREATE POLICY "exam_order_status_history_select_authenticated" ON public.exam_order_status_history
  FOR SELECT TO authenticated USING (true);

-- Insert policy
DROP POLICY IF EXISTS "exam_order_status_history_insert_authenticated" ON public.exam_order_status_history;
CREATE POLICY "exam_order_status_history_insert_authenticated" ON public.exam_order_status_history
  FOR INSERT TO authenticated WITH CHECK (true);
