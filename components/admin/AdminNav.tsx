"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

import { signOutAction } from "@/lib/auth/sign-out";
import { LOGO_SRC } from "@/lib/site";
import { cn } from "@/lib/utils";

const links = [
  { href: "/dashboard", label: "Overview", short: "Home" },
  { href: "/dashboard/products", label: "Products", short: "Products" },
  { href: "/dashboard/categories", label: "Categories", short: "Categories" },
  { href: "/dashboard/exams", label: "Exams", short: "Exams" },
  { href: "/dashboard/orders", label: "Orders", short: "Orders" },
  { href: "/dashboard/testimonials", label: "Testimonials", short: "Quotes" },
  { href: "/dashboard/inquiries", label: "Inquiries", short: "Inquiries" },
  { href: "/dashboard/analytics", label: "Analytics", short: "Analytics" },
] as const;

export function AdminNav() {
  const pathname = usePathname() ?? "/dashboard";

  return (
    <header className="sticky top-0 z-50 border-b border-neutral-200 bg-white/92 shadow-[0_8px_28px_rgba(15,23,42,0.05)] backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <Link
          href="/dashboard"
          className="mr-1 flex items-center gap-2 rounded-lg text-neutral-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-white ring-1 ring-primary/15">
            <Image src={LOGO_SRC} alt="" width={72} height={72} className="h-7 w-7 object-contain" priority />
          </span>
          <span>
            <span className="block text-sm font-black leading-tight">TOPNOTE</span>
            <span className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-500">Internal</span>
          </span>
        </Link>

        <nav
          className="order-3 flex w-full gap-1 overflow-x-auto rounded-xl border border-neutral-200 bg-neutral-50 p-1 md:order-none md:w-auto"
          aria-label="Dashboard"
        >
          {links.map(({ href, label, short }) => (
            <Link
              key={href}
              href={href}
              aria-current={isActive(pathname, href) ? "page" : undefined}
              className={cn(
                "whitespace-nowrap rounded-lg px-3 py-2 text-sm font-bold text-neutral-600 transition-colors hover:bg-white hover:text-neutral-950",
                isActive(pathname, href) && "bg-white text-primary shadow-sm",
              )}
            >
              <span className="sm:hidden">{short}</span>
              <span className="hidden sm:inline">{label}</span>
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex flex-wrap items-center gap-3">
          <Link
            href="/"
            className="text-sm font-semibold text-neutral-600 underline-offset-4 hover:text-neutral-950 hover:underline"
          >
            Public site
          </Link>
          <form action={signOutAction}>
            <button
              type="submit"
              className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm font-bold text-neutral-800 shadow-sm hover:bg-neutral-50"
            >
              Sign out
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}

function isActive(pathname: string, href: string) {
  if (href === "/dashboard") {
    return pathname === href;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}
