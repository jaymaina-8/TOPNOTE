-- TOP NOTE PUBLISHERS — seed data
-- Run after schema.sql in Supabase SQL Editor.
-- Safe to re-run: uses ON CONFLICT (slug) DO NOTHING on categories and products.

insert into public.categories (name, slug, type)
values
  ('Books', 'books', 'books'),
  ('Exams', 'exams', 'exams'),
  ('Stationery', 'stationery', 'stationery'),
  ('Lab Equipment', 'lab-equipment', 'lab')
on conflict (slug) do nothing;

insert into public.products (name, slug, category_id, price, grade, is_featured, description, image_url)
select
  'Grade 4 Learner''s Revision Workbook',
  'grade-4-learners-revision-workbook',
  c.id,
  450.00,
  'Grade 4',
  true,
  'Structured revision activities aligned to the primary curriculum.',
  null
from public.categories c
where c.slug = 'books'
on conflict (slug) do nothing;

insert into public.products (name, slug, category_id, price, grade, is_featured, description, image_url)
select
  'Grade 6 Mathematics Workbook',
  'grade-6-mathematics-workbook',
  c.id,
  520.00,
  'Grade 6',
  true,
  'Practice and worked examples for middle-primary mathematics.',
  null
from public.categories c
where c.slug = 'books'
on conflict (slug) do nothing;

insert into public.products (name, slug, category_id, price, is_featured, description, image_url)
select
  'School Exam Pack',
  'school-exam-pack',
  c.id,
  890.00,
  true,
  'Curated past papers and marking guides for term assessments.',
  null
from public.categories c
where c.slug = 'exams'
on conflict (slug) do nothing;

insert into public.products (name, slug, category_id, price, is_featured, description, image_url)
select
  'Ballpoint Pen Set',
  'ballpoint-pen-set',
  c.id,
  180.00,
  false,
  '12-pack smooth-writing pens for everyday school use.',
  null
from public.categories c
where c.slug = 'stationery'
on conflict (slug) do nothing;

insert into public.products (name, slug, category_id, price, is_featured, description, image_url)
select
  'Basic Chemistry Lab Kit',
  'basic-chemistry-lab-kit',
  c.id,
  3200.00,
  true,
  'Starter glassware and safe consumables for introductory chemistry practicals.',
  null
from public.categories c
where c.slug = 'lab-equipment'
on conflict (slug) do nothing;

-- Re-running inserts duplicate rows unless you truncate testimonials first.
insert into public.testimonials (name, role, content)
values
  (
    'Royal Topmark Academy',
    'School Management',
    'Reliable delivery and consistent quality materials. Planning school supply each term is now simple and predictable.'
  ),
  (
    'Bright Sparks School',
    'Administration',
    'Affordable, syllabus-aligned materials that improve learning outcomes. We rely on TOPNOTE every term.'
  );
