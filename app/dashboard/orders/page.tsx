import Link from "next/link";

import { DeleteWithConfirm } from "@/components/admin/DeleteWithConfirm";
import { DashboardAlert, DashboardEmptyState, DashboardPageHeader, DashboardPanel } from "@/components/dashboard/DashboardUi";
import { deleteExamOrderAction, updateExamOrderStatusAction } from "@/lib/actions/admin/exam-orders";
import { getExamOrders } from "@/lib/queries/exams";
import type { ExamOrderStatus } from "@/lib/exams/types";
import { formatKesPrice } from "@/lib/format";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ error?: string }>;
};

const ORDER_STATUSES: ExamOrderStatus[] = [
  "pending",
  "contacted",
  "confirmed",
  "processing",
  "delivered",
  "cancelled",
];

function formatOrderDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-KE", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function statusBadgeClass(status: ExamOrderStatus): string {
  switch (status) {
    case "pending":
      return "border-sky-200 bg-sky-50 text-sky-950";
    case "contacted":
      return "border-amber-200 bg-amber-50 text-amber-950";
    case "confirmed":
      return "border-indigo-200 bg-indigo-50 text-indigo-950";
    case "processing":
      return "border-violet-200 bg-violet-50 text-violet-950";
    case "delivered":
      return "border-emerald-200 bg-emerald-50 text-emerald-950";
    case "cancelled":
      return "border-neutral-200 bg-neutral-100 text-neutral-700";
    default:
      return "border-neutral-200 bg-neutral-50 text-neutral-800";
  }
}

function pdfStatusBadgeClass(failed: boolean, path: string | null, attempts: number): string {
  if (path) return "border-emerald-200 bg-emerald-50 text-emerald-950";
  if (failed) return "border-red-200 bg-red-50 text-red-950";
  if (attempts > 0) return "border-amber-200 bg-amber-50 text-amber-950 animate-pulse";
  return "border-sky-200 bg-sky-50 text-sky-950";
}

function getPdfStatusLabel(failed: boolean, path: string | null, attempts: number): string {
  if (path) return "Ready";
  if (failed) return "Failed";
  if (attempts > 0) return "Generating";
  return "Pending";
}

export default async function DashboardOrdersPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const result = await getExamOrders();

  return (
    <div>
      <DashboardPageHeader
        title="Orders"
        description="Exam orders submitted through the public ordering page. Every generated order is stored, even if WhatsApp is not sent."
      />

      {sp.error === "status" ? <DashboardAlert tone="red">Could not update order status. Try again.</DashboardAlert> : null}
      {sp.error === "delete" ? <DashboardAlert tone="red">Could not delete that order. Try again.</DashboardAlert> : null}

      {result.ok === false && result.reason === "service_role_unconfigured" ? (
        <DashboardAlert>
          Add <code className="rounded bg-amber-100 px-1">SUPABASE_SERVICE_ROLE_KEY</code> to manage exam orders.
        </DashboardAlert>
      ) : null}

      {result.ok === false && result.reason === "query_failed" ? (
        <DashboardAlert tone="red">
          Could not load orders. Run the exam ordering migration if tables are missing.
        </DashboardAlert>
      ) : null}

      {result.ok && result.orders.length === 0 ? (
        <div className="mt-8">
          <DashboardEmptyState title="No exam orders yet" description="Orders appear here after schools generate them on /exams." />
        </div>
      ) : null}

      {result.ok && result.orders.length > 0 ? (
        <div className="mt-8 overflow-x-auto rounded-xl border border-neutral-200 bg-white shadow-sm">
          <table className="min-w-[920px] w-full text-left text-sm">
            <thead className="border-b border-neutral-100 bg-neutral-50 text-xs font-bold uppercase tracking-[0.12em] text-neutral-500">
              <tr>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">School</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Session</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">PDF Status</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {result.orders.map((order) => (
                <tr key={order.id} className="border-b border-neutral-100 last:border-0">
                  <td className="px-4 py-4 align-top">
                    <p className="font-bold text-neutral-950">{order.order_number}</p>
                    <p className="mt-1 text-xs text-neutral-500">{order.total_papers} students</p>
                  </td>
                  <td className="px-4 py-4 align-top">
                    <p className="font-medium text-neutral-900">{order.school_name}</p>
                    <p className="mt-1 text-xs text-neutral-500">{order.contact_person}</p>
                  </td>
                  <td className="px-4 py-4 align-top text-neutral-700">{order.phone}</td>
                  <td className="px-4 py-4 align-top text-neutral-700">{order.exam_sessions?.name ?? "—"}</td>
                  <td className="px-4 py-4 align-top font-bold text-neutral-950">
                    {formatKesPrice(Number(order.total_amount))}
                  </td>
                  <td className="px-4 py-4 align-top">
                    <span
                      className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-bold ${statusBadgeClass(order.status)}`}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 align-top">
                    <span
                      className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-bold ${pdfStatusBadgeClass(
                        order.pdf_generation_failed || false,
                        order.pdf_storage_path,
                        order.pdf_generation_attempts || 0
                      )}`}
                    >
                      {getPdfStatusLabel(
                        order.pdf_generation_failed || false,
                        order.pdf_storage_path,
                        order.pdf_generation_attempts || 0
                      )}
                    </span>
                  </td>
                  <td className="px-4 py-4 align-top text-xs text-neutral-500">{formatOrderDate(order.created_at)}</td>
                  <td className="px-4 py-4 align-top">
                    <div className="flex min-w-[220px] flex-col gap-2">
                      <Link
                        href={`/dashboard/orders/${order.id}`}
                        className="rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-center text-xs font-bold text-neutral-800 hover:bg-neutral-50"
                      >
                        View
                      </Link>
                      <a
                        href={`/api/exam-orders/${order.id}/pdf`}
                        className="rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-center text-xs font-bold text-neutral-800 hover:bg-neutral-50"
                      >
                        Download PDF
                      </a>
                      <form action={updateExamOrderStatusAction} className="flex gap-2">
                        <input type="hidden" name="order_id" value={order.id} />
                        <select
                          name="next_status"
                          defaultValue={order.status}
                          className="min-w-0 flex-1 rounded-lg border border-neutral-200 bg-white px-2 py-1.5 text-xs font-semibold text-neutral-800"
                        >
                          {ORDER_STATUSES.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                        <button
                          type="submit"
                          className="rounded-lg border border-neutral-200 bg-white px-2 py-1.5 text-xs font-bold text-neutral-800 hover:bg-neutral-50"
                        >
                          Save
                        </button>
                      </form>
                      <DeleteWithConfirm
                        action={deleteExamOrderAction}
                        id={order.id}
                        idFieldName="order_id"
                        confirmMessage={`Delete order ${order.order_number}?`}
                      >
                        <button
                          type="submit"
                          className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-bold text-red-700 hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </DeleteWithConfirm>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
