"use client";

import { useActionState } from "react";

import { testimonialFormInitialState } from "@/lib/admin/action-form-state";
import { createTestimonialAction } from "@/lib/actions/admin/testimonials";

import { AdminFormAlert } from "./AdminFormAlert";

const labelCls = "block text-sm font-medium text-neutral-800";
const fieldCls =
  "mt-1 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 shadow-sm focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500";

export function TestimonialForm() {
  const [state, formAction, pending] = useActionState(createTestimonialAction, testimonialFormInitialState);

  return (
    <form action={formAction} className="max-w-xl space-y-4">
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
          className="rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-60"
        >
          {pending ? "Creating…" : "Add testimonial"}
        </button>
      </div>
    </form>
  );
}
