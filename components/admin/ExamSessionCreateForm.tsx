"use client";

import { useActionState } from "react";

import { AdminFormAlert } from "@/components/admin/AdminFormAlert";
import { examFormInitialState } from "@/lib/admin/action-form-state";
import { createExamSessionAction } from "@/lib/actions/admin/exams";
import { EXAM_CLASSES } from "@/lib/exams/classes";

const labelCls = "block text-sm font-bold text-neutral-900";
const fieldCls =
  "mt-1.5 w-full rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-900 shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15";

export function ExamSessionCreateForm() {
  const [state, formAction, pending] = useActionState(createExamSessionAction, examFormInitialState);

  return (
    <form action={formAction} className="space-y-5">
      <AdminFormAlert message={state.error} />

      <div>
        <label className={labelCls} htmlFor="exam_session_name">
          Session name <span className="text-red-600">*</span>
        </label>
        <input
          id="exam_session_name"
          name="name"
          required
          className={fieldCls}
          placeholder="e.g. Mid-Term 2026"
          autoComplete="off"
        />
      </div>

      <div>
        <label className={labelCls} htmlFor="exam_session_slug">
          Slug <span className="font-normal text-neutral-500">(optional)</span>
        </label>
        <input
          id="exam_session_slug"
          name="slug"
          className={fieldCls}
          placeholder="Auto-generated from name if left blank"
          autoComplete="off"
        />
      </div>

      <div>
        <p className={labelCls}>Class prices (KES)</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {EXAM_CLASSES.map(({ key, label }) => (
            <div key={key}>
              <label className="block text-xs font-semibold text-neutral-600" htmlFor={`price_${key}`}>
                {label}
              </label>
              <input
                id={`price_${key}`}
                name={`price_${key}`}
                type="number"
                min="0"
                step="1"
                required
                defaultValue="0"
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
        {pending ? "Creating…" : "Create session"}
      </button>
    </form>
  );
}
