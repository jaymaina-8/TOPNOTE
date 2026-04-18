import Link from "next/link";
import { TrackedWhatsAppButton } from "@/components/ctas/TrackedCtas";
import { HeroBookShowcase } from "@/components/sections/HeroBookShowcase";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { WHATSAPP_MESSAGES } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";

function AudienceCardArrow() {
  return (
    <span
      className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary transition-transform duration-200 group-hover:translate-x-0.5"
      aria-hidden
    >
      Continue
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
      </svg>
    </span>
  );
}

export function Hero() {
  return (
    <Section className="border-b border-neutral-200/80 bg-white pb-12 md:pb-16 lg:pb-20">
      <Container>
        {/* Split: static copy (left on lg) + rotating showcase (right on lg). min-w-0 prevents flex overflow into text. */}
        <div className="mx-auto flex max-w-6xl flex-col gap-10 lg:flex-row lg:items-start lg:justify-between lg:gap-10 xl:gap-12">
          <div className="relative z-10 mx-auto min-w-0 max-w-[min(100%,36rem)] flex-1 text-center lg:mx-0 lg:max-w-[min(100%,36rem)] lg:text-left">
            <h1 className="text-balance text-[1.65rem] font-bold leading-[1.12] tracking-tight text-neutral-950 sm:text-4xl sm:leading-[1.1] md:text-5xl md:leading-[1.06] lg:text-[2.65rem] xl:text-[2.85rem]">
              Educational Books, Exams, Stationery & Lab Supplies — Delivered Nationwide
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-pretty text-lg leading-relaxed text-neutral-600 md:text-xl lg:mx-0 lg:max-w-xl">
              Trusted by parents and schools across Kenya.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:mt-10 sm:flex-row sm:justify-center sm:gap-4 lg:justify-start">
              <TrackedWhatsAppButton message={WHATSAPP_MESSAGES.order} sourcePage="/" variant="primary" className="min-w-[200px]">
                Order on WhatsApp
              </TrackedWhatsAppButton>
              <Button href="/products" variant="secondary" className="min-w-[200px] gap-1.5 pr-5">
                Browse Products
                <span aria-hidden className="text-base font-semibold leading-none">
                  ›
                </span>
              </Button>
            </div>
          </div>

          <div className="w-full min-w-0 shrink-0 lg:w-[min(100%,720px)] lg:max-w-[720px] lg:flex-1">
            <HeroBookShowcase />
          </div>
        </div>

        <div className="mt-12 grid gap-4 sm:mt-14 sm:grid-cols-2 sm:gap-5">
          <Link
            href="/for-parents"
            className={cn(
              "group relative block rounded-2xl border border-neutral-200/80 bg-white p-6 text-left shadow-[var(--shadow-sm)] transition-[box-shadow,transform] duration-200",
              "hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-[var(--shadow-md)]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
            )}
          >
            <h2 className="text-lg font-semibold text-neutral-900">I&apos;m a Parent</h2>
            <p className="mt-2 text-sm leading-relaxed text-neutral-600">
              Shop revision books and stationery for home — clear retail pricing and quick WhatsApp support.
            </p>
            <AudienceCardArrow />
          </Link>
          <Link
            href="/for-schools"
            className={cn(
              "group relative block rounded-2xl border border-neutral-200/80 bg-white p-6 text-left shadow-[var(--shadow-sm)] transition-[box-shadow,transform] duration-200",
              "hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-[var(--shadow-md)]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
            )}
          >
            <h2 className="text-lg font-semibold text-neutral-900">I&apos;m a School</h2>
            <p className="mt-2 text-sm leading-relaxed text-neutral-600">
              Bulk supply for classrooms and labs — school pricing, quotes, and dependable delivery.
            </p>
            <AudienceCardArrow />
          </Link>
        </div>
      </Container>
    </Section>
  );
}
