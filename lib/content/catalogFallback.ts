import { sortCategoriesByDisplayOrder } from "@/lib/categories/display-order";
import type {
  BookSubcategoryRow,
  CategoryRow,
  CategoryType,
  ProductWithCategory,
} from "@/lib/supabase/types";

const createdAt = "2026-04-17T00:00:00.000Z";

export const fallbackBookSubcategories: BookSubcategoryRow[] = [
  {
    id: "20000000-0000-4000-8000-000000000001",
    name: "Workbooks",
    slug: "workbooks",
    created_at: createdAt,
    updated_at: createdAt,
  },
  {
    id: "20000000-0000-4000-8000-000000000002",
    name: "Assessment Books",
    slug: "assessment-books",
    created_at: createdAt,
    updated_at: createdAt,
  },
] as const;

const bookSubcategoryBySlug = Object.fromEntries(
  fallbackBookSubcategories.map((subcategory) => [subcategory.slug, subcategory]),
);

export const fallbackCategories: CategoryRow[] = [
  {
    id: "00000000-0000-4000-8000-000000000001",
    name: "Books",
    slug: "books",
    type: "books",
    created_at: createdAt,
  },
  {
    id: "00000000-0000-4000-8000-000000000002",
    name: "Exams",
    slug: "exams",
    type: "exams",
    created_at: createdAt,
  },
  {
    id: "00000000-0000-4000-8000-000000000003",
    name: "Stationery",
    slug: "stationery",
    type: "stationery",
    created_at: createdAt,
  },
  {
    id: "00000000-0000-4000-8000-000000000004",
    name: "Lab Equipment",
    slug: "lab-equipment",
    type: "lab",
    created_at: createdAt,
  },
];

const categoryBySlug = Object.fromEntries(fallbackCategories.map((category) => [category.slug, category]));

function product(
  id: string,
  categorySlug: keyof typeof categoryBySlug,
  row: Omit<
    ProductWithCategory,
    "id" | "category_id" | "categories" | "book_subcategory_id" | "bookSubcategory" | "created_at"
  > & {
    bookSubcategorySlug?: keyof typeof bookSubcategoryBySlug;
  },
): ProductWithCategory {
  const category = categoryBySlug[categorySlug];
  const bookSubcategory = row.bookSubcategorySlug ? bookSubcategoryBySlug[row.bookSubcategorySlug] : null;
  const { bookSubcategorySlug: _bookSubcategorySlug, ...productRow } = row;

  return {
    ...productRow,
    id,
    category_id: category.id,
    categories: category,
    book_subcategory_id: bookSubcategory?.id ?? null,
    bookSubcategory,
    created_at: createdAt,
  };
}

export const fallbackProducts: ProductWithCategory[] = [
  product("10000000-0000-4000-8000-000000000001", "books", {
    name: "Grade 4 Learner's Revision Workbook",
    slug: "grade-4-learners-revision-workbook",
    price: 450,
    grade: "Grade 4",
    is_featured: true,
    description: "Structured revision activities aligned to the primary curriculum.",
    image_url: null,
    bookSubcategorySlug: "workbooks",
  }),
  product("10000000-0000-4000-8000-000000000002", "books", {
    name: "Grade 6 Mathematics Workbook",
    slug: "grade-6-mathematics-workbook",
    price: 520,
    grade: "Grade 6",
    is_featured: true,
    description: "Practice and worked examples for middle-primary mathematics.",
    image_url: null,
    bookSubcategorySlug: "workbooks",
  }),
  product("10000000-0000-4000-8000-000000000003", "exams", {
    name: "School Exam Pack",
    slug: "school-exam-pack",
    price: 890,
    grade: null,
    is_featured: true,
    description: "Curated past papers and marking guides for term assessments.",
    image_url: null,
  }),
  product("10000000-0000-4000-8000-000000000004", "stationery", {
    name: "Ballpoint Pen Set",
    slug: "ballpoint-pen-set",
    price: 180,
    grade: null,
    is_featured: false,
    description: "12-pack smooth-writing pens for everyday school use.",
    image_url: null,
  }),
  product("10000000-0000-4000-8000-000000000005", "lab-equipment", {
    name: "Basic Chemistry Lab Kit",
    slug: "basic-chemistry-lab-kit",
    price: 3200,
    grade: null,
    is_featured: true,
    description: "Starter glassware and safe consumables for introductory chemistry practicals.",
    image_url: null,
  }),
];

export function getFallbackCategoriesByTypes(types: readonly CategoryType[]): CategoryRow[] {
  const allowed = new Set(types);
  return sortCategoriesByDisplayOrder(fallbackCategories.filter((category) => allowed.has(category.type)));
}

export function getFallbackProductsByCategoryTypes(types: readonly CategoryType[]): ProductWithCategory[] {
  const allowed = new Set(types);
  return fallbackProducts.filter((product) => {
    const type = product.categories?.type;
    return Boolean(type && allowed.has(type));
  });
}

