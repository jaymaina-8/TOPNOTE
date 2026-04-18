import type { Metadata } from "next";
import Link from "next/link";

import { CatalogWithFilters } from "@/components/catalog/CatalogWithFilters";
import { Container } from "@/components/ui/Container";
import { PageIntro } from "@/components/ui/PageIntro";
import { Section } from "@/components/ui/Section";
import { getCategoriesByTypes, getParentProducts, PARENT_CATEGORY_TYPES } from "@/lib/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "For Parents | TOPNOTE PUBLISHERS",
  description:
    "Browse books and stationery for home learning — retail pricing from TOPNOTE PUBLISHERS. Message us on WhatsApp for availability.",
};

export default async function ForParentsPage() {
  const [products, categories] = await Promise.all([
    getParentProducts(),
    getCategoriesByTypes([...PARENT_CATEGORY_TYPES]),
  ]);

  return (
    <>
      <Section surface="muted" className="pb-10 md:pb-12">
        <Container>
          <PageIntro
            eyebrow="For families"
            title="For parents & families"
            subtitle="Books & stationery"
            description="Shop revision books and stationery for your child at home. Prices shown are retail / cover prices — message us on WhatsApp to confirm stock and delivery."
          />
        </Container>
      </Section>

      <Section surface="canvas" className="pt-2 pb-12 md:pt-4 md:pb-16">
        <Container>
          <div className="flex flex-col gap-2 pb-6 md:flex-row md:items-end md:justify-between md:gap-6">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-neutral-900 md:text-2xl">Parent catalog</h2>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-neutral-600 md:text-base">
                Individual titles and supplies — books and stationery only on this page.
              </p>
            </div>
          </div>

          {products.length === 0 ? (
            <p className="mx-auto mt-10 max-w-lg rounded-2xl bg-neutral-50/90 px-6 py-12 text-center text-sm leading-relaxed text-neutral-700 shadow-[var(--shadow-sm)]">
              No products in this category yet. Browse the full{" "}
              <Link href="/products" className="font-semibold text-primary underline underline-offset-2">
                products
              </Link>{" "}
              page or contact us on WhatsApp.
            </p>
          ) : (
            <CatalogWithFilters
              products={products}
              categories={categories}
              sourcePage="/for-parents"
              variant="parent"
              className="mt-0"
            />
          )}
        </Container>
      </Section>
    </>
  );
}
