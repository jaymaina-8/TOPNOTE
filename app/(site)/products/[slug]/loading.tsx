import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";

export default function ProductDetailLoading() {
  return (
    <Section>
      <Container>
        <div className="h-4 w-48 animate-pulse rounded bg-neutral-100" aria-hidden />
        <div className="mt-8 grid gap-10 lg:grid-cols-2">
          <div className="aspect-[4/3] animate-pulse rounded-xl bg-neutral-100" />
          <div className="space-y-4">
            <div className="h-4 w-24 animate-pulse rounded bg-neutral-100" />
            <div className="h-9 w-4/5 animate-pulse rounded-lg bg-neutral-200" />
            <div className="h-8 w-32 animate-pulse rounded bg-neutral-100" />
            <div className="h-24 animate-pulse rounded bg-neutral-50" />
            <div className="h-11 max-w-xs animate-pulse rounded-xl bg-neutral-100" />
          </div>
        </div>
      </Container>
    </Section>
  );
}
