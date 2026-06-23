"use client";

import { useMemo, useState } from "react";
import { EXAM_CLASSES, buildPriceMap } from "@/lib/exams/classes";
import type { ExamSessionWithPrices } from "@/lib/exams/types";
import { ExamPricingTable } from "./exam-pricing-table";
import { ExamOrderForm } from "./exam-order-form";

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
      {/* Current Exam Session Section with Pricing Table */}
      <section className="overflow-hidden rounded-3xl border border-primary/10 bg-white shadow-[var(--shadow-sm)]">
        <div className="border-b border-primary/10 bg-gradient-to-br from-primary/8 via-white to-white px-5 py-8 sm:px-8">
          <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Current Exam Session</h2>
          <h3 className="mt-2 text-2xl font-black tracking-tight text-neutral-950 md:text-3xl">{session.name}</h3>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-neutral-600">
            Prices below are per exam paper. Enter quantities for each class to build your order sheet.
          </p>
        </div>

        <ExamPricingTable priceMap={priceMap} />
      </section>

      {/* Styled order form */}
      <ExamOrderForm
        session={session}
        priceMap={priceMap}
        quantities={quantities}
        updateQuantity={updateQuantity}
        totals={totals}
      />
    </div>
  );
}