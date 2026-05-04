import type { Metadata } from "next";

import { CartPageClient } from "@/components/cart/CartPageClient";
import { Container } from "@/components/ui/Container";
import { PageIntro } from "@/components/ui/PageIntro";
import { Section } from "@/components/ui/Section";

export const metadata: Metadata = {
  title: "Cart",
  description: "Review your TOPNOTE PUBLISHERS order, calculate totals, and send it on WhatsApp.",
};

export default function CartPage() {
  return (
    <>
      <Section surface="muted" className="pb-10 md:pb-12">
        <Container>
          <PageIntro
            title="Cart"
            description="Review products, adjust quantities, calculate the total, then send the order to TOPNOTE on WhatsApp."
          />
        </Container>
      </Section>

      <Section surface="canvas" className="pt-2 pb-12 md:pt-4 md:pb-16">
        <Container>
          <CartPageClient />
        </Container>
      </Section>
    </>
  );
}
