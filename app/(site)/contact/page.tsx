import type { Metadata } from "next";
import type { ReactNode } from "react";

import { TrackedPhoneLink, TrackedWhatsAppButton } from "@/components/ctas/TrackedCtas";
import { InquiryForm } from "@/components/forms/InquiryForm";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { PageIntro } from "@/components/ui/PageIntro";
import { Section } from "@/components/ui/Section";
import { PHONE_DISPLAY, WHATSAPP_MESSAGES } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Contact | TOPNOTE PUBLISHERS",
  description:
    "Message TOPNOTE PUBLISHERS on WhatsApp for the fastest reply — or send an inquiry. Nationwide support across Kenya during business hours.",
};

const supportHours = [
  { days: "Monday – Friday", hours: "8AM – 6PM" },
  { days: "Saturday", hours: "9AM – 4PM" },
  { days: "Sunday", hours: "Closed" },
] as const;

const trustItems = ["Fast WhatsApp replies", "Nationwide support", "Clear pricing"] as const;

const whatsAppPrimaryClass = cn(
  "w-full justify-center border-0 text-base font-bold shadow-lg transition-[transform,box-shadow,background-color] duration-300 sm:w-auto sm:min-w-[min(100%,17rem)]",
  "min-h-12 rounded-xl px-8 py-3",
  "bg-[#FF2D2D] !text-white hover:scale-[1.02] hover:bg-[#CC0000] hover:!text-white hover:shadow-xl",
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF2D2D]/70",
);

function ChannelHeading({ children }: { children: ReactNode }) {
  return (
    <h2 className="inline-block border-b-2 border-[#FF2D2D] pb-1 text-xs font-bold uppercase tracking-[0.14em] text-neutral-900">
      {children}
    </h2>
  );
}

function TrustCheckIcon({ className }: { className?: string }) {
  return (
    <svg className={cn("h-4 w-4 shrink-0 text-emerald-700/85", className)} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path
        fillRule="evenodd"
        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export default function ContactPage() {
  return (
    <>
      <Section
        className={cn(
          "border-b border-neutral-200/80 bg-gradient-to-b from-neutral-50 via-white to-neutral-50/90",
          "py-10 md:py-12 lg:py-14",
        )}
      >
        <Container className="max-w-6xl">
          <PageIntro
            align="center"
            title="Talk to TOPNOTE PUBLISHERS"
            description="Need books, exams, stationery, or lab supplies? Message us on WhatsApp for the fastest response."
            className="mx-auto max-w-2xl"
          >
            <ul
              className="mt-5 flex list-none flex-col items-center gap-2.5 sm:mt-6 sm:flex-row sm:flex-wrap sm:justify-center sm:gap-x-8 sm:gap-y-2 md:gap-x-10"
              role="list"
            >
              {trustItems.map((label) => (
                <li key={label} className="flex items-center gap-2 text-sm text-neutral-600">
                  <TrustCheckIcon />
                  <span>{label}</span>
                </li>
              ))}
            </ul>
          </PageIntro>
        </Container>
      </Section>

      <Section surface="muted" className="py-14 md:py-16 lg:py-20">
        <Container className="max-w-6xl">
          <div className="grid gap-12 lg:grid-cols-12 lg:items-start lg:gap-14">
            <aside className="space-y-6 lg:col-span-5 lg:space-y-7">
              {/* Primary — WhatsApp */}
              <div
                className={cn(
                  "relative overflow-hidden rounded-2xl border-2 border-[#FF2D2D]/35 bg-white p-7 shadow-lg shadow-[#7A0C0C]/[0.08] ring-1 ring-[#FF2D2D]/25 md:p-9",
                )}
              >
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#FF2D2D]/80 via-[#FF5A5A]/90 to-[#FF2D2D]/80" aria-hidden />
                <div className="flex flex-wrap items-center gap-2 gap-y-2">
                  <ChannelHeading>WhatsApp</ChannelHeading>
                  <span className="rounded-full bg-[#FF2D2D]/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#B00000] ring-1 ring-[#FF2D2D]/25">
                    FASTEST RESPONSE
                  </span>
                </div>
                <p className="mt-5 text-sm leading-relaxed text-neutral-600 md:text-base">
                  Best for orders, stock checks, pricing, and quick questions.
                </p>
                <div className="mt-7">
                  <TrackedWhatsAppButton
                    message={WHATSAPP_MESSAGES.inquiry}
                    sourcePage="/contact"
                    variant="primary"
                    className={whatsAppPrimaryClass}
                  >
                    Message on WhatsApp
                  </TrackedWhatsAppButton>
                </div>
              </div>

              {/* Secondary — Phone */}
              <div className="rounded-2xl border border-neutral-200/90 bg-white p-6 shadow-[var(--shadow-md)] md:p-8">
                <ChannelHeading>Phone</ChannelHeading>
                <p className="mt-5">
                  <TrackedPhoneLink
                    sourcePage="/contact"
                    className="text-xl font-bold tabular-nums text-neutral-900 underline-offset-4 transition-colors hover:text-[#CC0000] hover:underline"
                  >
                    {PHONE_DISPLAY}
                  </TrackedPhoneLink>
                </p>
                <p className="mt-3 text-sm leading-relaxed text-neutral-600">
                  Use the same number for calls and WhatsApp. If we miss you, send a message and we&apos;ll respond during support
                  hours.
                </p>
              </div>

              {/* Secondary — Support hours */}
              <div className="rounded-2xl border border-neutral-200/90 bg-white p-6 shadow-[var(--shadow-md)] md:p-8">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">When we&apos;re available</p>
                <h2 className="mt-1.5 text-lg font-bold tracking-tight text-neutral-900">Support hours</h2>
                <dl className="mt-6 divide-y divide-neutral-100">
                  {supportHours.map(({ days, hours: openHours }) => (
                    <div key={days} className="flex items-baseline justify-between gap-4 py-3.5 first:pt-0 last:pb-0">
                      <dt className="text-sm font-medium text-neutral-600">{days}</dt>
                      <dd className="text-sm font-semibold tabular-nums tracking-tight text-neutral-900">{openHours}</dd>
                    </div>
                  ))}
                </dl>
                <p className="mt-5 border-t border-neutral-100 pt-4 text-xs leading-relaxed text-neutral-500">
                  Kenya time · nationwide delivery
                </p>
              </div>

              {/* Tertiary — Browse */}
              <div className="rounded-xl border border-neutral-200/80 bg-neutral-50/70 p-4 shadow-[var(--shadow-sm)] md:p-5">
                <p className="text-sm text-neutral-600">Still comparing options?</p>
                <Button
                  href="/products"
                  variant="primary"
                  className="mt-3 w-full border-0 text-sm font-semibold text-primary-foreground shadow-md transition-[box-shadow,transform] hover:shadow-lg sm:w-auto"
                >
                  Browse products
                </Button>
              </div>
            </aside>

            <div className="lg:col-span-7">
              <div
                className={cn(
                  "overflow-hidden rounded-2xl border border-neutral-200/80 bg-white",
                  "shadow-xl shadow-neutral-900/[0.06] ring-1 ring-neutral-900/[0.04]",
                )}
              >
                <div className="border-b border-neutral-100 bg-gradient-to-br from-neutral-50/90 via-white to-neutral-50/40 px-6 py-7 md:px-8 md:py-8">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
                    Prefer email-style contact?
                  </p>
                  <h2 className="mt-2 text-xl font-bold tracking-tight text-neutral-900 md:text-2xl">Send an inquiry</h2>
                  <p className="mt-2 max-w-xl text-sm leading-relaxed text-neutral-600 md:text-[0.9375rem]">
                    Tell us what you need and we&apos;ll confirm availability, pricing, and the fastest way to get it delivered.
                  </p>
                </div>
                <div className="p-6 pt-7 md:p-8 md:pt-8">
                  <InquiryForm
                    sourcePage="/contact"
                    sourceType="contact"
                    title={undefined}
                    description={undefined}
                    formClassName="space-y-5"
                    submitButtonClassName={cn(
                      "min-h-12 rounded-xl px-8 text-base font-bold shadow-md transition-[box-shadow,transform] duration-200",
                      "hover:shadow-lg active:scale-[0.99]",
                    )}
                  />
                </div>
              </div>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
