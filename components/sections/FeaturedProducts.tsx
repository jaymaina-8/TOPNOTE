import Link from "next/link";
import { homeFeaturedProductGridClass } from "@/components/products/productCardClasses";
import { ProductCard } from "@/components/products/ProductCard";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { cn } from "@/lib/utils";
import type { ProductWithCategory } from "@/lib/supabase/types";

export type FeaturedProductsProps = {
  products: ProductWithCategory[];
};

export function FeaturedProducts({ products }: FeaturedProductsProps) {
  return (
    <Section className="bg-white py-14 md:py-16 lg:py-20">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">In demand this term</p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-neutral-950 md:text-3xl">Featured products</h2>
          <p className="mt-2 text-sm leading-relaxed text-neutral-600 md:text-[0.9375rem]">
            Popular picks available now. Message us on WhatsApp to check stock and order instantly.
          </p>
        </div>

        {products.length === 0 ? (
          <div className="mx-auto mt-10 max-w-lg rounded-2xl border border-primary/10 bg-white p-8 text-center shadow-[var(--shadow-md)]">
            <p className="text-neutral-700">No featured products right now.</p>
            <p className="mt-2 text-sm text-neutral-600">Browse our full catalog for books, exams, stationery and lab equipment.</p>
            <Button href="/products" variant="primary" className="mt-6">
              View all products
            </Button>
          </div>
        ) : (
          <ul className={cn("mt-11 sm:mt-12", homeFeaturedProductGridClass)}>
            {products.map((product, index) => (
              <li key={product.id} className={index >= 4 ? "max-sm:hidden" : undefined}>
                <ProductCard product={product} sourcePage="/" density="compact" />
              </li>
            ))}
          </ul>
        )}

        {products.length > 0 ? (
          <p className="mt-10 text-center text-sm text-neutral-600 sm:mt-11">
            <Link href="/products" className="font-semibold text-primary underline-offset-4 hover:underline">
              See all products
            </Link>
          </p>
        ) : null}
      </Container>
    </Section>
  );
}
