import type { Metadata } from "next";

import { CatalogWithFilters } from "@/components/catalog/CatalogWithFilters";
import { Container } from "@/components/ui/Container";
import { PageIntro } from "@/components/ui/PageIntro";
import { Section } from "@/components/ui/Section";
import type { CategoryType } from "@/lib/supabase/types";
import { ALL_CATALOG_CATEGORY_TYPES, getAllProducts, getCategoriesByTypes } from "@/lib/queries";

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
    "Browse books, exams, stationery, and lab equipment from TOPNOTE PUBLISHERS — transparent pricing and nationwide delivery.",
};

type PageProps = {
  searchParams: Promise<{ category?: string }>;
};

export default async function ProductsPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const initialCategoryType = categoryFromSearchParam(sp.category);

  const [products, categories] = await Promise.all([
    getAllProducts(),
    getCategoriesByTypes([...ALL_CATALOG_CATEGORY_TYPES]),
  ]);

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
              sourcePage="/products"
              variant="product"
              initialCategoryType={initialCategoryType}
              className="mt-0"
            />
          )}
        </Container>
      </Section>
    </>
  );
}
