"use client";

import { useActionState, useMemo, useState } from "react";

import { submitExamOrderAction, type SubmitExamOrderState } from "@/lib/actions/submit-exam-order";
import { EXAM_CLASSES, buildPriceMap } from "@/lib/exams/classes";
import type { ExamSessionWithPrices } from "@/lib/exams/types";
import { formatKesPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

const initialState: SubmitExamOrderState = { status: "idle" };

const inputClass =
  "w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900 shadow-[var(--shadow-sm)] outline-none transition placeholder:text-neutral-400 focus:border-primary focus:ring-2 focus:ring-primary/20";

const qtyInputClass =
  "w-full min-w-[72px] rounded-xl border border-neutral-200 bg-white px-3 py-3 text-center text-base font-bold text-neutral-900 shadow-[var(--shadow-sm)] outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20";

type ExamOrderExperienceProps = {
  session: ExamSessionWithPrices;
};

export function ExamOrderExperience({ session }: ExamOrderExperienceProps) {
  const priceMap = useMemo(() => buildPriceMap(session.prices), [session.prices]);
  const [quantities, setQuantities] = useState<Record<string, number>>(() =>
    EXAM_CLASSES.reduce(
      (acc, item) => {
        acc[item.key] = 0;
        return acc;
      },
      {} as Record<string, number>,
    ),
  );
  const [state, formAction, pending] = useActionState(submitExamOrderAction, initialState);

  const totals = useMemo(() => {
    let totalPapers = 0;
    let totalAmount = 0;

    for (const item of EXAM_CLASSES) {
      const quantity = quantities[item.key] ?? 0;
      if (quantity <= 0) continue;
      totalPapers += quantity;
      totalAmount += Math.round((priceMap[item.key] ?? 0) * quantity);
    }

    return { totalPapers, totalAmount };
  }, [priceMap, quantities]);

  const updateQuantity = (classKey: string, value: string) => {
    const parsed = Number.parseInt(value, 10);
    setQuantities((current) => ({
      ...current,
      [classKey]: Number.isFinite(parsed) && parsed > 0 ? parsed : 0,
    }));
  };

  return (
    <div className="space-y-10 md:space-y-12">
      <section className="overflow-hidden rounded-3xl border border-primary/10 bg-white shadow-[var(--shadow-sm)]">
        <div className="border-b border-primary/10 bg-gradient-to-br from-primary/8 via-white to-white px-5 py-8 sm:px-8">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Current session</p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-neutral-950 md:text-3xl">{session.name}</h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-neutral-600">
            Prices below are per exam paper. Enter quantities for each class to build your order sheet.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-neutral-50 text-left text-xs font-bold uppercase tracking-[0.12em] text-neutral-500">
              <tr>
                <th className="px-4 py-3 sm:px-6">Class</th>
                <th className="px-4 py-3 sm:px-6">Unit price</th>
              </tr>
            </thead>
            <tbody>
              {EXAM_CLASSES.map(({ key, label }) => (
                <tr key={key} className="border-t border-neutral-100">
                  <td className="px-4 py-3 font-medium text-neutral-900 sm:px-6">{label}</td>
                  <td className="px-4 py-3 font-bold text-neutral-950 sm:px-6">{formatKesPrice(priceMap[key] ?? 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-[var(--shadow-sm)] sm:p-8">
        <div className="max-w-3xl">
          <h2 className="text-xl font-black tracking-tight text-neutral-950 md:text-2xl">Digital order sheet</h2>
          <p className="mt-2 text-sm leading-relaxed text-neutral-600">
            Fill in your school details and exam quantities. Totals update instantly as you type.
          </p>
        </div>

        {state.status === "success" ? (
          <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 sm:p-6">
            <p className="text-sm font-bold uppercase tracking-[0.14em] text-emerald-800">Order generated</p>
            <p className="mt-2 text-2xl font-black text-emerald-950">{state.orderNumber}</p>
            <p className="mt-2 text-sm text-emerald-900">
              {state.totalPapers} papers · {formatKesPrice(state.totalAmount)}
            </p>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <a
                href={state.pdfUrl}
                className="inline-flex min-h-12 items-center justify-center rounded-xl bg-neutral-950 px-5 text-sm font-bold text-white transition hover:bg-neutral-800"
              >
                Download PDF
              </a>
              <a
                href={state.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-12 items-center justify-center rounded-xl bg-[#25D366] px-5 text-sm font-bold text-white transition hover:bg-[#1fb855]"
              >
                Send via WhatsApp
              </a>
            </div>
          </div>
        ) : null}

        {state.status === "error" ? (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900" role="alert">
            {state.error}
          </div>
        ) : null}

        <form action={formAction} className="mt-8 space-y-8">
          <input type="hidden" name="session_id" value={session.id} />
          {EXAM_CLASSES.map(({ key }) => (
            <input key={key} type="hidden" name={`price_${key}`} value={priceMap[key] ?? 0} />
          ))}

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="school_name" className="block text-sm font-semibold text-neutral-800">
                School name <span className="text-red-600">*</span>
              </label>
              <input id="school_name" name="school_name" required className={cn(inputClass, "mt-1.5")} disabled={pending} />
            </div>
            <div>
              <label htmlFor="contact_person" className="block text-sm font-semibold text-neutral-800">
                Contact person <span className="text-red-600">*</span>
              </label>
              <input
                id="contact_person"
                name="contact_person"
                required
                className={cn(inputClass, "mt-1.5")}
                disabled={pending}
              />
            </div>
            <div>
              <label htmlFor="phone" className="block text-sm font-semibold text-neutral-800">
                Phone number <span className="text-red-600">*</span>
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                required
                className={cn(inputClass, "mt-1.5")}
                disabled={pending}
              />
            </div>
            <div>
              <label htmlFor="county" className="block text-sm font-semibold text-neutral-800">
                County <span className="text-red-600">*</span>
              </label>
              <input id="county" name="county" required className={cn(inputClass, "mt-1.5")} disabled={pending} />
            </div>
          </div>

          <div>
            <label htmlFor="delivery_location" className="block text-sm font-semibold text-neutral-800">
              Delivery location <span className="text-red-600">*</span>
            </label>
            <input
              id="delivery_location"
              name="delivery_location"
              required
              className={cn(inputClass, "mt-1.5")}
              disabled={pending}
            />
          </div>

          <div>
            <label htmlFor="additional_notes" className="block text-sm font-semibold text-neutral-800">
              Additional notes
            </label>
            <textarea
              id="additional_notes"
              name="additional_notes"
              rows={4}
              className={cn(inputClass, "mt-1.5 min-h-[110px] resize-y")}
              disabled={pending}
            />
          </div>

          <div>
            <h3 className="text-lg font-black text-neutral-950">Exam quantities</h3>
            <div className="mt-4 overflow-x-auto rounded-2xl border border-neutral-200">
              <table className="min-w-full text-sm">
                <thead className="bg-neutral-50 text-left text-xs font-bold uppercase tracking-[0.12em] text-neutral-500">
                  <tr>
                    <th className="px-4 py-3">Class</th>
                    <th className="px-4 py-3">Price</th>
                    <th className="px-4 py-3">Quantity</th>
                  </tr>
                </thead>
                <tbody>
                  {EXAM_CLASSES.map(({ key, label }) => (
                    <tr key={key} className="border-t border-neutral-100">
                      <td className="px-4 py-3 font-medium text-neutral-900">{label}</td>
                      <td className="px-4 py-3 font-semibold text-neutral-800">{formatKesPrice(priceMap[key] ?? 0)}</td>
                      <td className="px-4 py-3">
                        <input
                          id={`qty_${key}`}
                          name={`qty_${key}`}
                          type="number"
                          min="0"
                          step="1"
                          inputMode="numeric"
                          value={quantities[key] || ""}
                          onChange={(event) => updateQuantity(key, event.target.value)}
                          className={qtyInputClass}
                          disabled={pending}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="sticky bottom-3 z-20 rounded-2xl border border-primary/15 bg-white/95 p-4 shadow-[0_12px_40px_rgba(15,23,42,0.12)] backdrop-blur-md sm:bottom-4 sm:p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-neutral-600">Total papers: {totals.totalPapers}</p>
                <p className="mt-1 text-2xl font-black text-primary">{formatKesPrice(totals.totalAmount)}</p>
                <p className="mt-1 text-xs text-neutral-500">Estimated total updates instantly.</p>
              </div>
              <button
                type="submit"
                disabled={pending || totals.totalPapers === 0}
                className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-neutral-950 px-6 text-sm font-bold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              >
                {pending ? "Generating order…" : "Generate order"}
              </button>
            </div>
          </div>
        </form>
      </section>
    </div>
  );
}
