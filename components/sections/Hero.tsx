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
    <Section className="relative isolate overflow-hidden border-b border-primary/10 bg-primary pb-12 text-white md:pb-16 lg:pb-20">
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(127,7,18,0.92)_0%,rgba(212,18,36,0.96)_48%,rgba(255,255,255,0.08)_100%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.16] [background-image:linear-gradient(rgba(255,255,255,0.35)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.28)_1px,transparent_1px)] [background-size:44px_44px]"
        aria-hidden
      />

      <Container>
        <div className="relative mx-auto flex max-w-6xl flex-col gap-10 lg:flex-row lg:items-center lg:justify-between lg:gap-10 xl:gap-12">
          <div className="relative z-10 mx-auto min-w-0 max-w-[min(100%,36rem)] flex-1 text-center lg:mx-0 lg:max-w-[min(100%,36rem)] lg:text-left">
            <p className="mx-auto inline-flex rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-white shadow-sm backdrop-blur lg:mx-0">
              Leading education publisher in Kenya
            </p>
            <h1 className="mt-5 text-balance text-[2rem] font-bold leading-[1.08] tracking-tight text-white sm:text-4xl sm:leading-[1.06] md:text-5xl md:leading-[1.03] lg:text-[3.15rem] xl:text-[3.45rem]">
              CBC books, exams and school supplies delivered across Kenya
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-pretty text-base leading-relaxed text-white/86 md:text-xl lg:mx-0 lg:max-w-xl">
              TOPNOTE PUBLISHERS helps parents and schools get curriculum-ready learning materials, exam practice, stationery and lab essentials with fast WhatsApp ordering and dependable delivery.
            </p>

            <div className="mx-auto mt-6 grid max-w-xl grid-cols-3 overflow-hidden rounded-2xl border border-white/18 bg-white/10 text-left shadow-[0_20px_60px_rgba(0,0,0,0.14)] backdrop-blur lg:mx-0">
              {[
                ["500+", "products"],
                ["50+", "schools"],
                ["Kenya", "delivery"],
              ].map(([value, label]) => (
                <div key={label} className="border-r border-white/14 px-4 py-3 last:border-r-0">
                  <p className="text-lg font-bold leading-none text-white md:text-2xl">{value}</p>
                  <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/68">{label}</p>
                </div>
              ))}
            </div>

            <div className="mt-9 flex flex-col gap-3 sm:mt-10 sm:flex-row sm:justify-center sm:gap-4 lg:justify-start">
              <TrackedWhatsAppButton
                message={WHATSAPP_MESSAGES.order}
                sourcePage="/"
                variant="primary"
                className="min-w-[200px] bg-white !text-primary shadow-lg shadow-black/20 hover:bg-white/92 hover:!text-primary"
              >
                Order on WhatsApp
              </TrackedWhatsAppButton>
              <Button
                href="/products"
                variant="outline"
                className="min-w-[200px] gap-1.5 border border-white/25 bg-white/10 pr-5 text-white shadow-lg shadow-black/10 backdrop-blur hover:bg-white/18"
              >
                Browse Products
                <span aria-hidden className="text-base font-semibold leading-none">
                  &rsaquo;
                </span>
              </Button>
            </div>
          </div>

          <div className="w-full min-w-0 shrink-0 lg:w-[min(100%,720px)] lg:max-w-[720px] lg:flex-1">
            <div className="relative overflow-hidden rounded-[1.75rem] bg-white py-5 shadow-[var(--shadow-premium)] ring-1 ring-white/45">
              <div className="absolute inset-x-0 top-0 h-1.5 bg-white" aria-hidden />
              <HeroBookShowcase />
            </div>
          </div>
        </div>

        <div className="relative mt-12 grid gap-4 sm:mt-14 sm:grid-cols-2 sm:gap-5">
          <Link
            href="/for-parents"
            className={cn(
              "group relative block overflow-hidden rounded-2xl border border-white/18 bg-white p-6 text-left text-neutral-900 shadow-[var(--shadow-premium)] transition-[box-shadow,transform] duration-200",
              "before:absolute before:inset-x-0 before:top-0 before:h-1 before:bg-primary",
              "hover:-translate-y-0.5 hover:shadow-[0_28px_80px_rgba(0,0,0,0.22)]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-primary",
            )}
          >
            <h2 className="text-lg font-semibold text-neutral-900">I&apos;m a Parent</h2>
            <p className="mt-2 text-sm leading-relaxed text-neutral-600">
              Shop revision books and stationery for home with clear retail pricing and quick WhatsApp support.
            </p>
            <AudienceCardArrow />
          </Link>
          <Link
            href="/for-schools"
            className={cn(
              "group relative block overflow-hidden rounded-2xl border border-white/18 bg-white p-6 text-left text-neutral-900 shadow-[var(--shadow-premium)] transition-[box-shadow,transform] duration-200",
              "before:absolute before:inset-x-0 before:top-0 before:h-1 before:bg-primary",
              "hover:-translate-y-0.5 hover:shadow-[0_28px_80px_rgba(0,0,0,0.22)]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-primary",
            )}
          >
            <h2 className="text-lg font-semibold text-neutral-900">I&apos;m a School</h2>
            <p className="mt-2 text-sm leading-relaxed text-neutral-600">
              Bulk supply for classrooms and labs with school pricing, quotes, and dependable delivery.
            </p>
            <AudienceCardArrow />
          </Link>
        </div>
      </Container>
    </Section>
  );
}
