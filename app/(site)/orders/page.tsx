"use client";

import { useActionState } from "react";
import { lookupOrderAction, type LookupOrderState } from "@/lib/actions/submit-exam-order";
import { downloadExamPdf } from "@/lib/exams/draft-storage";
import { Container } from "@/components/ui/Container";
import { PageIntro } from "@/components/ui/PageIntro";
import { Section } from "@/components/ui/Section";
import { Button } from "@/components/ui/Button";
import { formatKesPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

const initialState: LookupOrderState = { status: "idle" };

const inputClass =
  "w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900 shadow-[var(--shadow-sm)] outline-none transition placeholder:text-neutral-400 focus:border-primary focus:ring-2 focus:ring-primary/20";

function getStatusStyles(status: string) {
  switch (status.toLowerCase()) {
    case "confirmed":
    case "delivered":
      return "bg-emerald-50 text-emerald-800 border border-emerald-200";
    case "cancelled":
      return "bg-red-50 text-red-800 border border-red-200";
    case "pending":
    case "processing":
    default:
      return "bg-amber-50 text-amber-800 border border-amber-200";
  }
}

function getStatusLabel(status: string) {
  switch (status.toLowerCase()) {
    case "pending": return "Pending Payment";
    case "contacted": return "Contacted";
    case "confirmed": return "Confirmed / Paid";
    case "processing": return "Processing";
    case "delivered": return "Delivered";
    case "cancelled": return "Cancelled";
    default: return status;
  }
}

export default function OrderLookupPage() {
  const [state, formAction, pending] = useActionState(lookupOrderAction, initialState);

  return (
    <>
      <Section className="bg-gradient-to-b from-neutral-50 via-white to-neutral-50/80 py-12 md:py-16">
        <Container className="max-w-6xl">
          <PageIntro
            align="center"
            title="Order Lookup"
            subtitle="Track your exam order status and download your PDF invoice/order summary."
          />
        </Container>
      </Section>

      <Section surface="canvas" className="py-12 md:py-16">
        <Container className="max-w-3xl">
          {state.status !== "success" ? (
            <div className="overflow-hidden rounded-3xl border border-neutral-200 border-t-4 border-t-primary bg-white p-6 shadow-[var(--shadow-sm)] sm:p-10">
              <h2 className="text-xl font-black text-neutral-950 mb-2">Find Your Order</h2>
              <p className="text-sm text-neutral-500 mb-6">
                Enter your official order number and the phone number used when placing the order.
              </p>

              <form action={formAction} className="space-y-6">
                {state.status === "error" && (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-950">
                    {state.error}
                  </div>
                )}

                <div className="space-y-2">
                  <label htmlFor="order_number" className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                    Order Number
                  </label>
                  <input
                    id="order_number"
                    name="order_number"
                    type="text"
                    required
                    placeholder="e.g. TN-EX-2026-0001"
                    className={inputClass}
                    autoFocus
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="phone" className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                    Phone Number
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    required
                    placeholder="e.g. 0712345678"
                    className={inputClass}
                  />
                </div>

                <button
                  type="submit"
                  disabled={pending}
                  className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-neutral-950 px-8 text-sm font-bold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50 shadow-md"
                >
                  {pending ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4}></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Looking up...
                    </span>
                  ) : (
                    "Look Up Order"
                  )}
                </button>
              </form>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Order Status Card */}
              <div className="overflow-hidden rounded-3xl border border-neutral-200 bg-white p-6 shadow-[var(--shadow-sm)] sm:p-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-neutral-100 pb-5 mb-5">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">Order Found</span>
                    <h2 className="text-2xl font-black text-neutral-950 tracking-tight mt-1">{state.orderNumber}</h2>
                  </div>
                  <span className={cn("inline-flex items-center rounded-lg px-3 py-1.5 text-xs font-bold tracking-wide uppercase self-start sm:self-center", getStatusStyles(state.statusLabel))}>
                    {getStatusLabel(state.statusLabel)}
                  </span>
                </div>

                <div className="grid gap-6 sm:grid-cols-2 text-sm">
                  <div>
                    <h3 className="font-bold text-neutral-400 uppercase tracking-wider text-[10px] mb-1">School Details</h3>
                    <p className="font-black text-neutral-900">{state.schoolName}</p>
                    <p className="text-neutral-500 mt-0.5">{state.contactPerson} · {state.phone}</p>
                  </div>
                  <div>
                    <h3 className="font-bold text-neutral-400 uppercase tracking-wider text-[10px] mb-1">Delivery Details</h3>
                    <p className="font-semibold text-neutral-900">{state.deliveryLocation}</p>
                    <p className="text-neutral-500 mt-0.5">{state.county} County</p>
                  </div>
                </div>

                <div className="mt-6 border-t border-neutral-100 pt-5">
                  <h3 className="font-bold text-neutral-400 uppercase tracking-wider text-[10px] mb-3">Order Items</h3>
                  <div className="divide-y divide-neutral-100 overflow-hidden rounded-2xl border border-neutral-100 bg-neutral-50/50">
                    {state.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between px-4 py-3 text-sm">
                        <span className="font-semibold text-neutral-800">{item.class_label}</span>
                        <span className="font-mono text-neutral-500">{item.quantity} Students</span>
                      </div>
                    ))}
                    <div className="flex justify-between border-t border-neutral-200 bg-neutral-100/50 px-4 py-4 text-base font-bold">
                      <span className="text-neutral-950">Total Amount</span>
                      <span className="text-primary font-black">{formatKesPrice(state.totalAmount)}</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-8 flex flex-col gap-3 sm:flex-row border-t border-neutral-100 pt-6">
                  <Button
                    onClick={() => downloadExamPdf(state.downloadToken)}
                    className="min-h-12 flex-1"
                  >
                    Download PDF
                  </Button>
                  <a
                    href={state.whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-12 items-center justify-center rounded-xl bg-[#25D366] px-6 text-sm font-bold text-white transition hover:bg-[#1fb855] flex-1"
                  >
                    Send via WhatsApp
                  </a>
                  <Button
                    variant="outline"
                    onClick={() => window.location.reload()}
                    className="min-h-12 flex-1"
                  >
                    Look Up Another
                  </Button>
                </div>
              </div>

              {/* Payment Info Card */}
              <div className="rounded-3xl border border-blue-200 bg-blue-50/50 p-6 sm:p-8">
                <h3 className="text-lg font-bold text-blue-950 mb-3">M-Pesa Payment Guidelines</h3>
                <p className="text-sm text-blue-900 mb-5 leading-relaxed">
                  If you have not paid yet, please complete your transaction using the Paybill details below. Reference the order number in your payment message.
                </p>
                <div className="space-y-3">
                  <div className="flex items-center justify-between rounded-2xl bg-white p-4 shadow-sm border border-blue-100/50">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">PAYBILL</p>
                      <p className="font-mono text-lg font-black text-neutral-900 mt-0.5">247247</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => navigator.clipboard.writeText("247247")}
                      className="flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700 transition hover:bg-blue-100"
                    >
                      Copy
                    </button>
                  </div>
                  <div className="flex items-center justify-between rounded-2xl bg-white p-4 shadow-sm border border-blue-100/50">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">ACCOUNT NUMBER</p>
                      <p className="font-mono text-lg font-black text-neutral-900 mt-0.5">0712430992</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => navigator.clipboard.writeText("0712430992")}
                      className="flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700 transition hover:bg-blue-100"
                    >
                      Copy
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </Container>
      </Section>
    </>
  );
}
