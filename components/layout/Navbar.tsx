"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useId, useState } from "react";
import { CartLinkBadge } from "@/components/cart/CartLinkBadge";
import { TrackedWhatsAppButton } from "@/components/ctas/TrackedCtas";
import { Container } from "@/components/ui/Container";
import { LOGO_SRC, SITE_NAME } from "@/lib/site";
import { cn } from "@/lib/utils";
import { WHATSAPP_MESSAGES } from "@/lib/whatsapp";

const navLinks = [
  { href: "/", label: "Home", eyebrow: "Start here" },
  { href: "/about", label: "About", eyebrow: "Our story" },
  { href: "/products", label: "Products", eyebrow: "Books and stationery" },
  { href: "/for-parents", label: "Parents", eyebrow: "Home lists" },
  { href: "/for-schools", label: "Schools", eyebrow: "Bulk supplies" },
  { href: "/orders", label: "Orders", eyebrow: "Track your order" },
  { href: "/contact", label: "Contact", eyebrow: "Talk to us" },
] as const;

export function Navbar() {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const pathname = usePathname() ?? "/";

  return (
    <header className="sticky top-0 z-50 border-b border-primary/10 bg-white/95 shadow-[0_10px_30px_rgba(127,7,18,0.06)] backdrop-blur-md supports-[backdrop-filter]:bg-white/90">
      <Container className="flex min-h-[3.25rem] max-w-none items-center justify-between gap-3 px-2.5 py-1 sm:px-4 sm:py-1.5 md:min-h-[3.75rem] md:py-2 lg:py-1.5 lg:pl-2 lg:pr-10 xl:pl-3 xl:pr-12">
        <Link
          href="/"
          aria-label={SITE_NAME}
          className="flex min-w-0 items-center gap-2.5 text-base font-bold leading-snug tracking-tight text-primary transition-colors hover:text-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 sm:gap-3"
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
              aria-current={isActive(pathname, href) ? "page" : undefined}
              className={cn(
                "rounded-lg px-3.5 py-2 text-sm font-semibold text-neutral-600 transition-colors hover:bg-primary/10 hover:text-primary",
                isActive(pathname, href) && "bg-primary/10 text-primary",
              )}
            >
              {label}
            </Link>
          ))}
          <Link
            href="/cart"
            aria-current={isActive(pathname, "/cart") ? "page" : undefined}
            className={cn(
              "rounded-lg px-3.5 py-2 text-sm font-semibold text-neutral-600 transition-colors hover:bg-primary/10 hover:text-primary",
              isActive(pathname, "/cart") && "bg-primary/10 text-primary",
            )}
          >
            Cart
            <CartLinkBadge />
          </Link>
        </nav>

        <div className="hidden shrink-0 md:block">
          <TrackedWhatsAppButton message={WHATSAPP_MESSAGES.order} variant="primary">
            Order on WhatsApp
          </TrackedWhatsAppButton>
        </div>

        <div className="hidden max-md:flex shrink-0 items-center gap-2">
          <Link
            href="/cart"
            aria-label="Cart"
            className="relative inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl text-primary transition-colors hover:text-primary/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          >
            <CartIcon />
            <span className="absolute -right-1 -top-1">
              <CartLinkBadge />
            </span>
          </Link>

          <button
            type="button"
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-[var(--shadow-sm)] transition-colors hover:bg-primary/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            aria-expanded={open}
            aria-controls={panelId}
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </Container>

      <div
        className={cn(
          "fixed inset-0 z-50 bg-neutral-950/30 backdrop-blur-[1px] transition-opacity hidden max-md:block",
          open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
        )}
        aria-hidden={!open}
        onClick={() => setOpen(false)}
      >
        <aside
          id={panelId}
          className={cn(
            "min-h-dvh w-[min(20rem,86vw)] bg-white shadow-[0_24px_70px_rgba(15,23,42,0.18)] transition-transform duration-300 ease-out",
            open ? "translate-x-0" : "-translate-x-full",
          )}
          onClick={(event) => event.stopPropagation()}
        >
        <Container className="max-w-none px-3 py-3 sm:px-5 lg:pl-5 lg:pr-8 xl:px-10">
          <div className="mb-3 flex items-center justify-between border-b border-primary/10 pb-3">
            <Link
              href="/"
              aria-label={SITE_NAME}
              className="flex min-w-0 items-center gap-2.5 text-sm font-bold leading-snug tracking-tight text-primary"
              onClick={() => setOpen(false)}
            >
              <Image
                src={LOGO_SRC}
                alt=""
                width={72}
                height={72}
                className="h-10 w-10 shrink-0 rounded-lg object-contain"
                aria-hidden
              />
              <span className="min-w-0 truncate">{SITE_NAME}</span>
            </Link>
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary"
              aria-label="Close menu"
              onClick={() => setOpen(false)}
            >
              <CloseIcon />
            </button>
          </div>
          <nav className="grid gap-1.5" aria-label="Mobile main">
            {navLinks.map(({ href, label, eyebrow }) => (
              <Link
                key={href}
                href={href}
                aria-current={isActive(pathname, href) ? "page" : undefined}
                className={cn(
                  "flex items-center justify-between rounded-2xl border border-transparent px-3 py-3 text-neutral-800 transition-colors hover:border-primary/10 hover:bg-primary/[0.035]",
                  isActive(pathname, href) && "border-primary/15 bg-primary/[0.06] text-primary",
                )}
                onClick={() => setOpen(false)}
              >
                <span>
                  <span className="block text-sm font-black leading-tight">{label}</span>
                  <span className="mt-0.5 block text-xs font-semibold text-neutral-500">{eyebrow}</span>
                </span>
                <ArrowIcon />
              </Link>
            ))}
            <Link
              href="/cart"
              aria-current={isActive(pathname, "/cart") ? "page" : undefined}
              className={cn(
                "flex items-center justify-between rounded-2xl border border-transparent px-3 py-3 text-neutral-800 transition-colors hover:border-primary/10 hover:bg-primary/[0.035]",
                isActive(pathname, "/cart") && "border-primary/15 bg-primary/[0.06] text-primary",
              )}
              onClick={() => setOpen(false)}
            >
              <span>
                <span className="block text-sm font-black leading-tight">
                  Cart
                  <CartLinkBadge />
                </span>
                <span className="mt-0.5 block text-xs font-semibold text-neutral-500">Review order</span>
              </span>
              <ArrowIcon />
            </Link>
          </nav>
          <div className="pt-3">
            <TrackedWhatsAppButton message={WHATSAPP_MESSAGES.order} variant="primary" className="w-full">
              Order on WhatsApp
            </TrackedWhatsAppButton>
          </div>
        </Container>
        </aside>
      </div>
    </header>
  );
}

function isActive(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

function MenuIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeWidth={2.2} d="M5 7h14M5 12h14M5 17h14" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M6.5 6.5l11 11m0-11-11 11" />
    </svg>
  );
}

function CartIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M6.5 7.5h13l-1.3 7.1a2 2 0 0 1-2 1.6H9.1a2 2 0 0 1-2-1.6L5.8 5.8H3.9M9.2 19.5h.1m6.5 0h.1"
      />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg className="h-4 w-4 shrink-0 text-primary/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m9 6 6 6-6 6" />
    </svg>
  );
}
