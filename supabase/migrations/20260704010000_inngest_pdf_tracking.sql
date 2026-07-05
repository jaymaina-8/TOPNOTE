-- Migration to add PDF generation tracking columns to public.exam_orders
alter table public.exam_orders add column if not exists pdf_generation_failed boolean not null default false;
alter table public.exam_orders add column if not exists pdf_generation_error text;
alter table public.exam_orders add column if not exists pdf_generation_attempts integer not null default 0;
alter table public.exam_orders add column if not exists last_pdf_attempt_at timestamptz;
alter table public.exam_orders add column if not exists pdf_generated_at timestamptz;
