import Link from "next/link";
import { notFound } from "next/navigation";

import { DashboardButton, DashboardPageHeader, DashboardPanel } from "@/components/dashboard/DashboardUi";
import { getExamOrderByIdAdmin } from "@/lib/queries/exams";
import { formatKesPrice } from "@/lib/format";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

function formatOrderDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-KE", {
      dateStyle: "long",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export default async function DashboardOrderDetailPage({ params }: PageProps) {
  const { id } = await params;
  const order = await getExamOrderByIdAdmin(id);
  if (!order) notFound();

  const lineItems = order.items.filter((item) => item.quantity > 0);

  return (
    <div>
      <DashboardPageHeader
        title={order.order_number}
        description={`Submitted ${formatOrderDate(order.created_at)} · ${order.exam_sessions?.name ?? "Unknown session"}`}
        actions={
          <>
            <DashboardButton href={`/api/exam-orders/${order.id}/pdf`} variant="secondary">
              Download PDF
            </DashboardButton>
            <DashboardButton href="/dashboard/orders" variant="secondary">
              Back to orders
            </DashboardButton>
          </>
        }
      />

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <DashboardPanel className="p-6">
          <h2 className="text-lg font-black text-neutral-950">School details</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div>
              <dt className="font-bold text-neutral-800">School</dt>
              <dd className="text-neutral-700">{order.school_name}</dd>
            </div>
            <div>
              <dt className="font-bold text-neutral-800">Contact person</dt>
              <dd className="text-neutral-700">{order.contact_person}</dd>
            </div>
            <div>
              <dt className="font-bold text-neutral-800">Phone</dt>
              <dd className="text-neutral-700">{order.phone}</dd>
            </div>
            <div>
              <dt className="font-bold text-neutral-800">County</dt>
              <dd className="text-neutral-700">{order.county}</dd>
            </div>
            <div>
              <dt className="font-bold text-neutral-800">Delivery location</dt>
              <dd className="text-neutral-700">{order.delivery_location}</dd>
            </div>
            {order.additional_notes?.trim() ? (
              <div>
                <dt className="font-bold text-neutral-800">Additional notes</dt>
                <dd className="whitespace-pre-wrap text-neutral-700">{order.additional_notes}</dd>
              </div>
            ) : null}
          </dl>
        </DashboardPanel>

        <DashboardPanel className="overflow-hidden">
          <div className="border-b border-neutral-100 px-4 py-4">
            <h2 className="text-lg font-black text-neutral-950">Order breakdown</h2>
            <p className="mt-1 text-sm text-neutral-600">
              {order.total_papers} papers · {formatKesPrice(Number(order.total_amount))} ·{" "}
              <span className="font-bold capitalize">{order.status}</span>
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-neutral-50 text-xs font-bold uppercase tracking-[0.12em] text-neutral-500">
                <tr>
                  <th className="px-4 py-3 text-left">Class</th>
                  <th className="px-4 py-3 text-left">Unit price</th>
                  <th className="px-4 py-3 text-left">Qty</th>
                  <th className="px-4 py-3 text-left">Line total</th>
                </tr>
              </thead>
              <tbody>
                {lineItems.map((item) => (
                  <tr key={item.class_key} className="border-t border-neutral-100">
                    <td className="px-4 py-3">{item.class_label}</td>
                    <td className="px-4 py-3">{formatKesPrice(item.unit_price)}</td>
                    <td className="px-4 py-3">{item.quantity}</td>
                    <td className="px-4 py-3 font-bold">{formatKesPrice(item.line_total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DashboardPanel>
      </div>

      <p className="mt-6 text-sm text-neutral-600">
        Need to change status? Use the orders list or{" "}
        <Link href="/dashboard/orders" className="font-bold text-primary underline-offset-2 hover:underline">
          return to orders
        </Link>
        .
      </p>
    </div>
  );
}
