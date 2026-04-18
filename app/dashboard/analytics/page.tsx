import Link from "next/link";

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
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Analytics</h1>
        <p className="mt-2 text-sm text-neutral-600">Configure Supabase public URL and anon key to load analytics.</p>
      </div>
    );
  }

  if (result.ok === false && result.reason === "service_role_unconfigured") {
    return (
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Analytics</h1>
        <p className="mt-2 text-sm text-neutral-600">
          Add <code className="rounded bg-neutral-200 px-1">SUPABASE_SERVICE_ROLE_KEY</code> on the server to read
          conversion and inquiry aggregates.
        </p>
      </div>
    );
  }

  if (result.ok === false) {
    return (
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Analytics</h1>
        <p className="mt-2 text-sm text-red-800">Could not load analytics. Try again later.</p>
      </div>
    );
  }

  const d = result.data;

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Analytics</h1>
      <p className="mt-2 max-w-2xl text-sm text-neutral-600">
        Operational view of tracked conversion events and inquiries (server-side aggregates).
      </p>

      <section className="mt-8">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-600">Conversion events</h2>
        <ul className="mt-3 grid gap-3 sm:grid-cols-3">
          <li className="rounded-lg border border-neutral-300 bg-white p-4 shadow-sm">
            <p className="text-xs text-neutral-500">WhatsApp clicks</p>
            <p className="text-2xl font-semibold tabular-nums text-neutral-900">{d.conversionTotals.whatsapp_click}</p>
          </li>
          <li className="rounded-lg border border-neutral-300 bg-white p-4 shadow-sm">
            <p className="text-xs text-neutral-500">Phone clicks</p>
            <p className="text-2xl font-semibold tabular-nums text-neutral-900">{d.conversionTotals.phone_click}</p>
          </li>
          <li className="rounded-lg border border-neutral-300 bg-white p-4 shadow-sm">
            <p className="text-xs text-neutral-500">Inquiry submits (tracked)</p>
            <p className="text-2xl font-semibold tabular-nums text-neutral-900">{d.conversionTotals.inquiry_submit}</p>
          </li>
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-600">Inquiries</h2>
        <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <li className="rounded-lg border border-neutral-300 bg-white p-4 shadow-sm">
            <p className="text-xs text-neutral-500">Total</p>
            <p className="text-2xl font-semibold tabular-nums text-neutral-900">{d.totalInquiries}</p>
          </li>
          <li className="rounded-lg border border-neutral-300 bg-white p-4 shadow-sm">
            <p className="text-xs text-neutral-500">New</p>
            <p className="text-2xl font-semibold tabular-nums text-neutral-900">{d.inquiryStatusTotals.new}</p>
          </li>
          <li className="rounded-lg border border-neutral-300 bg-white p-4 shadow-sm">
            <p className="text-xs text-neutral-500">Contacted</p>
            <p className="text-2xl font-semibold tabular-nums text-neutral-900">{d.inquiryStatusTotals.contacted}</p>
          </li>
          <li className="rounded-lg border border-neutral-300 bg-white p-4 shadow-sm">
            <p className="text-xs text-neutral-500">Closed</p>
            <p className="text-2xl font-semibold tabular-nums text-neutral-900">{d.inquiryStatusTotals.closed}</p>
          </li>
        </ul>
      </section>

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-600">Top products (events)</h2>
          <div className="mt-2 overflow-x-auto rounded-lg border border-neutral-300 bg-white">
            <table className="w-full min-w-[280px] text-left text-sm">
              <thead className="border-b border-neutral-200 bg-neutral-50 text-xs uppercase text-neutral-600">
                <tr>
                  <th className="px-3 py-2">Product</th>
                  <th className="px-3 py-2 text-right">Events</th>
                </tr>
              </thead>
              <tbody>
                {d.topProductsByEvents.length === 0 ? (
                  <tr>
                    <td className="px-3 py-3 text-neutral-500" colSpan={2}>
                      No data yet.
                    </td>
                  </tr>
                ) : (
                  d.topProductsByEvents.map((row) => (
                    <tr key={row.productId} className="border-b border-neutral-100">
                      <td className="px-3 py-2">
                        {row.slug ? (
                          <Link href={`/products/${row.slug}`} className="text-neutral-900 underline-offset-2 hover:underline">
                            {row.name}
                          </Link>
                        ) : (
                          row.name
                        )}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">{row.count}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-600">Top products (inquiries)</h2>
          <div className="mt-2 overflow-x-auto rounded-lg border border-neutral-300 bg-white">
            <table className="w-full min-w-[280px] text-left text-sm">
              <thead className="border-b border-neutral-200 bg-neutral-50 text-xs uppercase text-neutral-600">
                <tr>
                  <th className="px-3 py-2">Product</th>
                  <th className="px-3 py-2 text-right">Inquiries</th>
                </tr>
              </thead>
              <tbody>
                {d.topProductsByInquiries.length === 0 ? (
                  <tr>
                    <td className="px-3 py-3 text-neutral-500" colSpan={2}>
                      No data yet.
                    </td>
                  </tr>
                ) : (
                  d.topProductsByInquiries.map((row) => (
                    <tr key={`inq-${row.productId}`} className="border-b border-neutral-100">
                      <td className="px-3 py-2">
                        {row.slug ? (
                          <Link href={`/products/${row.slug}`} className="text-neutral-900 underline-offset-2 hover:underline">
                            {row.name}
                          </Link>
                        ) : (
                          row.name
                        )}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">{row.count}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <section className="mt-10">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-600">Source pages (events)</h2>
        <div className="mt-2 overflow-x-auto rounded-lg border border-neutral-300 bg-white">
          <table className="w-full min-w-[280px] text-left text-sm">
            <thead className="border-b border-neutral-200 bg-neutral-50 text-xs uppercase text-neutral-600">
              <tr>
                <th className="px-3 py-2">Page</th>
                <th className="px-3 py-2 text-right">Events</th>
              </tr>
            </thead>
            <tbody>
              {d.sourcePageBreakdown.length === 0 ? (
                <tr>
                  <td className="px-3 py-3 text-neutral-500" colSpan={2}>
                    No data yet.
                  </td>
                </tr>
              ) : (
                d.sourcePageBreakdown.map((row) => (
                  <tr key={row.sourcePage} className="border-b border-neutral-100">
                    <td className="max-w-md truncate px-3 py-2 text-neutral-800">{row.sourcePage}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{row.count}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-600">Recent conversion events</h2>
        <div className="mt-2 overflow-x-auto rounded-lg border border-neutral-300 bg-white">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-neutral-200 bg-neutral-50 text-xs uppercase text-neutral-600">
              <tr>
                <th className="px-3 py-2">When</th>
                <th className="px-3 py-2">Type</th>
                <th className="px-3 py-2">Page</th>
                <th className="px-3 py-2">Product</th>
              </tr>
            </thead>
            <tbody>
              {d.recentEvents.length === 0 ? (
                <tr>
                  <td className="px-3 py-3 text-neutral-500" colSpan={4}>
                    No events yet.
                  </td>
                </tr>
              ) : (
                d.recentEvents.map((ev) => (
                  <tr key={ev.id} className="border-b border-neutral-100">
                    <td className="whitespace-nowrap px-3 py-2 text-neutral-700">{formatWhen(ev.created_at)}</td>
                    <td className="px-3 py-2">{ev.event_type}</td>
                    <td className="max-w-[200px] truncate px-3 py-2 text-neutral-600">{ev.source_page ?? "—"}</td>
                    <td className="px-3 py-2">
                      {ev.product && ev.product.slug ? (
                        <Link href={`/products/${ev.product.slug}`} className="underline-offset-2 hover:underline">
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
      </section>
    </div>
  );
}
