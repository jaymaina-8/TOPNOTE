"use client";

import { useActionState } from "react";

import { AdminFormAlert } from "@/components/admin/AdminFormAlert";
import { examFormInitialState } from "@/lib/admin/action-form-state";
import { updateExamSessionPricesAction } from "@/lib/actions/admin/exams";
import { EXAM_CLASSES } from "@/lib/exams/classes";
import type { ExamSessionWithPrices } from "@/lib/exams/types";

const labelCls = "block text-sm font-bold text-neutral-900";
const fieldCls =
  "mt-1.5 w-full rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-900 shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15";

type ExamSessionEditFormProps = {
  session: ExamSessionWithPrices;
};

export function ExamSessionEditForm({ session }: ExamSessionEditFormProps) {
  const [state, formAction, pending] = useActionState(updateExamSessionPricesAction, examFormInitialState);
  const priceByKey = new Map(session.prices.map((row) => [row.class_key, row.price]));

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="session_id" value={session.id} />
      <AdminFormAlert message={state.error} />
      {state.success ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
          Session updated.
        </div>
      ) : null}

      <div>
        <label className={labelCls} htmlFor={`session_name_${session.id}`}>
          Session name <span className="text-red-600">*</span>
        </label>
        <input
          id={`session_name_${session.id}`}
          name="name"
          required
          defaultValue={session.name}
          className={fieldCls}
        />
      </div>

      <div>
        <p className={labelCls}>Class prices (KES)</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {EXAM_CLASSES.map(({ key, label }) => (
            <div key={key}>
              <label className="block text-xs font-semibold text-neutral-600" htmlFor={`edit_price_${session.id}_${key}`}>
                {label}
              </label>
              <input
                id={`edit_price_${session.id}_${key}`}
                name={`price_${key}`}
                type="number"
                min="0"
                step="1"
                required
                defaultValue={priceByKey.get(key) ?? 0}
                className={fieldCls}
              />
            </div>
          ))}
        </div>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="inline-flex min-h-10 items-center justify-center rounded-lg bg-neutral-950 px-4 text-sm font-bold text-white transition-colors hover:bg-neutral-800 disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}
