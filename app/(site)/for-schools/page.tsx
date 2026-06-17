import type { Metadata } from "next";
import Link from "next/link";

import { CatalogWithFilters } from "@/components/catalog/CatalogWithFilters";
import { Container } from "@/components/ui/Container";
import { PageIntro } from "@/components/ui/PageIntro";
import { Section } from "@/components/ui/Section";
import { parseBookType } from "@/lib/book-types";
import { SCHOOL_BULK_DISCOUNT_PERCENT } from "@/lib/pricing";
import { ALL_CATALOG_CATEGORY_TYPES, getBookSubcategories, getCategoriesByTypes, getSchoolProducts } from "@/lib/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "For Schools | TOPNOTE PUBLISHERS",
  description:
    "Bulk school supply for books, stationery, lab equipment, and exams — school pricing with bulk discount from TOPNOTE PUBLISHERS.",
};

type PageProps = {
  searchParams: Promise<{ bookType?: string }>;
};

export default async function ForSchoolsPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const [products, categories, bookSubcategories] = await Promise.all([
    getSchoolProducts(),
    getCategoriesByTypes([...ALL_CATALOG_CATEGORY_TYPES]),
    getBookSubcategories(),
  ]);
  const initialBookType = parseBookType(sp.bookType, bookSubcategories.map((subcategory) => subcategory.slug));

  return (
    <>
      <Section surface="muted" className="pb-10 md:pb-12">
        <Container>
          <PageIntro
            eyebrow="Institutions"
            title="For schools & bulk supply"
            subtitle="Books, stationery, lab equipment & exams"
            description="Reliable catalog pricing for classrooms and labs. Listed rates are shown for reference; your school rate includes our bulk discount — reach out on WhatsApp for quotes, supply volumes, and delivery."
          />
        </Container>
      </Section>

      <Section surface="canvas" className="py-8 md:py-10">
        <Container>
          <div className="rounded-2xl bg-white p-6 shadow-[var(--shadow-sm)] md:p-8">
            <h2 className="text-lg font-bold tracking-tight text-neutral-900 md:text-xl">School pricing benefits</h2>
            <ul className="mt-4 grid gap-3 text-sm leading-relaxed text-neutral-700 sm:grid-cols-3 sm:gap-4">
              <li className="flex gap-2 rounded-xl bg-surface-muted px-3 py-3 shadow-[var(--shadow-sm)]">
                <span className="mt-0.5 font-semibold text-neutral-700" aria-hidden>
                  ✓
                </span>
                <span>
                  <span className="font-semibold text-positive">{SCHOOL_BULK_DISCOUNT_PERCENT}% bulk discount</span> on listed prices
                </span>
              </li>
              <li className="flex gap-2 rounded-xl bg-surface-muted px-3 py-3 shadow-[var(--shadow-sm)]">
                <span className="mt-0.5 font-semibold text-neutral-700" aria-hidden>
                  ✓
                </span>
                <span>Nationwide delivery</span>
              </li>
              <li className="flex gap-2 rounded-xl bg-surface-muted px-3 py-3 shadow-[var(--shadow-sm)] sm:col-span-1">
                <span className="mt-0.5 font-semibold text-neutral-700" aria-hidden>
                  ✓
                </span>
                <span>Fast WhatsApp response for orders and questions</span>
              </li>
            </ul>
          </div>
        </Container>
      </Section>

      <Section surface="muted" className="pt-2 pb-12 md:pt-4 md:pb-16">
        <Container>
          <div className="flex flex-col gap-2 pb-6 md:flex-row md:items-end md:justify-between md:gap-6">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-neutral-900 md:text-2xl">School catalog</h2>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-neutral-600 md:text-base">
                Each item shows your school unit price after the bulk discount, with the list price for comparison.
              </p>
            </div>
          </div>

          {products.length === 0 ? (
            <p className="mx-auto mt-10 max-w-lg rounded-2xl bg-neutral-50/90 px-6 py-12 text-center text-sm leading-relaxed text-neutral-700 shadow-[var(--shadow-sm)]">
              No products in this catalog yet. See the full{" "}
              <Link href="/products" className="font-semibold text-primary underline underline-offset-2">
                products
              </Link>{" "}
              listing or reach out on WhatsApp for school supply.
            </p>
          ) : (
            <CatalogWithFilters
              products={products}
              categories={categories}
              bookSubcategories={bookSubcategories}
              sourcePage="/for-schools"
              variant="school"
              initialBookType={initialBookType}
              className="mt-0"
            >
              <div className="max-w-2xl rounded-2xl bg-white px-4 py-3.5 text-sm leading-relaxed text-neutral-700 shadow-[var(--shadow-sm)]">
                Schools get{" "}
                <span className="font-semibold text-positive">{SCHOOL_BULK_DISCOUNT_PERCENT}% off</span> listed prices for bulk orders. Message us
                on WhatsApp for full supply and delivery details.
              </div>
            </CatalogWithFilters>
          )}
        </Container>
      </Section>
    </>
  );
}
