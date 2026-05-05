"use client";

import { useActionState } from "react";

import { categoryFormInitialState } from "@/lib/admin/action-form-state";
import { createCategoryAction } from "@/lib/actions/admin/categories";
import type { CategoryType } from "@/lib/supabase/types";

import { AdminFormAlert } from "./AdminFormAlert";

const labelCls = "block text-sm font-bold text-neutral-900";
const fieldCls =
  "mt-1.5 w-full rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-900 shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15";

const TYPES: { value: CategoryType; label: string }[] = [
  { value: "books", label: "Books" },
  { value: "exams", label: "Exams" },
  { value: "stationery", label: "Stationery" },
  { value: "lab", label: "Lab" },
];

export function CategoryForm() {
  const [state, formAction, pending] = useActionState(createCategoryAction, categoryFormInitialState);

  return (
    <form action={formAction} className="max-w-xl space-y-5">
      <AdminFormAlert message={state.error} />

      <div>
        <label className={labelCls} htmlFor="cat_name">
          Name <span className="text-red-600">*</span>
        </label>
        <input id="cat_name" name="name" required className={fieldCls} autoComplete="off" />
      </div>

      <div>
        <label className={labelCls} htmlFor="cat_slug">
          Slug <span className="text-red-600">*</span>
        </label>
        <input id="cat_slug" name="slug" required className={fieldCls} placeholder="e.g. primary-books" />
      </div>

      <div>
        <label className={labelCls} htmlFor="cat_type">
          Type <span className="text-red-600">*</span>
        </label>
        <select id="cat_type" name="type" required className={fieldCls} defaultValue="">
          <option value="" disabled>
            Select type
          </option>
          {TYPES.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div className="pt-2">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex min-h-10 items-center justify-center rounded-lg bg-neutral-950 px-4 text-sm font-bold text-white transition-colors hover:bg-neutral-800 disabled:opacity-60"
        >
          {pending ? "Creating…" : "Create category"}
        </button>
      </div>
    </form>
  );
}
