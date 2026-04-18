import { TrackedPhoneButton, TrackedWhatsAppButton } from "@/components/ctas/TrackedCtas";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { WHATSAPP_MESSAGES } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";

const waPrimaryClass = cn(
  "w-full justify-center rounded-full border-0 px-8 py-3.5 text-base font-bold !text-white shadow-lg",
  "shadow-[#ff2d2d]/30 transition-all duration-300 ease-out sm:w-auto sm:min-w-[17.5rem] md:min-w-[18rem] md:py-4 md:text-lg",
  "bg-[#FF2D2D] hover:-translate-y-0.5 hover:bg-[#d91f2e] hover:shadow-xl hover:shadow-[#ff2d2d]/35 hover:!text-white",
  "active:translate-y-0 active:shadow-lg",
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF2D2D]/50",
);

const callSecondaryClass = cn(
  "w-full justify-center rounded-full border border-neutral-200/90 bg-white/95 px-6 py-2.5 text-sm font-semibold text-neutral-800",
  "shadow-sm transition-[transform,background-color,border-color,box-shadow] duration-200 sm:w-auto sm:min-w-[11rem]",
  "hover:-translate-y-px hover:border-neutral-300 hover:bg-neutral-50 hover:shadow-md",
  "active:translate-y-0",
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-400",
);

export function FinalCta() {
  return (
    <Section surface="muted" className="relative py-10 md:py-14 lg:py-16">
      <Container className="max-w-3xl">
        <div
          className={cn(
            "relative isolate overflow-hidden rounded-3xl border border-red-100/70",
            "bg-gradient-to-b from-white via-[#FFFAFA] to-[#FFF5F5]",
            "px-6 py-12 text-center shadow-xl shadow-neutral-900/[0.07] ring-1 ring-red-100/50",
            "md:px-12 md:py-16 lg:px-14 lg:py-[4.25rem]",
          )}
        >
          {/* Soft radial emphasis behind headline */}
          <div
            className="pointer-events-none absolute -top-16 left-1/2 h-[22rem] w-[min(100%,42rem)] -translate-x-1/2 bg-[radial-gradient(ellipse_70%_55%_at_50%_35%,rgba(255,45,61,0.09),transparent_72%)]"
            aria-hidden
          />
          {/* Glow behind CTAs */}
          <div
            className="pointer-events-none absolute bottom-[12%] left-1/2 h-32 w-[min(90%,22rem)] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(255,45,61,0.14),transparent_68%)] blur-2xl"
            aria-hidden
          />

          <div className="relative">
            <h2 className="text-balance text-2xl font-bold tracking-tight text-neutral-900 md:text-3xl lg:text-[2rem] lg:leading-tight">
              Ready to get your materials?
            </h2>
            <p className="mx-auto mt-2 max-w-lg text-pretty text-sm leading-relaxed text-neutral-600 md:mt-2.5 md:text-base">
              Get fast answers on stock, pricing, and delivery. WhatsApp is the quickest way to order.
            </p>

            <div className="mx-auto mt-6 flex w-full max-w-md flex-col items-stretch gap-4 sm:mt-7 sm:max-w-xl sm:flex-row sm:items-center sm:justify-center sm:gap-6">
              <TrackedWhatsAppButton
                message={WHATSAPP_MESSAGES.inquiry}
                sourcePage="/"
                variant="primary"
                className={waPrimaryClass}
              >
                Message on WhatsApp
              </TrackedWhatsAppButton>
              <TrackedPhoneButton
                sourcePage="/"
                variant="outline"
                className={callSecondaryClass}
                label="Call now"
              />
            </div>

            <p className="mt-4 text-xs font-medium leading-relaxed text-neutral-500 md:mt-5">
              Typical response time: within business hours
            </p>
          </div>
        </div>
      </Container>
    </Section>
  );
}
