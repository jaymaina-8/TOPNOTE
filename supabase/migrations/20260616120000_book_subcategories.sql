-- Add book subcategories and enforce book-only validation.

create table if not exists public.book_subcategories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_book_subcategories_slug on public.book_subcategories (slug);

insert into public.book_subcategories (name, slug)
values
  ('Workbooks', 'workbooks'),
  ('Assessment Books', 'assessment-books')
on conflict (slug) do nothing;

alter table public.products
  add column if not exists book_subcategory_id uuid;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'products_book_subcategory_id_fkey'
  ) then
    alter table public.products
      add constraint products_book_subcategory_id_fkey
      foreign key (book_subcategory_id) references public.book_subcategories (id) on delete set null;
  end if;
end $$;

create index if not exists idx_products_book_subcategory_id on public.products (book_subcategory_id)
  where book_subcategory_id is not null;

update public.products p
set book_subcategory_id = bs.id
from public.categories c
cross join public.book_subcategories bs
where p.category_id = c.id
  and c.type = 'books'
  and bs.slug = 'workbooks'
  and p.book_subcategory_id is null;

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

alter table public.book_subcategories enable row level security;

drop policy if exists "book_subcategories_select_public" on public.book_subcategories;
create policy "book_subcategories_select_public" on public.book_subcategories
  for select using (true);