import Link from "next/link";

import { DashboardAlert, DashboardPageHeader, DashboardPanel, DashboardStatCard } from "@/components/dashboard/DashboardUi";
import { getAnalyticsPageData } from "@/lib/queries/analytics";

export const dynamic = "force-dynamic";

function formatWhen(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-KE", { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export default async function DashboardAnalyticsPage() {
  const result = await getAnalyticsPageData();

  if (result.ok === false && result.reason === "supabase_unconfigured") {
    return (
      <div>
        <DashboardPageHeader title="Analytics" description="Configure Supabase public URL and anon key to load analytics." />
      </div>
    );
  }

  if (result.ok === false && result.reason === "service_role_unconfigured") {
    return (
      <div>
        <DashboardPageHeader title="Analytics" />
        <DashboardAlert>
          Add <code className="rounded bg-amber-100 px-1">SUPABASE_SERVICE_ROLE_KEY</code> on the server to read conversion
          and inquiry aggregates.
        </DashboardAlert>
      </div>
    );
  }

  if (result.ok === false) {
    return (
      <div>
        <DashboardPageHeader title="Analytics" />
        <DashboardAlert tone="red">Could not load analytics. Try again later.</DashboardAlert>
      </div>
    );
  }

  const d = result.data;

  return (
    <div>
      <DashboardPageHeader
        title="Analytics"
        description="Operational view of tracked conversion events and inquiries from server-side aggregates."
      />

      <section className="mt-8">
        <h2 className="text-sm font-black uppercase tracking-[0.14em] text-neutral-600">Conversion events</h2>
        <ul className="mt-3 grid gap-3 sm:grid-cols-3">
          <DashboardStatCard label="WhatsApp clicks" value={d.conversionTotals.whatsapp_click} tone="green" />
          <DashboardStatCard label="Phone clicks" value={d.conversionTotals.phone_click} tone="amber" />
          <DashboardStatCard label="Inquiry submits" value={d.conversionTotals.inquiry_submit} tone="sky" />
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="text-sm font-black uppercase tracking-[0.14em] text-neutral-600">Inquiries</h2>
        <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <DashboardStatCard label="Total" value={d.totalInquiries} />
          <DashboardStatCard label="New" value={d.inquiryStatusTotals.new} tone="red" />
          <DashboardStatCard label="Contacted" value={d.inquiryStatusTotals.contacted} tone="amber" />
          <DashboardStatCard label="Closed" value={d.inquiryStatusTotals.closed} tone="green" />
        </ul>
      </section>

      <div className="mt-8 grid gap-5 lg:grid-cols-2">
        <DashboardPanel className="overflow-hidden">
          <PanelTitle title="Top products by events" />
          <SimpleProductTable rows={d.topProductsByEvents} empty="No event data yet." metricLabel="Events" />
        </DashboardPanel>

        <DashboardPanel className="overflow-hidden">
          <PanelTitle title="Top products by inquiries" />
          <SimpleProductTable rows={d.topProductsByInquiries} empty="No inquiry data yet." metricLabel="Inquiries" />
        </DashboardPanel>
      </div>

      <DashboardPanel className="mt-8 overflow-hidden">
        <PanelTitle title="Source pages" />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[280px] text-left text-sm">
            <thead className="border-b border-neutral-100 bg-neutral-50 text-xs font-bold uppercase tracking-[0.12em] text-neutral-500">
              <tr>
                <th className="px-4 py-3">Page</th>
                <th className="px-4 py-3 text-right">Events</th>
              </tr>
            </thead>
            <tbody>
              {d.sourcePageBreakdown.length === 0 ? (
                <tr>
                  <td className="px-4 py-4 text-neutral-500" colSpan={2}>
                    No data yet.
                  </td>
                </tr>
              ) : (
                d.sourcePageBreakdown.map((row) => (
                  <tr key={row.sourcePage} className="border-b border-neutral-100 last:border-0">
                    <td className="max-w-md truncate px-4 py-3 text-neutral-800">{row.sourcePage}</td>
                    <td className="px-4 py-3 text-right font-bold tabular-nums">{row.count}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </DashboardPanel>

      <DashboardPanel className="mt-8 overflow-hidden">
        <PanelTitle title="Recent conversion events" />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-neutral-100 bg-neutral-50 text-xs font-bold uppercase tracking-[0.12em] text-neutral-500">
              <tr>
                <th className="px-4 py-3">When</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Page</th>
                <th className="px-4 py-3">Product</th>
              </tr>
            </thead>
            <tbody>
              {d.recentEvents.length === 0 ? (
                <tr>
                  <td className="px-4 py-4 text-neutral-500" colSpan={4}>
                    No events yet.
                  </td>
                </tr>
              ) : (
                d.recentEvents.map((ev) => (
                  <tr key={ev.id} className="border-b border-neutral-100 last:border-0">
                    <td className="whitespace-nowrap px-4 py-3 text-neutral-700">{formatWhen(ev.created_at)}</td>
                    <td className="px-4 py-3 font-bold text-neutral-950">{ev.event_type}</td>
                    <td className="max-w-[200px] truncate px-4 py-3 text-neutral-600">{ev.source_page ?? "—"}</td>
                    <td className="px-4 py-3">
                      {ev.product && ev.product.slug ? (
                        <Link href={`/products/${ev.product.slug}`} className="font-bold text-primary underline-offset-4 hover:underline">
                          {ev.product.name}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </DashboardPanel>
    </div>
  );
}

function PanelTitle({ title }: { title: string }) {
  return (
    <div className="border-b border-neutral-100 px-4 py-3">
      <h2 className="text-sm font-black uppercase tracking-[0.14em] text-neutral-600">{title}</h2>
    </div>
  );
}

function SimpleProductTable({
  rows,
  empty,
  metricLabel,
}: {
  rows: { count: number; name: string; productId: string; slug: string | null }[];
  empty: string;
  metricLabel: string;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[280px] text-left text-sm">
        <thead className="border-b border-neutral-100 bg-neutral-50 text-xs font-bold uppercase tracking-[0.12em] text-neutral-500">
          <tr>
            <th className="px-4 py-3">Product</th>
            <th className="px-4 py-3 text-right">{metricLabel}</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td className="px-4 py-4 text-neutral-500" colSpan={2}>
                {empty}
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr key={`${metricLabel}-${row.productId}`} className="border-b border-neutral-100 last:border-0">
                <td className="px-4 py-3">
                  {row.slug ? (
                    <Link href={`/products/${row.slug}`} className="font-bold text-neutral-950 underline-offset-4 hover:underline">
                      {row.name}
                    </Link>
                  ) : (
                    row.name
                  )}
                </td>
                <td className="px-4 py-3 text-right font-bold tabular-nums">{row.count}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
