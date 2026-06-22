import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { CatalogWithFilters } from "@/components/catalog/CatalogWithFilters";
import { Container } from "@/components/ui/Container";
import { PageIntro } from "@/components/ui/PageIntro";
import { Section } from "@/components/ui/Section";
import { parseBookType } from "@/lib/book-types";
import type { CategoryType } from "@/lib/supabase/types";
import { ALL_CATALOG_CATEGORY_TYPES, getAllProducts, getBookSubcategories, getCategoriesByTypes } from "@/lib/queries";

export const dynamic = "force-dynamic";

function categoryFromSearchParam(value: string | undefined): CategoryType | "all" {
  if (!value) return "all";
  const s = value.toLowerCase();
  if (s === "books" || s === "exams" || s === "stationery" || s === "lab") return s;
  return "all";
}

export const metadata: Metadata = {
  title: "Products",
  description:
    "Shop Top Note Workbooks, Assessment Books, Exams, Lab Equipment, and Stationery for schools, teachers, parents, and learners across Kenya.",
};

type PageProps = {
  searchParams: Promise<{ category?: string; bookType?: string }>;
};

export default async function ProductsPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  if (sp.category?.toLowerCase() === "exams") {
    redirect("/exams");
  }
  const initialCategoryType = categoryFromSearchParam(sp.category);
  const [products, categories, bookSubcategories] = await Promise.all([
    getAllProducts(),
    getCategoriesByTypes([...ALL_CATALOG_CATEGORY_TYPES]),
    getBookSubcategories(),
  ]);
  const initialBookType = parseBookType(sp.bookType, bookSubcategories.map((subcategory) => subcategory.slug));

  return (
    <>
      <Section surface="muted" className="pb-10 md:pb-12">
        <Container>
          <PageIntro
            title="Products"
            description="Educational materials for parents and schools — message us on WhatsApp to confirm availability and delivery."
          />
        </Container>
      </Section>

      <Section surface="canvas" className="pt-2 pb-12 md:pt-4 md:pb-16">
        <Container>
          {products.length === 0 ? (
            <p className="mx-auto max-w-lg rounded-2xl bg-neutral-50/90 px-6 py-12 text-center text-sm leading-relaxed text-neutral-700 shadow-[var(--shadow-sm)]">
              No products available right now.
            </p>
          ) : (
            <CatalogWithFilters
              products={products}
              categories={categories}
              bookSubcategories={bookSubcategories}
              sourcePage="/products"
              variant="product"
              initialCategoryType={initialCategoryType}
              initialBookType={initialBookType}
              className="mt-0"
            />
          )}
        </Container>
      </Section>
    </>
  );
}
