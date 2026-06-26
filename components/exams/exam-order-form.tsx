"use client";

import { useActionState, useEffect, useMemo } from "react";
import { submitExamOrderAction, type SubmitExamOrderState } from "@/lib/actions/submit-exam-order";
import type { GeneratedExamOrder } from "@/lib/exams/draft-storage";
import { EXAM_CLASSES } from "@/lib/exams/classes";
import { formatKesPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ExamSessionWithPrices } from "@/lib/exams/types";

const initialState: SubmitExamOrderState = { status: "idle" };

const inputClass =
  "w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900 shadow-[var(--shadow-sm)] outline-none transition placeholder:text-neutral-400 focus:border-primary focus:ring-2 focus:ring-primary/20";

const qtyInputClass =
  "w-full min-w-[72px] rounded-xl border border-neutral-200 bg-white px-3 py-3 text-center text-base font-bold text-neutral-900 shadow-[var(--shadow-sm)] outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20";

type ExamOrderFormProps = {
  session: ExamSessionWithPrices;
  priceMap: Record<string, number>;
  schoolName: string;
  contactPerson: string;
  phoneNumber: string;
  county: string;
  deliveryLocation: string;
  additionalNotes: string;
  onSchoolNameChange: (value: string) => void;
  onContactPersonChange: (value: string) => void;
  onPhoneNumberChange: (value: string) => void;
  onCountyChange: (value: string) => void;
  onDeliveryLocationChange: (value: string) => void;
  onAdditionalNotesChange: (value: string) => void;
  quantities: Record<string, number>;
  updateQuantity: (classKey: string, value: string) => void;
  totals: { totalPapers: number; totalAmount: number };
  generatedOrder: GeneratedExamOrder | null;
  draftRestored: boolean;
  onGeneratedOrder: (order: GeneratedExamOrder) => void;
  onStartNewOrder: () => void;
};

export function ExamOrderForm({
  session,
  priceMap,
  schoolName,
  contactPerson,
  phoneNumber,
  county,
  deliveryLocation,
  additionalNotes,
  onSchoolNameChange,
  onContactPersonChange,
  onPhoneNumberChange,
  onCountyChange,
  onDeliveryLocationChange,
  onAdditionalNotesChange,
  quantities,
  updateQuantity,
  totals,
  generatedOrder,
  draftRestored,
  onGeneratedOrder,
  onStartNewOrder,
}: ExamOrderFormProps) {
  const [state, formAction, pending] = useActionState(submitExamOrderAction, initialState);

  useEffect(() => {
    if (state.status !== "success") return;
    onGeneratedOrder({
      orderId: state.orderId,
      orderNumber: state.orderNumber,
      sessionName: state.sessionName,
      totalPapers: state.totalPapers,
      totalAmount: state.totalAmount,
      pdfUrl: state.pdfUrl,
      whatsappUrl: state.whatsappUrl,
      timestamp: Date.now(),
    });
  }, [state, onGeneratedOrder]);

  const activeOrder = useMemo<GeneratedExamOrder | null>(() => {
    if (state.status === "success") {
      return {
        orderId: state.orderId,
        orderNumber: state.orderNumber,
        sessionName: state.sessionName,
        totalPapers: state.totalPapers,
        totalAmount: state.totalAmount,
        pdfUrl: state.pdfUrl,
        whatsappUrl: state.whatsappUrl,
        timestamp: generatedOrder?.orderId === state.orderId ? generatedOrder.timestamp : 0,
      };
    }
    return generatedOrder;
  }, [generatedOrder, state]);

  const showingRecoveredOrder = state.status !== "success" && Boolean(generatedOrder);

  return (
    <section className="overflow-hidden rounded-3xl border border-neutral-200 border-t-4 border-t-primary bg-white p-5 shadow-[var(--shadow-sm)] sm:p-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-neutral-100 pb-6 mb-8 gap-4">
        <div className="max-w-xl">
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center rounded-md bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary tracking-wide uppercase">
              Official Order Form
            </span>
            <span className="text-xs text-neutral-400 font-medium">TopNote Examination Centre</span>
          </div>
          <h2 className="text-2xl font-black tracking-tight text-neutral-950 md:text-3xl">Digital Order Sheet</h2>
          <p className="mt-2 text-sm leading-relaxed text-neutral-600">
            Fill in your school details and exam quantities. Totals update instantly as you type.
          </p>
        </div>
        <div className="shrink-0 rounded-2xl bg-neutral-50 px-4 py-3 border border-neutral-200/60 hidden md:block text-right">
          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">Form ID</span>
          <span className="text-sm font-black text-neutral-700 tracking-mono">TN-EX-2026</span>
        </div>
      </div>

      {draftRestored ? (
        <div className="mb-6 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900" role="status">
          Draft restored successfully.
        </div>
      ) : null}

      {activeOrder ? (
        <div className="mb-8 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 sm:p-6">
          <p className="text-sm font-bold uppercase tracking-[0.14em] text-emerald-800">
            {showingRecoveredOrder ? "You have a recent order." : "Order created successfully"}
          </p>
          <p className="mt-2 text-2xl font-black text-emerald-950">{activeOrder.orderNumber}</p>
          <p className="mt-2 text-sm text-emerald-900">
            {schoolName || "Your school"} · {activeOrder.sessionName}
          </p>
          <p className="mt-1 text-sm text-emerald-900">
            {activeOrder.totalPapers} papers · {formatKesPrice(activeOrder.totalAmount)}
          </p>
          <p className="mt-3 rounded-lg border border-emerald-200 bg-white/80 px-3 py-2 text-xs leading-relaxed text-emerald-900">
            WhatsApp does not allow websites to attach files automatically. Dashboard administrators can download the PDF from the orders dashboard and share it when needed.
          </p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <a
              href={activeOrder.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-12 items-center justify-center rounded-xl bg-[#25D366] px-5 text-sm font-bold text-white transition hover:bg-[#1fb855]"
            >
              Send via WhatsApp
            </a>
            <button
              type="button"
              onClick={onStartNewOrder}
              className="inline-flex min-h-12 items-center justify-center rounded-xl border border-emerald-300 bg-white px-5 text-sm font-bold text-emerald-900 transition hover:bg-emerald-100"
            >
              {showingRecoveredOrder ? "Clear Order" : "Start New Order"}
            </button>
          </div>
        </div>
      ) : null}

      {state.status === "error" ? (
        <div className="mb-8 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900" role="alert">
          {state.error}
        </div>
      ) : null}

      <form action={formAction} className="space-y-8">
        <input type="hidden" name="session_id" value={session.id} />
        {EXAM_CLASSES.map(({ key }) => (
          <input key={key} type="hidden" name={`price_${key}`} value={priceMap[key] ?? 0} />
        ))}

        {/* Section 1: School & Delivery Details */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">1</span>
            <h3 className="text-base font-bold text-neutral-900">School & Delivery Details</h3>
          </div>
          
          <div className="grid gap-5 md:grid-cols-2 bg-neutral-50/50 rounded-2xl p-5 border border-neutral-100">
            <div>
              <label htmlFor="school_name" className="block text-xs font-bold uppercase tracking-wider text-neutral-700">
                School Name <span className="text-red-600">*</span>
              </label>
              <input
                id="school_name"
                name="school_name"
                required
                className={cn(inputClass, "mt-1.5 focus:bg-white")}
                disabled={pending}
                placeholder="e.g. Greenwood Academy"
                value={schoolName}
                onChange={(event) => onSchoolNameChange(event.target.value)}
              />
            </div>
            <div>
              <label htmlFor="contact_person" className="block text-xs font-bold uppercase tracking-wider text-neutral-700">
                Contact Person <span className="text-red-600">*</span>
              </label>
              <input
                id="contact_person"
                name="contact_person"
                required
                className={cn(inputClass, "mt-1.5 focus:bg-white")}
                disabled={pending}
                placeholder="e.g. Principal / Head Teacher"
                value={contactPerson}
                onChange={(event) => onContactPersonChange(event.target.value)}
              />
            </div>
            <div>
              <label htmlFor="phone" className="block text-xs font-bold uppercase tracking-wider text-neutral-700">
                Phone Number <span className="text-red-600">*</span>
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                required
                className={cn(inputClass, "mt-1.5 focus:bg-white")}
                disabled={pending}
                placeholder="e.g. 0712345678"
                value={phoneNumber}
                onChange={(event) => onPhoneNumberChange(event.target.value)}
              />
            </div>
            <div>
              <label htmlFor="county" className="block text-xs font-bold uppercase tracking-wider text-neutral-700">
                County <span className="text-red-600">*</span>
              </label>
              <input
                id="county"
                name="county"
                required
                className={cn(inputClass, "mt-1.5 focus:bg-white")}
                disabled={pending}
                placeholder="e.g. Nairobi"
                value={county}
                onChange={(event) => onCountyChange(event.target.value)}
              />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="delivery_location" className="block text-xs font-bold uppercase tracking-wider text-neutral-700">
                Delivery Location <span className="text-red-600">*</span>
              </label>
              <input
                id="delivery_location"
                name="delivery_location"
                required
                className={cn(inputClass, "mt-1.5 focus:bg-white")}
                disabled={pending}
                placeholder="e.g. Town, Street, or Landmark"
                value={deliveryLocation}
                onChange={(event) => onDeliveryLocationChange(event.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Section 2: Additional Instructions */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">2</span>
            <h3 className="text-base font-bold text-neutral-900">Additional Instructions (Optional)</h3>
          </div>
          <div>
            <textarea
              id="additional_notes"
              name="additional_notes"
              rows={3}
              className={cn(inputClass, "min-h-[90px] resize-y focus:bg-white")}
              disabled={pending}
              placeholder="List any specific guidelines, packaging preferences, or requests here..."
              value={additionalNotes}
              onChange={(event) => onAdditionalNotesChange(event.target.value)}
            />
          </div>
        </div>

        {/* Section 3: Exam Quantities */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">3</span>
            <h3 className="text-base font-bold text-neutral-900">Enter Quantities</h3>
          </div>
          
          <div className="overflow-hidden rounded-2xl border border-neutral-200 shadow-[var(--shadow-sm)]">
            <table className="min-w-full text-sm">
              <thead className="bg-neutral-50 text-left text-xs font-bold uppercase tracking-[0.12em] text-neutral-500 border-b border-neutral-200">
                <tr>
                  <th className="px-6 py-4">Class</th>
                  <th className="px-6 py-4">Unit Price</th>
                  <th className="px-6 py-4 text-center">Quantity Needed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 bg-white">
                {EXAM_CLASSES.map(({ key, label }) => (
                  <tr key={key} className="hover:bg-neutral-50/50 transition-colors odd:bg-neutral-50/10">
                    <td className="px-6 py-4 font-semibold text-neutral-800">{label}</td>
                    <td className="px-6 py-4 font-bold text-neutral-950">{formatKesPrice(priceMap[key] ?? 0)}</td>
                    <td className="px-6 py-4 max-w-[150px]">
                      <div className="flex justify-center">
                        <input
                          id={`qty_${key}`}
                          name={`qty_${key}`}
                          type="number"
                          min="0"
                          step="1"
                          inputMode="numeric"
                          value={quantities[key] || ""}
                          onChange={(event) => updateQuantity(key, event.target.value)}
                          className={cn(qtyInputClass, "w-full max-w-[120px] transition-all hover:border-neutral-300 focus:scale-[1.02]")}
                          disabled={pending}
                          placeholder="0"
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sticky Totals Bar */}
        <div className="sticky bottom-3 z-20 rounded-2xl border border-primary/20 bg-white/95 p-5 shadow-[0_12px_40px_rgba(15,23,42,0.15)] backdrop-blur-md sm:bottom-4 sm:p-6 transition-all">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-neutral-500">Order Totals</p>
              <div className="mt-1.5 flex items-baseline gap-2">
                <span className="text-3xl font-black tracking-tight text-primary">{formatKesPrice(totals.totalAmount)}</span>
                <span className="text-sm font-semibold text-neutral-500">({totals.totalPapers} Papers)</span>
              </div>
              <p className="mt-1 text-[11px] text-neutral-400">Estimated total updates instantly.</p>
            </div>
            <button
              type="submit"
              disabled={pending || totals.totalPapers === 0}
              className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-neutral-950 px-8 text-sm font-bold text-white transition hover:bg-neutral-800 hover:scale-[1.01] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 disabled:scale-100 sm:w-auto shadow-md"
            >
              {pending ? "Generating order..." : "Generate order"}
            </button>
          </div>
        </div>
      </form>
    </section>
  );
}