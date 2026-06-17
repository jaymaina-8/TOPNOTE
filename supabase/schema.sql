-- TOP NOTE PUBLISHERS — core schema (idempotent)
-- Safe to re-run: skips existing tables/indexes/policies.
-- New installs: creates everything. Existing DBs missing columns: run migrations in /supabase/migrations/.
-- After success, run seed.sql (uses ON CONFLICT where applicable).

-- -----------------------------------------------------------------------------
-- Tables
-- -----------------------------------------------------------------------------

create table if not exists public.book_subcategories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_book_subcategories_slug on public.book_subcategories (slug);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  type text not null,
  created_at timestamptz not null default now(),
  constraint categories_type_check check (type in ('books', 'exams', 'stationery', 'lab'))
);

create index if not exists idx_categories_slug on public.categories (slug);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  category_id uuid not null references public.categories (id) on delete cascade,
  book_subcategory_id uuid references public.book_subcategories (id) on delete set null,
  price numeric(12, 2) not null,
  image_url text,
  description text,
  grade text,
  is_featured boolean not null default false,
  created_at timestamptz not null default now(),
  constraint products_price_non_negative check (price >= 0)
);

alter table public.products
  add column if not exists book_subcategory_id uuid references public.book_subcategories (id) on delete set null;

create index if not exists idx_products_slug on public.products (slug);
create index if not exists idx_products_category_id on public.products (category_id);
create index if not exists idx_products_book_subcategory_id on public.products (book_subcategory_id)
  where book_subcategory_id is not null;
create index if not exists idx_products_is_featured on public.products (is_featured);

create table if not exists public.testimonials (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role text,
  content text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.inquiries (
  id uuid primary key default gen_random_uuid(),
  name text,
  phone text,
  message text not null,
  source_product_id uuid references public.products (id) on delete set null,
  status text not null default 'new',
  source_page text,
  source_type text,
  created_at timestamptz not null default now(),
  constraint inquiries_message_non_empty check (char_length(trim(message)) > 0),
  constraint inquiries_status_check check (status in ('new', 'contacted', 'closed')),
  constraint inquiries_source_type_check check (
    source_type is null or source_type in ('product', 'contact', 'general')
  )
);

create index if not exists idx_inquiries_source_product_id on public.inquiries (source_product_id);
create index if not exists idx_inquiries_status on public.inquiries (status);
create index if not exists idx_inquiries_created_at on public.inquiries (created_at desc);

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

-- -----------------------------------------------------------------------------
-- Row Level Security (anon key is public; service_role bypasses RLS)
-- -----------------------------------------------------------------------------

alter table public.categories enable row level security;
alter table public.book_subcategories enable row level security;
alter table public.products enable row level security;
alter table public.testimonials enable row level security;
alter table public.inquiries enable row level security;
alter table public.conversion_events enable row level security;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.validate_product_book_subcategory()
returns trigger
language plpgsql
as $$
declare
  category_type text;
begin
  select c.type into category_type
  from public.categories c
  where c.id = new.category_id;

  if category_type = 'books' then
    if new.book_subcategory_id is null then
      raise exception 'Book type is required for Books.';
    end if;

    if not exists (
      select 1
      from public.book_subcategories bs
      where bs.id = new.book_subcategory_id
    ) then
      raise exception 'Invalid book type.';
    end if;
  elsif new.book_subcategory_id is not null then
    raise exception 'Book type can only be set for Books.';
  end if;

  return new;
end;
$$;

drop trigger if exists set_book_subcategories_updated_at on public.book_subcategories;
create trigger set_book_subcategories_updated_at
before update on public.book_subcategories
for each row execute function public.set_updated_at();

drop trigger if exists validate_products_book_subcategory on public.products;
create trigger validate_products_book_subcategory
before insert or update on public.products
for each row execute function public.validate_product_book_subcategory();

-- Catalog & social proof: public read
drop policy if exists "book_subcategories_select_public" on public.book_subcategories;
create policy "book_subcategories_select_public" on public.book_subcategories
  for select using (true);

drop policy if exists "categories_select_public" on public.categories;
create policy "categories_select_public" on public.categories
  for select using (true);

drop policy if exists "products_select_public" on public.products;
create policy "products_select_public" on public.products
  for select using (true);

drop policy if exists "testimonials_select_public" on public.testimonials;
create policy "testimonials_select_public" on public.testimonials
  for select using (true);

-- Inquiries: no public reads; inserts via anon server client (RLS allows insert)
drop policy if exists "inquiries_insert_public" on public.inquiries;
create policy "inquiries_insert_public" on public.inquiries
  for insert with check (true);
