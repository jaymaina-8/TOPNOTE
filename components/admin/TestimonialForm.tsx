"use client";

import { useActionState } from "react";

import { testimonialFormInitialState } from "@/lib/admin/action-form-state";
import { createTestimonialAction } from "@/lib/actions/admin/testimonials";

import { AdminFormAlert } from "./AdminFormAlert";

const labelCls = "block text-sm font-bold text-neutral-900";
const fieldCls =
  "mt-1.5 w-full rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-900 shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15";

export function TestimonialForm() {
  const [state, formAction, pending] = useActionState(createTestimonialAction, testimonialFormInitialState);

  return (
    <form action={formAction} className="max-w-xl space-y-5">
      <AdminFormAlert message={state.error} />

      <div>
        <label className={labelCls} htmlFor="t_name">
          Name <span className="text-red-600">*</span>
        </label>
        <input id="t_name" name="name" required className={fieldCls} autoComplete="off" />
      </div>

      <div>
        <label className={labelCls} htmlFor="t_role">
          Role
        </label>
        <input id="t_role" name="role" className={fieldCls} placeholder="Parent, teacher, …" />
      </div>

      <div>
        <label className={labelCls} htmlFor="t_content">
          Content <span className="text-red-600">*</span>
        </label>
        <textarea id="t_content" name="content" rows={5} required className={fieldCls} />
      </div>

      <div className="pt-2">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex min-h-10 items-center justify-center rounded-lg bg-neutral-950 px-4 text-sm font-bold text-white transition-colors hover:bg-neutral-800 disabled:opacity-60"
        >
          {pending ? "Creating…" : "Add testimonial"}
        </button>
      </div>
    </form>
  );
}
