"use client";

import { useActionState } from "react";

import type { ProductFormState } from "@/lib/admin/action-form-state";
import { productFormInitialState } from "@/lib/admin/action-form-state";
import type { CategoryRow, ProductWithCategory } from "@/lib/supabase/types";

import { AdminFormAlert } from "./AdminFormAlert";

const labelCls = "block text-sm font-medium text-neutral-800";
const fieldCls =
  "mt-1 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 shadow-sm focus:border-neutral-500 focus:outline-none focus:ring-1 focus:ring-neutral-500";

type Props = {
  categories: CategoryRow[];
  action: (prev: ProductFormState, formData: FormData) => Promise<ProductFormState>;
  product?: ProductWithCategory;
};

export function ProductForm({ categories, action, product }: Props) {
  const [state, formAction, pending] = useActionState(action, productFormInitialState);
  const isEdit = Boolean(product);

  return (
    <form action={formAction} className="max-w-xl space-y-4">
      <AdminFormAlert message={state.error} />

      {isEdit && product ? <input type="hidden" name="id" value={product.id} /> : null}

      <div>
        <label className={labelCls} htmlFor="name">
          Name <span className="text-red-600">*</span>
        </label>
        <input
          id="name"
          name="name"
          required
          defaultValue={product?.name ?? ""}
          className={fieldCls}
          autoComplete="off"
        />
      </div>

      <div>
        <label className={labelCls} htmlFor="slug">
          Slug <span className="text-red-600">*</span>
        </label>
        <input
          id="slug"
          name="slug"
          required
          defaultValue={product?.slug ?? ""}
          className={fieldCls}
          placeholder="e.g. grade-5-science-workbook"
          autoComplete="off"
        />
      </div>

      <div>
        <label className={labelCls} htmlFor="category_id">
          Category <span className="text-red-600">*</span>
        </label>
        <select
          id="category_id"
          name="category_id"
          required
          className={fieldCls}
          defaultValue={product?.category_id ?? ""}
        >
          <option value="" disabled>
            Select a category
          </option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} ({c.type})
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className={labelCls} htmlFor="price">
          Price (KES) <span className="text-red-600">*</span>
        </label>
        <input
          id="price"
          name="price"
          type="number"
          inputMode="decimal"
          min={0}
          step="0.01"
          required
          defaultValue={product?.price ?? ""}
          className={fieldCls}
        />
      </div>

      <div>
        <span className={labelCls}>Product image</span>
        {isEdit && product?.image_url ? (
          <div className="mt-2">
            <p className="text-xs text-neutral-600">Current image</p>
            <img
              src={product.image_url}
              alt=""
              className="mt-1 max-h-48 max-w-full rounded-md border border-neutral-200 object-contain"
            />
          </div>
        ) : null}
        <label className="mt-2 block" htmlFor="image">
          <span className="sr-only">{isEdit ? "Replace image" : "Upload image"}</span>
          <input
            id="image"
            name="image"
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            className={`${fieldCls} py-1.5 file:mr-3 file:rounded file:border-0 file:bg-neutral-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-neutral-800`}
          />
        </label>
        <p className="mt-1 text-xs text-neutral-500">
          {isEdit
            ? "Optional: choose a JPEG, PNG, GIF, or WebP file (max 5 MB) to replace the current image."
            : "Optional: JPEG, PNG, GIF, or WebP, max 5 MB."}
        </p>
      </div>

      <div>
        <label className={labelCls} htmlFor="grade">
          Grade / level
        </label>
        <input id="grade" name="grade" defaultValue={product?.grade ?? ""} className={fieldCls} />
      </div>

      <div>
        <label className={labelCls} htmlFor="description">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={5}
          defaultValue={product?.description ?? ""}
          className={fieldCls}
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          id="is_featured"
          name="is_featured"
          type="checkbox"
          defaultChecked={product?.is_featured ?? false}
          className="h-4 w-4 rounded border-neutral-300"
        />
        <label htmlFor="is_featured" className="text-sm font-medium text-neutral-800">
          Featured on home
        </label>
      </div>

      <div className="pt-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-60"
        >
          {pending ? "Saving…" : isEdit ? "Save changes" : "Create product"}
        </button>
      </div>
    </form>
  );
}
