import Link from "next/link";

import { getDashboardOverviewData } from "@/lib/queries/analytics";

export const dynamic = "force-dynamic";

function formatWhen(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-KE", { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export default async function DashboardHomePage() {
  const overview = await getDashboardOverviewData();

  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">TOPNOTE PUBLISHERS</p>
      <h1 className="mt-1 text-2xl font-bold tracking-tight text-neutral-900">Dashboard</h1>
      <p className="mt-2 max-w-2xl text-sm text-neutral-600">
        Internal overview. Catalog writes use the Supabase service role on the server only.
      </p>

      {overview.ok === false ? (
        <div className="mt-8 rounded-xl border border-amber-200/80 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          {overview.reason === "supabase_unconfigured" ? (
            <p>
              Configure <code className="rounded bg-amber-100 px-1">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
              <code className="rounded bg-amber-100 px-1">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to load summary data.
            </p>
          ) : overview.reason === "service_role_unconfigured" ? (
            <p>
              Add <code className="rounded bg-amber-100 px-1">SUPABASE_SERVICE_ROLE_KEY</code> for inquiry and analytics
              aggregates.
            </p>
          ) : (
            <p>Could not load summary data. Try again later.</p>
          )}
        </div>
      ) : (
        <>
          <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <li className="rounded-lg border border-neutral-300 bg-white p-4 shadow-sm">
              <p className="text-xs text-neutral-500">Open inquiries</p>
              <p className="text-2xl font-semibold tabular-nums text-neutral-900">{overview.summary.openInquiries}</p>
            </li>
            <li className="rounded-lg border border-neutral-300 bg-white p-4 shadow-sm">
              <p className="text-xs text-neutral-500">Total inquiries</p>
              <p className="text-2xl font-semibold tabular-nums text-neutral-900">{overview.summary.totalInquiries}</p>
            </li>
            <li className="rounded-lg border border-neutral-300 bg-white p-4 shadow-sm">
              <p className="text-xs text-neutral-500">WhatsApp clicks</p>
              <p className="text-2xl font-semibold tabular-nums text-neutral-900">
                {overview.summary.conversionTotals.whatsapp_click}
              </p>
            </li>
            <li className="rounded-lg border border-neutral-300 bg-white p-4 shadow-sm">
              <p className="text-xs text-neutral-500">Phone clicks</p>
              <p className="text-2xl font-semibold tabular-nums text-neutral-900">
                {overview.summary.conversionTotals.phone_click}
              </p>
            </li>
          </ul>

          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(
              [
                { href: "/dashboard/products", title: "Products", description: "List, create, edit, and remove catalog items." },
                { href: "/dashboard/categories", title: "Categories", description: "Manage category names, slugs, and types." },
                { href: "/dashboard/testimonials", title: "Testimonials", description: "Add or remove customer quotes on the home page." },
                { href: "/dashboard/inquiries", title: "Inquiries", description: "Review form submissions and update status." },
                { href: "/dashboard/analytics", title: "Analytics", description: "Conversion events and inquiry breakdowns." },
              ] as const
            ).map(({ href, title, description }) => (
              <li key={href}>
                <Link
                  href={href}
                  className="block h-full rounded-xl border border-neutral-300 bg-white p-5 shadow-sm transition hover:border-neutral-400 hover:shadow"
                >
                  <h2 className="text-lg font-semibold text-neutral-900">{title}</h2>
                  <p className="mt-2 text-sm text-neutral-600">{description}</p>
                  <span className="mt-3 inline-block text-sm font-medium text-neutral-800 underline-offset-2 group-hover:underline">
                    Open →
                  </span>
                </Link>
              </li>
            ))}
          </ul>

          <div className="mt-10 grid gap-8 lg:grid-cols-2">
            <section>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-600">Latest inquiries</h2>
              <ul className="mt-2 max-h-80 overflow-y-auto rounded-lg border border-neutral-300 bg-white text-sm">
                {overview.recentInquiries.length === 0 ? (
                  <li className="px-3 py-2 text-neutral-500">No inquiries yet.</li>
                ) : (
                  overview.recentInquiries.map((row) => (
                    <li key={row.id} className="border-b border-neutral-100 px-3 py-2 last:border-0">
                      <p className="font-medium text-neutral-900">{row.name ?? "—"}</p>
                      <p className="text-xs text-neutral-500">{formatWhen(row.created_at)} · {row.status}</p>
                    </li>
                  ))
                )}
              </ul>
              <Link href="/dashboard/inquiries" className="mt-2 inline-block text-sm font-medium text-neutral-800 underline-offset-2 hover:underline">
                Open inquiries →
              </Link>
            </section>

            <section>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-600">Recent conversion events</h2>
              <ul className="mt-2 max-h-80 overflow-y-auto rounded-lg border border-neutral-300 bg-white text-sm">
                {overview.recentEvents.length === 0 ? (
                  <li className="px-3 py-2 text-neutral-500">No events yet.</li>
                ) : (
                  overview.recentEvents.map((ev) => (
                    <li key={ev.id} className="border-b border-neutral-100 px-3 py-2 last:border-0">
                      <p className="text-neutral-900">{ev.event_type}</p>
                      <p className="text-xs text-neutral-500">{formatWhen(ev.created_at)}</p>
                    </li>
                  ))
                )}
              </ul>
              <Link href="/dashboard/analytics" className="mt-2 inline-block text-sm font-medium text-neutral-800 underline-offset-2 hover:underline">
                Open analytics →
              </Link>
            </section>
          </div>
        </>
      )}
    </div>
  );
}
