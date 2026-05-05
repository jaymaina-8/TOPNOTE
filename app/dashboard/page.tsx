import Link from "next/link";

import {
  DashboardAlert,
  DashboardPageHeader,
  DashboardPanel,
  DashboardStatCard,
} from "@/components/dashboard/DashboardUi";
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
      <DashboardPageHeader
        eyebrow="TOPNOTE PUBLISHERS"
        title="Dashboard"
        description="Internal overview for catalog work, inquiries, and conversion signals. Writes use the Supabase service role on the server only."
      />

      {overview.ok === false ? (
        <DashboardAlert>
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
        </DashboardAlert>
      ) : (
        <>
          <ul className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <DashboardStatCard label="Open inquiries" value={overview.summary.openInquiries} tone="red" />
            <DashboardStatCard label="Total inquiries" value={overview.summary.totalInquiries} tone="sky" />
            <DashboardStatCard label="WhatsApp clicks" value={overview.summary.conversionTotals.whatsapp_click} tone="green" />
            <DashboardStatCard label="Phone clicks" value={overview.summary.conversionTotals.phone_click} tone="amber" />
          </ul>

          <ul className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
                  className="group block h-full rounded-xl border border-neutral-200 bg-white p-5 shadow-sm transition hover:border-neutral-300 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="text-base font-black text-neutral-950">{title}</h2>
                    <span className="text-primary transition-transform group-hover:translate-x-0.5" aria-hidden>
                      →
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-neutral-600">{description}</p>
                  <span className="mt-4 inline-block text-sm font-bold text-primary">Open</span>
                </Link>
              </li>
            ))}
          </ul>

          <div className="mt-8 grid gap-5 lg:grid-cols-2">
            <DashboardPanel className="overflow-hidden">
              <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-3">
                <h2 className="text-sm font-black uppercase tracking-[0.14em] text-neutral-600">Latest inquiries</h2>
                <Link href="/dashboard/inquiries" className="text-sm font-bold text-primary hover:text-primary/80">
                  Open
                </Link>
              </div>
              <ul className="max-h-80 overflow-y-auto text-sm">
                {overview.recentInquiries.length === 0 ? (
                  <li className="px-4 py-5 text-neutral-500">No inquiries yet.</li>
                ) : (
                  overview.recentInquiries.map((row) => (
                    <li key={row.id} className="flex items-start justify-between gap-3 border-b border-neutral-100 px-4 py-3 last:border-0">
                      <div>
                        <p className="font-bold text-neutral-950">{row.name ?? "—"}</p>
                        <p className="text-xs text-neutral-500">{formatWhen(row.created_at)}</p>
                      </div>
                      <span className="rounded-full bg-neutral-100 px-2 py-1 text-xs font-bold text-neutral-700">{row.status}</span>
                    </li>
                  ))
                )}
              </ul>
            </DashboardPanel>

            <DashboardPanel className="overflow-hidden">
              <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-3">
                <h2 className="text-sm font-black uppercase tracking-[0.14em] text-neutral-600">Recent events</h2>
                <Link href="/dashboard/analytics" className="text-sm font-bold text-primary hover:text-primary/80">
                  Open
                </Link>
              </div>
              <ul className="max-h-80 overflow-y-auto text-sm">
                {overview.recentEvents.length === 0 ? (
                  <li className="px-4 py-5 text-neutral-500">No events yet.</li>
                ) : (
                  overview.recentEvents.map((ev) => (
                    <li key={ev.id} className="border-b border-neutral-100 px-4 py-3 last:border-0">
                      <p className="font-bold text-neutral-950">{ev.event_type}</p>
                      <p className="text-xs text-neutral-500">{formatWhen(ev.created_at)}</p>
                    </li>
                  ))
                )}
              </ul>
            </DashboardPanel>
          </div>
        </>
      )}
    </div>
  );
}
