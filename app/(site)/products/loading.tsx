import { catalogProductGridClass } from "@/components/products/productCardClasses";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { cn } from "@/lib/utils";

export default function ProductsLoading() {
  return (
    <Section>
      <Container>
        <div className="mx-auto h-8 max-w-md animate-pulse rounded-lg bg-neutral-200" aria-hidden />
        <div className="mx-auto mt-3 h-4 max-w-xl animate-pulse rounded bg-neutral-100" aria-hidden />
        <ul className={cn("mt-10", catalogProductGridClass)}>
          {Array.from({ length: 6 }).map((_, i) => (
            <li key={i} className="overflow-hidden rounded-2xl bg-white shadow-[var(--shadow-sm)] sm:rounded-2xl">
              <div className="aspect-[3/2] animate-pulse bg-neutral-100 sm:aspect-[4/3]" />
              <div className="space-y-3 p-6 sm:p-5">
                <div className="h-3 w-1/3 animate-pulse rounded bg-neutral-100" />
                <div className="h-5 w-4/5 animate-pulse rounded bg-neutral-200" />
                <div className="h-4 w-full animate-pulse rounded bg-neutral-100" />
                <div className="h-12 animate-pulse rounded-full bg-neutral-100" />
              </div>
            </li>
          ))}
        </ul>
      </Container>
    </Section>
  );
}
