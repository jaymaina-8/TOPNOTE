"use client";

import { useActionState, useEffect, useMemo, useState } from "react";

import type { ProductFormState } from "@/lib/admin/action-form-state";
import { productFormInitialState } from "@/lib/admin/action-form-state";
import type { BookSubcategoryRow, CategoryRow, ProductWithCategory } from "@/lib/supabase/types";

import { AdminFormAlert } from "./AdminFormAlert";

const labelCls = "block text-sm font-bold text-neutral-900";
const fieldCls =
  "mt-1.5 w-full rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-900 shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15";

type Props = {
  categories: CategoryRow[];
  bookSubcategories: BookSubcategoryRow[];
  action: (prev: ProductFormState, formData: FormData) => Promise<ProductFormState>;
  product?: ProductWithCategory;
};

export function ProductForm({ categories, bookSubcategories, action, product }: Props) {
  const [state, formAction, pending] = useActionState(action, productFormInitialState);
  const isEdit = Boolean(product);
  const [selectedCategoryId, setSelectedCategoryId] = useState(product?.category_id ?? "");
  const [selectedBookSubcategoryId, setSelectedBookSubcategoryId] = useState(product?.bookSubcategory?.id ?? "");

  const selectedCategory = useMemo(
    () => categories.find((category) => category.id === selectedCategoryId) ?? null,
    [categories, selectedCategoryId],
  );
  const isBookCategory = selectedCategory?.type === "books";
  const defaultBookSubcategoryId =
    bookSubcategories.find((subcategory) => subcategory.slug === "workbooks")?.id ?? bookSubcategories[0]?.id ?? "";

  useEffect(() => {
    if (isBookCategory && !selectedBookSubcategoryId && defaultBookSubcategoryId) {
      setSelectedBookSubcategoryId(defaultBookSubcategoryId);
    }
  }, [defaultBookSubcategoryId, isBookCategory, selectedBookSubcategoryId]);

  return (
    <form action={formAction} className="max-w-xl space-y-5">
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
          value={selectedCategoryId}
          onChange={(event) => setSelectedCategoryId(event.target.value)}
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

      {isBookCategory ? (
        <div>
          <label className={labelCls} htmlFor="book_subcategory_id">
            Book Type <span className="text-red-600">*</span>
          </label>
          <select
            id="book_subcategory_id"
            name="book_subcategory_id"
            required
            className={fieldCls}
            value={selectedBookSubcategoryId}
            onChange={(event) => setSelectedBookSubcategoryId(event.target.value)}
          >
            <option value="" disabled>
              Select book type
            </option>
            {bookSubcategories.map((subcategory) => (
              <option key={subcategory.id} value={subcategory.id}>
                {subcategory.name}
              </option>
            ))}
          </select>
        </div>
      ) : (
        <input type="hidden" name="book_subcategory_id" value="" />
      )}

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
            className="mt-1 max-h-48 max-w-full rounded-lg border border-neutral-200 bg-neutral-50 object-contain"
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
            className={`${fieldCls} py-1.5 file:mr-3 file:rounded-md file:border-0 file:bg-neutral-100 file:px-3 file:py-1.5 file:text-sm file:font-bold file:text-neutral-800`}
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
          className="inline-flex min-h-10 items-center justify-center rounded-lg bg-neutral-950 px-4 text-sm font-bold text-white transition-colors hover:bg-neutral-800 disabled:opacity-60"
        >
          {pending ? "Saving…" : isEdit ? "Save changes" : "Create product"}
        </button>
      </div>
    </form>
  );
}
