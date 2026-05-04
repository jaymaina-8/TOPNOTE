"use client";

import Image from "next/image";
import Link from "next/link";
import { useId, useState } from "react";
import { CartLinkBadge } from "@/components/cart/CartLinkBadge";
import { TrackedWhatsAppButton } from "@/components/ctas/TrackedCtas";
import { Container } from "@/components/ui/Container";
import { LOGO_SRC, SITE_NAME } from "@/lib/site";
import { WHATSAPP_MESSAGES } from "@/lib/whatsapp";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/products", label: "Products" },
  { href: "/for-parents", label: "For Parents" },
  { href: "/for-schools", label: "For Schools" },
  { href: "/cart", label: "Cart" },
  { href: "/contact", label: "Contact" },
] as const;

export function Navbar() {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  return (
    <header className="sticky top-0 z-50 border-b border-primary/10 bg-white/95 shadow-[0_10px_30px_rgba(127,7,18,0.06)] backdrop-blur-md supports-[backdrop-filter]:bg-white/90">
      <Container className="flex min-h-[3.25rem] max-w-none items-center justify-between gap-3 px-2.5 py-1 sm:px-4 sm:py-1.5 md:min-h-[3.75rem] md:py-2 lg:py-1.5 lg:pl-2 lg:pr-10 xl:pl-3 xl:pr-12">
        <Link
          href="/"
          aria-label={SITE_NAME}
          className="flex min-w-0 items-center gap-2.5 text-base font-bold leading-snug tracking-tight text-primary sm:gap-3 transition-colors hover:text-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          <Image
            src={LOGO_SRC}
            alt=""
            width={72}
            height={72}
            className="h-11 w-11 shrink-0 rounded-lg object-contain sm:h-12 sm:w-12 md:h-14 md:w-14"
            priority
            aria-hidden
          />
          <span className="min-w-0 truncate sm:whitespace-normal">{SITE_NAME}</span>
        </Link>

        <nav className="hidden items-center gap-0.5 md:flex" aria-label="Main">
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="rounded-lg px-3.5 py-2 text-sm font-semibold text-neutral-600 transition-colors hover:bg-primary/10 hover:text-primary"
            >
              {label}
              {href === "/cart" ? <CartLinkBadge /> : null}
            </Link>
          ))}
        </nav>

        <div className="hidden shrink-0 md:block">
          <TrackedWhatsAppButton message={WHATSAPP_MESSAGES.order} variant="primary">
            Order on WhatsApp
          </TrackedWhatsAppButton>
        </div>

        <button
          type="button"
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-[var(--shadow-sm)] transition-colors hover:bg-primary/15 md:hidden"
          aria-expanded={open}
          aria-controls={panelId}
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
        >
          <svg
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden
          >
            {open ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </Container>

      <div
        id={panelId}
        className={`bg-white shadow-[0_8px_24px_rgba(15,23,42,0.06)] md:hidden ${open ? "block" : "hidden"}`}
      >
        <Container className="flex max-w-none flex-col gap-0.5 px-2.5 py-4 sm:px-4 lg:pl-2 lg:pr-10 xl:pl-3 xl:pr-12">
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="rounded-xl px-3 py-3 text-base font-medium text-neutral-800 transition-colors hover:bg-neutral-50"
              onClick={() => setOpen(false)}
            >
              {label}
              {href === "/cart" ? <CartLinkBadge /> : null}
            </Link>
          ))}
          <div className="pt-3">
            <TrackedWhatsAppButton message={WHATSAPP_MESSAGES.order} variant="primary" className="w-full">
              Order on WhatsApp
            </TrackedWhatsAppButton>
          </div>
        </Container>
      </div>
    </header>
  );
}
