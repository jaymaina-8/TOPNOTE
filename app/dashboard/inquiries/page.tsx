import Link from "next/link";

import { updateInquiryStatusAction } from "@/lib/actions/update-inquiry-status";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { getInquiries } from "@/lib/queries/inquiries";
import type { InquiryStatus, SourceType } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

function formatInquiryDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-KE", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function statusBadgeClass(status: InquiryStatus): string {
  switch (status) {
    case "new":
      return "border-sky-200 bg-sky-50 text-sky-950";
    case "contacted":
      return "border-amber-200 bg-amber-50 text-amber-950";
    case "closed":
      return "border-neutral-200 bg-neutral-100 text-neutral-800";
    default:
      return "border-neutral-200 bg-neutral-50 text-neutral-800";
  }
}

function formatSourceType(t: SourceType | null): string {
  if (!t) return "—";
  switch (t) {
    case "product":
      return "Product";
    case "contact":
      return "Contact";
    case "general":
      return "General";
    default:
      return t;
  }
}

export default async function DashboardInquiriesPage() {
  const result = await getInquiries();

  return (
    <Section>
      <Container>
        <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-500">
          <span>Internal — not linked from the public site.</span>
          <Link href="/dashboard" className="font-medium text-neutral-700 underline-offset-2 hover:underline">
            Dashboard home
          </Link>
        </div>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-neutral-900">Inquiries</h1>
        <p className="mt-2 max-w-2xl text-sm text-neutral-600">
          Submissions from contact and product inquiry forms. Conversion events (WhatsApp, phone, form) are logged when
          the service role is configured. Newest first.
        </p>

        {result.ok === false && result.reason === "supabase_unconfigured" ? (
          <div className="mt-8 rounded-xl border border-amber-200/80 bg-amber-50 px-4 py-3 text-sm text-amber-950">
            Supabase is not configured. Set <code className="rounded bg-amber-100 px-1">NEXT_PUBLIC_SUPABASE_URL</code>{" "}
            and <code className="rounded bg-amber-100 px-1">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to load inquiries.
          </div>
        ) : null}

        {result.ok === false && result.reason === "service_role_unconfigured" ? (
          <div className="mt-8 rounded-xl border border-amber-200/80 bg-amber-50 px-4 py-3 text-sm text-amber-950">
            Listing inquiries requires a server-only service role key. Add{" "}
            <code className="rounded bg-amber-100 px-1">SUPABASE_SERVICE_ROLE_KEY</code> to your environment (never
            expose it to the client). The anon key cannot read <code className="rounded bg-amber-100 px-1">inquiries</code>{" "}
            under current RLS.
          </div>
        ) : null}

        {result.ok === false && result.reason === "query_failed" ? (
          <div className="mt-8 rounded-xl border border-red-200/80 bg-red-50 px-4 py-3 text-sm text-red-900">
            Could not load inquiries. Check the server logs and your Supabase project (run Phase 5 migration if columns
            are missing).
          </div>
        ) : null}

        {result.ok && result.inquiries.length === 0 ? (
          <div className="mt-8 overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm flex flex-col items-center justify-center px-8 py-20 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-400">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-8 w-8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 13.5h3.86a2.25 2.25 0 0 1 2.008 1.24l.885 1.77a2.25 2.25 0 0 0 2.007 1.24h1.98a2.25 2.25 0 0 0 2.007-1.24l.885-1.77a2.25 2.25 0 0 1 2.007-1.24h3.86m-18 0h18" />
              </svg>
            </div>
            <h3 className="mt-4 text-sm font-black text-neutral-900">Inbox is empty</h3>
            <p className="mt-1.5 text-xs text-neutral-500 max-w-[240px]">
              No customer inquiries or conversion logs found in the system.
            </p>
          </div>
        ) : null}

        {result.ok && result.inquiries.length > 0 ? (
          <ul className="mt-8 space-y-4">
            {result.inquiries.map((row) => {
              const status = (row.status ?? "new") as InquiryStatus;
              return (
                <li
                  key={row.id}
                  className="rounded-xl border border-neutral-200/80 bg-white p-5 shadow-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusBadgeClass(status)}`}
                      >
                        {status}
                      </span>
                      <span className="text-xs text-neutral-500">{formatInquiryDate(row.created_at)}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {status === "new" ? (
                        <form action={updateInquiryStatusAction}>
                          <input type="hidden" name="inquiry_id" value={row.id} />
                          <input type="hidden" name="next_status" value="contacted" />
                          <button
                            type="submit"
                            className="rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-xs font-medium text-neutral-800 shadow-sm hover:bg-neutral-50"
                          >
                            Mark contacted
                          </button>
                        </form>
                      ) : null}
                      {status === "contacted" ? (
                        <form action={updateInquiryStatusAction}>
                          <input type="hidden" name="inquiry_id" value={row.id} />
                          <input type="hidden" name="next_status" value="closed" />
                          <button
                            type="submit"
                            className="rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-xs font-medium text-neutral-800 shadow-sm hover:bg-neutral-50"
                          >
                            Mark closed
                          </button>
                        </form>
                      ) : null}
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm text-neutral-700">
                    <p>
                      <span className="font-medium text-neutral-800">Source type:</span>{" "}
                      {formatSourceType(row.source_type)}
                    </p>
                    <p>
                      <span className="font-medium text-neutral-800">Source page:</span>{" "}
                      {row.source_page?.trim() ? (
                        <code className="rounded bg-neutral-100 px-1 text-xs text-neutral-900">{row.source_page}</code>
                      ) : (
                        "—"
                      )}
                    </p>
                  </div>

                  <div className="mt-2">
                    {row.products ? (
                      <p className="text-sm text-neutral-700">
                        <span className="font-medium text-neutral-900">Product:</span>{" "}
                        <Link
                          href={`/products/${row.products.slug}`}
                          className="text-primary underline-offset-4 hover:underline"
                        >
                          {row.products.name}
                        </Link>
                      </p>
                    ) : row.source_product_id ? (
                      <p className="text-sm text-neutral-500">Product ID: {row.source_product_id}</p>
                    ) : (
                      <p className="text-sm text-neutral-500">No product linked</p>
                    )}
                  </div>

                  <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                    <p>
                      <span className="font-medium text-neutral-800">Name:</span>{" "}
                      <span className="text-neutral-700">{row.name?.trim() ? row.name : "—"}</span>
                    </p>
                    <p>
                      <span className="font-medium text-neutral-800">Phone:</span>{" "}
                      <span className="text-neutral-700">{row.phone?.trim() ? row.phone : "—"}</span>
                    </p>
                  </div>
                  <div className="mt-4 border-t border-neutral-100 pt-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">Message</p>
                    <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-neutral-800">{row.message}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : null}
      </Container>
    </Section>
  );
}
