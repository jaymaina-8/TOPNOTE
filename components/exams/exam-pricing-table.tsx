"use client";

import { EXAM_CLASSES } from "@/lib/exams/classes";
import { formatKesPrice } from "@/lib/format";

type ExamPricingTableProps = {
  priceMap: Record<string, number>;
};

export function ExamPricingTable({ priceMap }: ExamPricingTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead className="bg-neutral-50 border-b border-neutral-100 text-left text-xs font-bold uppercase tracking-[0.12em] text-neutral-600">
          <tr>
            <th className="px-6 py-4 sm:px-8 font-semibold">Class</th>
            <th className="px-6 py-4 sm:px-8 font-semibold">Unit Price</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100 bg-white">
          {EXAM_CLASSES.map(({ key, label }) => (
            <tr key={key} className="hover:bg-neutral-50/50 transition-colors odd:bg-neutral-50/10">
              <td className="px-6 py-4 sm:px-8 font-semibold text-neutral-800">{label}</td>
              <td className="px-6 py-4 sm:px-8 font-extrabold text-primary">{formatKesPrice(priceMap[key] ?? 0)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}