-- Exam ordering system: sessions, per-class pricing, and submitted orders.

create table if not exists public.exam_sessions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  status text not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint exam_sessions_status_check check (status in ('draft', 'active', 'archived'))
);

create index if not exists idx_exam_sessions_status on public.exam_sessions (status);
create index if not exists idx_exam_sessions_created_at on public.exam_sessions (created_at desc);

create table if not exists public.exam_session_prices (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.exam_sessions (id) on delete cascade,
  class_key text not null,
  price numeric(12, 2) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint exam_session_prices_class_key_check check (
    class_key in (
      'playgroup',
      'pp1',
      'pp2',
      'grade_1',
      'grade_2',
      'grade_3',
      'grade_4',
      'grade_5',
      'grade_6',
      'grade_7',
      'grade_8',
      'grade_9'
    )
  ),
  constraint exam_session_prices_price_non_negative check (price >= 0),
  constraint exam_session_prices_session_class_unique unique (session_id, class_key)
);

create index if not exists idx_exam_session_prices_session_id on public.exam_session_prices (session_id);

create table if not exists public.exam_order_counters (
  year integer primary key,
  last_number integer not null default 0
);

create table if not exists public.exam_orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  session_id uuid not null references public.exam_sessions (id) on delete restrict,
  school_name text not null,
  contact_person text not null,
  phone text not null,
  county text not null,
  delivery_location text not null,
  additional_notes text,
  items jsonb not null,
  total_papers integer not null default 0,
  total_amount numeric(12, 2) not null default 0,
  status text not null default 'pending',
  pdf_storage_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint exam_orders_total_papers_non_negative check (total_papers >= 0),
  constraint exam_orders_total_amount_non_negative check (total_amount >= 0),
  constraint exam_orders_status_check check (
    status in ('pending', 'contacted', 'confirmed', 'processing', 'delivered', 'cancelled')
  )
);

create index if not exists idx_exam_orders_session_id on public.exam_orders (session_id);
create index if not exists idx_exam_orders_status on public.exam_orders (status);
create index if not exists idx_exam_orders_created_at on public.exam_orders (created_at desc);
create index if not exists idx_exam_orders_order_number on public.exam_orders (order_number);

-- Only one active session at a time.
create or replace function public.enforce_single_active_exam_session()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'active' then
    update public.exam_sessions
    set status = 'archived', updated_at = now()
    where id <> new.id
      and status = 'active';
  end if;
  return new;
end;
$$;

drop trigger if exists enforce_single_active_exam_session on public.exam_sessions;
create trigger enforce_single_active_exam_session
before insert or update of status on public.exam_sessions
for each row
when (new.status = 'active')
execute function public.enforce_single_active_exam_session();

create or replace function public.set_exam_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_exam_sessions_updated_at on public.exam_sessions;
create trigger set_exam_sessions_updated_at
before update on public.exam_sessions
for each row execute function public.set_exam_updated_at();

drop trigger if exists set_exam_session_prices_updated_at on public.exam_session_prices;
create trigger set_exam_session_prices_updated_at
before update on public.exam_session_prices
for each row execute function public.set_exam_updated_at();

drop trigger if exists set_exam_orders_updated_at on public.exam_orders;
create trigger set_exam_orders_updated_at
before update on public.exam_orders
for each row execute function public.set_exam_updated_at();

create or replace function public.generate_exam_order_number()
returns text
language plpgsql
as $$
declare
  current_year integer := extract(year from now())::integer;
  next_number integer;
begin
  insert into public.exam_order_counters as c (year, last_number)
  values (current_year, 1)
  on conflict (year) do update
    set last_number = c.last_number + 1
  returning last_number into next_number;

  return 'TN-EX-' || current_year::text || '-' || lpad(next_number::text, 4, '0');
end;
$$;

-- Row Level Security
alter table public.exam_sessions enable row level security;
alter table public.exam_session_prices enable row level security;
alter table public.exam_orders enable row level security;
alter table public.exam_order_counters enable row level security;

drop policy if exists "exam_sessions_select_public" on public.exam_sessions;
create policy "exam_sessions_select_public" on public.exam_sessions
  for select using (status = 'active');

drop policy if exists "exam_session_prices_select_public" on public.exam_session_prices;
create policy "exam_session_prices_select_public" on public.exam_session_prices
  for select using (
    exists (
      select 1
      from public.exam_sessions s
      where s.id = session_id
        and s.status = 'active'
    )
  );

drop policy if exists "exam_orders_insert_public" on public.exam_orders;
create policy "exam_orders_insert_public" on public.exam_orders
  for insert with check (true);

-- Storage bucket for generated order PDFs
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'exam-order-pdfs',
  'exam-order-pdfs',
  false,
  5242880,
  array['application/pdf']::text[]
)
on conflict (id) do nothing;

drop policy if exists "exam_order_pdfs_public_read" on storage.objects;
create policy "exam_order_pdfs_public_read" on storage.objects
  for select using (bucket_id = 'exam-order-pdfs');

drop policy if exists "exam_order_pdfs_service_insert" on storage.objects;
create policy "exam_order_pdfs_service_insert" on storage.objects
  for insert with check (bucket_id = 'exam-order-pdfs');

drop policy if exists "exam_order_pdfs_service_update" on storage.objects;
create policy "exam_order_pdfs_service_update" on storage.objects
  for update using (bucket_id = 'exam-order-pdfs');

drop policy if exists "exam_order_pdfs_service_delete" on storage.objects;
create policy "exam_order_pdfs_service_delete" on storage.objects
  for delete using (bucket_id = 'exam-order-pdfs');
