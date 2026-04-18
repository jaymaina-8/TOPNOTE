import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";

import { TrackedPhoneLink, TrackedWhatsAppButton } from "@/components/ctas/TrackedCtas";
import { FooterSocialLinks } from "@/components/layout/FooterSocialLinks";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { LOGO_SRC, SITE_NAME } from "@/lib/site";
import { getFooterSocialLinks } from "@/lib/social";
import { PHONE_DISPLAY, WHATSAPP_MESSAGES } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";

const companyLinks = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/products", label: "Products" },
  { href: "/for-parents", label: "For Parents" },
  { href: "/for-schools", label: "For Schools" },
  { href: "/contact", label: "Contact" },
] as const;

const supportHours = [
  { days: "Monday – Friday", hours: "8AM – 6PM" },
  { days: "Saturday", hours: "9AM – 4PM" },
  { days: "Sunday", hours: "Closed" },
] as const;

function FooterColumnHeading({ children }: { children: ReactNode }) {
  return (
    <h2 className="mb-6 text-xs font-semibold uppercase tracking-[0.2em] text-white/95">
      {children}
    </h2>
  );
}

function MapPinIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
      />
    </svg>
  );
}

function PhoneIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z"
      />
    </svg>
  );
}

const footerLinkClass = cn(
  "text-sm font-medium text-neutral-200 transition-colors duration-200",
  "hover:text-white hover:underline hover:decoration-[#ff8a8a]/90 hover:decoration-2 hover:underline-offset-4",
  "focus-visible:rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/50",
);

const footerWhatsAppClass = cn(
  "w-full min-w-0 justify-center rounded-full border-0 px-7",
  "shadow-lg shadow-black/30 transition-[transform,box-shadow,background-color] duration-300 ease-out sm:w-auto",
  "bg-[#FF2D2D] !text-white hover:-translate-y-0.5 hover:bg-[#e02032] hover:shadow-xl hover:shadow-[#ff2d2d]/25 hover:!text-white",
  "active:translate-y-0 active:shadow-md",
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/70",
);

const browseOutlineClass = cn(
  "w-full rounded-full border border-white/28 bg-white/[0.07] px-7 backdrop-blur-sm",
  "text-sm font-semibold text-white shadow-md shadow-black/15 transition-[transform,background-color,border-color,box-shadow] duration-300",
  "hover:-translate-y-0.5 hover:border-white/45 hover:bg-white/[0.12] hover:shadow-lg hover:shadow-black/25",
  "active:translate-y-0",
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/55",
);

export function Footer() {
  const socialLinks = getFooterSocialLinks();

  return (
    <footer className="relative isolate mt-auto overflow-hidden border-t border-white/10 max-md:pb-[calc(5rem+env(safe-area-inset-bottom,0px))]">
      {/* Layered surface: deep burgundy base + highlights + fine grain */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(168deg,#4c1018_0%,#320a0f_42%,#180305_100%)]" aria-hidden />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_110%_75%_at_50%_-18%,rgba(255,75,85,0.2),transparent_58%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_65%_50%_at_95%_95%,rgba(255,255,255,0.08),transparent_55%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35] mix-blend-soft-light [background-image:radial-gradient(rgba(255,255,255,0.07)_1px,transparent_1px)] [background-size:15px_15px]"
        aria-hidden
      />

      <div className="relative py-16 md:py-20 lg:py-24">
        <Container className="max-w-6xl">
          <div className="grid grid-cols-1 gap-14 md:grid-cols-2 md:gap-x-12 md:gap-y-16 lg:grid-cols-4 lg:gap-x-14 lg:gap-y-14">
            {/* Column 1 — Company */}
            <div>
              <div className="mb-10">
                <Link
                  href="/"
                  aria-label={SITE_NAME}
                  className="flex min-w-0 items-center gap-2.5 text-base font-bold leading-snug tracking-tight text-white transition-colors hover:text-white/92 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[#2a0a10] sm:gap-3"
                >
                  <Image
                    src={LOGO_SRC}
                    alt=""
                    width={72}
                    height={72}
                    className="h-11 w-11 shrink-0 rounded-lg object-contain brightness-0 invert drop-shadow-md sm:h-12 sm:w-12 md:h-14 md:w-14"
                    aria-hidden
                  />
                  <span className="min-w-0 truncate sm:whitespace-normal">{SITE_NAME}</span>
                </Link>
              </div>
              <FooterColumnHeading>Company</FooterColumnHeading>
              <p className="mb-7 max-w-xs text-sm leading-relaxed text-neutral-200/95">
                Educational supplies for schools and parents across Kenya.
              </p>
              <nav aria-label="Company">
                <ul className="space-y-3.5">
                  {companyLinks.map(({ href, label }) => (
                    <li key={href}>
                      <Link href={href} className={footerLinkClass}>
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>

            {/* Column 2 — Contact */}
            <div>
              <FooterColumnHeading>Contact</FooterColumnHeading>
              <div className="flex flex-col gap-6">
                <ul className="space-y-5 text-sm text-neutral-200">
                  <li className="flex gap-3">
                    <MapPinIcon className="mt-0.5 h-5 w-5 shrink-0 text-white/90" />
                    <span className="font-medium text-white">Kenya</span>
                  </li>
                  <li className="flex gap-3">
                    <PhoneIcon className="mt-0.5 h-5 w-5 shrink-0 text-white/90" />
                    <TrackedPhoneLink
                      sourcePage="/footer"
                      className={cn(
                        "font-semibold text-white underline-offset-4 transition-colors",
                        "hover:text-[#ffc9c9] hover:underline",
                      )}
                    >
                      {PHONE_DISPLAY}
                    </TrackedPhoneLink>
                  </li>
                </ul>
                <FooterSocialLinks links={socialLinks} />
                <TrackedWhatsAppButton
                  message={WHATSAPP_MESSAGES.inquiry}
                  sourcePage="/footer"
                  variant="primary"
                  className={footerWhatsAppClass}
                >
                  Message on WhatsApp
                </TrackedWhatsAppButton>
              </div>
            </div>

            {/* Column 3 — Support hours */}
            <div>
              <FooterColumnHeading>Support hours</FooterColumnHeading>
              <dl className="space-y-5 text-sm">
                {supportHours.map(({ days, hours }) => (
                  <div key={days} className="border-b border-white/[0.08] pb-5 last:border-0 last:pb-0">
                    <dt className="font-medium text-neutral-300">{days}</dt>
                    <dd className="mt-1.5 font-semibold tabular-nums tracking-tight text-white">{hours}</dd>
                  </div>
                ))}
              </dl>
            </div>

            {/* Column 4 — CTA */}
            <div>
              <FooterColumnHeading>Need materials?</FooterColumnHeading>
              <p className="mb-7 text-sm leading-relaxed text-neutral-200/95">
                Message us today and get the right books, exams, stationery, and lab supplies for your school or home.
              </p>
              <div className="flex flex-col gap-3.5">
                <TrackedWhatsAppButton
                  message={WHATSAPP_MESSAGES.inquiry}
                  sourcePage="/footer-cta"
                  variant="primary"
                  className={footerWhatsAppClass}
                >
                  Message on WhatsApp
                </TrackedWhatsAppButton>
                <Button href="/products" variant="outline" className={browseOutlineClass}>
                  Browse products
                </Button>
              </div>
            </div>
          </div>
        </Container>
      </div>

      {/* Translucent divider + soft glow */}
      <div className="relative">
        <div
          className="h-px w-full bg-gradient-to-r from-transparent via-white/30 to-transparent shadow-[0_0_20px_rgba(255,160,160,0.14)]"
          aria-hidden
        />
        <div className="border-t border-white/10 bg-gradient-to-r from-[#b81222] via-[#e11d2e] to-[#b81222] shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]">
          <Container className="max-w-6xl py-5 md:py-6">
            <p className="text-center text-xs font-medium leading-relaxed text-white sm:text-sm">
              <span className="text-white/95">© 2026 {SITE_NAME}</span>
              <span className="mx-2 hidden text-white/35 sm:inline" aria-hidden>
                ·
              </span>
              <span className="mt-2 block sm:mt-0 sm:inline">
                <span className="text-[0.95em] text-white/80">Powered by </span>
                <a
                  href="https://www.blackpoolindustry.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-white underline decoration-white/50 underline-offset-4 transition-colors hover:decoration-white"
                >
                  Blackpool Industry
                </a>
              </span>
            </p>
          </Container>
        </div>
      </div>
    </footer>
  );
}
