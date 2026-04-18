-- Phase 5: inquiry attribution, status workflow, conversion_events
-- Safe to run on existing projects that already applied schema.sql.

-- -----------------------------------------------------------------------------
-- Inquiries: status + source attribution
-- -----------------------------------------------------------------------------

alter table public.inquiries
  add column if not exists status text not null default 'new',
  add column if not exists source_page text,
  add column if not exists source_type text;

-- Drop legacy constraint name if re-run in dev (Postgres has no IF NOT EXISTS for constraints)
do $$
begin
  if exists (
    select 1 from pg_constraint
    where conname = 'inquiries_status_check'
  ) then
    alter table public.inquiries drop constraint inquiries_status_check;
  end if;
end $$;

alter table public.inquiries
  add constraint inquiries_status_check check (status in ('new', 'contacted', 'closed'));

do $$
begin
  if exists (
    select 1 from pg_constraint
    where conname = 'inquiries_source_type_check'
  ) then
    alter table public.inquiries drop constraint inquiries_source_type_check;
  end if;
end $$;

alter table public.inquiries
  add constraint inquiries_source_type_check check (
    source_type is null or source_type in ('product', 'contact', 'general')
  );

create index if not exists idx_inquiries_status on public.inquiries (status);
create index if not exists idx_inquiries_created_at on public.inquiries (created_at desc);

-- -----------------------------------------------------------------------------
-- Conversion events (server-side inserts via service role; RLS blocks anon)
-- -----------------------------------------------------------------------------

create table if not exists public.conversion_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  source_page text,
  source_product_id uuid references public.products (id) on delete set null,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_conversion_events_event_type on public.conversion_events (event_type);
create index if not exists idx_conversion_events_created_at on public.conversion_events (created_at desc);
create index if not exists idx_conversion_events_source_product_id on public.conversion_events (source_product_id)
  where source_product_id is not null;

alter table public.conversion_events enable row level security;
