import type { Metadata } from "next";
import Image from "next/image";

import { TrackedWhatsAppButton } from "@/components/ctas/TrackedCtas";
import { Testimonials } from "@/components/sections/Testimonials";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { PageIntro } from "@/components/ui/PageIntro";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { HERO_BOOK_PUBLIC_PATHS } from "@/lib/heroBookAssets";
import { WHATSAPP_MESSAGES } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "About Us | TOPNOTE PUBLISHERS",
  description:
    "TOPNOTE PUBLISHERS supplies schools and families across Kenya with revision books, exams, stationery, and lab materials — clear pricing and dependable delivery.",
};

const STORY_IMAGE = HERO_BOOK_PUBLIC_PATHS[3];

const stats = [
  { value: "500+", label: "Products" },
  { value: "50+", label: "Schools Supplied" },
  { value: "10+", label: "Years Experience" },
  { value: "Nationwide", label: "Delivery" },
] as const;

const whyChoose = [
  "Fast WhatsApp Ordering",
  "Clear Pricing",
  "Nationwide Delivery",
  "Reliable Supply Every Term",
] as const;

const sectionY = "py-16 md:py-20 lg:py-24";

export default function AboutPage() {
  return (
    <>
      <Section
        className={cn(
          "bg-gradient-to-b from-neutral-50 via-white to-neutral-50/80",
          sectionY,
        )}
      >
        <Container className="max-w-6xl">
          <PageIntro
            align="center"
            title="About TOPNOTE PUBLISHERS"
            subtitle="Supplying educational materials to schools and parents across Kenya."
          />
        </Container>
      </Section>

      <Section surface="canvas" className={sectionY}>
        <Container className="max-w-6xl">
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
            <div className="relative aspect-[4/5] min-h-[280px] w-full overflow-hidden rounded-2xl bg-neutral-100 shadow-[var(--shadow-md)] ring-1 ring-neutral-200/80 lg:aspect-[3/4]">
              <Image
                src={STORY_IMAGE}
                alt="TOPNOTE workbook and educational materials"
                fill
                className="object-cover object-center"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-primary">Our Story</p>
              <h2 className="mt-2 text-balance text-2xl font-bold tracking-tight text-neutral-900 md:text-3xl lg:text-4xl">
                Helping Schools & Parents Get the Right Materials — Fast
              </h2>
              <div className="mt-6 space-y-4 text-pretty text-base leading-relaxed text-neutral-600 md:text-lg">
                <p>
                  TOPNOTE PUBLISHERS provides revision books, exams, stationery, and lab supplies to schools and families across Kenya.
                </p>
                <p>
                  We focus on making it simple to find the right materials, get clear pricing, and receive delivery without delays.
                </p>
                <p>
                  Whether you are a parent or a school, we ensure you get what you need — quickly and reliably.
                </p>
              </div>

              <dl className="mt-10 grid grid-cols-2 gap-x-4 gap-y-8 border-t border-neutral-200 pt-8 sm:grid-cols-4 sm:gap-x-2">
                {stats.map((item) => (
                  <div key={item.label} className="text-center sm:text-left">
                    <dt className="text-2xl font-bold tracking-tight text-red-500 md:text-3xl">{item.value}</dt>
                    <dd className="mt-1 text-xs font-medium uppercase tracking-wide text-neutral-600 md:text-sm">{item.label}</dd>
                  </div>
                ))}
              </dl>

              <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Button href="/products" variant="primary" className="min-w-[180px] sm:min-w-[200px]">
                  Browse Products
                </Button>
                <TrackedWhatsAppButton
                  message={WHATSAPP_MESSAGES.inquiry}
                  sourcePage="/about"
                  variant="secondary"
                  className="min-w-[180px] sm:min-w-[200px]"
                >
                  Order on WhatsApp
                </TrackedWhatsAppButton>
              </div>
            </div>
          </div>
        </Container>
      </Section>

      <Section surface="muted" className={sectionY}>
        <Container className="max-w-6xl">
          <SectionHeading
            title="Mission, vision & values"
            description="What we stand for as your education supply partner."
            className="mb-10 md:mb-12"
          />
          <div className="grid gap-6 md:grid-cols-3 md:gap-8">
            <article className="flex h-full flex-col rounded-2xl border border-neutral-200/90 bg-white p-7 shadow-[var(--shadow-sm)] md:p-8">
              <h3 className="text-xs font-bold uppercase tracking-wider text-primary">Mission</h3>
              <p className="mt-4 text-base leading-relaxed text-neutral-700">
                To make educational materials accessible, affordable, and easy to obtain.
              </p>
            </article>
            <article className="flex h-full flex-col rounded-2xl border border-neutral-200/90 bg-white p-7 shadow-[var(--shadow-sm)] md:p-8">
              <h3 className="text-xs font-bold uppercase tracking-wider text-primary">Vision</h3>
              <p className="mt-4 text-base leading-relaxed text-neutral-700">
                To be the most reliable education supply partner for schools and families in Kenya.
              </p>
            </article>
            <article className="flex h-full flex-col rounded-2xl border border-neutral-200/90 bg-white p-7 shadow-[var(--shadow-sm)] md:p-8">
              <h3 className="text-xs font-bold uppercase tracking-wider text-primary">Values</h3>
              <ul className="mt-4 space-y-2.5 text-base leading-relaxed text-neutral-700">
                <li className="flex gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden />
                  Reliability
                </li>
                <li className="flex gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden />
                  Speed
                </li>
                <li className="flex gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden />
                  Simplicity
                </li>
                <li className="flex gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" aria-hidden />
                  Quality
                </li>
              </ul>
            </article>
          </div>
        </Container>
      </Section>

      <Section surface="canvas" className={sectionY}>
        <Container className="max-w-6xl">
          <SectionHeading
            title="Why choose TOPNOTE"
            description="Four reasons schools and parents keep coming back."
          />
          <ul className="mt-10 grid gap-4 md:mt-12 md:grid-cols-2 md:gap-5">
            {whyChoose.map((point) => (
              <li
                key={point}
                className="flex items-start gap-3 rounded-2xl border border-neutral-200/80 bg-white p-6 shadow-[var(--shadow-sm)]"
              >
                <span
                  className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-500/10 text-red-600"
                  aria-hidden
                >
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </span>
                <span className="text-base font-semibold leading-snug text-neutral-900">{point}</span>
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      <Testimonials />
    </>
  );
}
