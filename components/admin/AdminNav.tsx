import Link from "next/link";

import { signOutAction } from "@/lib/auth/sign-out";

const links = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/products", label: "Products" },
  { href: "/dashboard/categories", label: "Categories" },
  { href: "/dashboard/testimonials", label: "Testimonials" },
  { href: "/dashboard/inquiries", label: "Inquiries" },
  { href: "/dashboard/analytics", label: "Analytics" },
] as const;

export function AdminNav() {
  return (
    <header className="border-b border-neutral-300 bg-neutral-200/80">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-2 px-4 py-3">
        <p className="mr-4 text-sm font-semibold uppercase tracking-wide text-neutral-600">Internal</p>
        <nav className="flex flex-wrap gap-2" aria-label="Dashboard">
          {links.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="rounded-md border border-transparent px-2 py-1 text-sm font-medium text-neutral-800 hover:border-neutral-400 hover:bg-neutral-100"
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex flex-wrap items-center gap-3">
          <Link
            href="/"
            className="text-sm text-neutral-600 underline-offset-2 hover:text-neutral-900 hover:underline"
          >
            Public site
          </Link>
          <form action={signOutAction}>
            <button
              type="submit"
              className="rounded-md border border-neutral-400 bg-white px-2 py-1 text-sm font-medium text-neutral-800 hover:bg-neutral-50"
            >
              Sign out
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
