-- Add download_token and download_token_created_at to public.exam_orders
ALTER TABLE public.exam_orders
  ADD COLUMN IF NOT EXISTS download_token uuid UNIQUE DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS download_token_created_at timestamptz DEFAULT now();

-- Migrate existing rows to make sure they all have a download token
UPDATE public.exam_orders
  SET download_token = gen_random_uuid()
  WHERE download_token IS NULL;
