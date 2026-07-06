"use client";

import { useState, useMemo, useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import type { CategoryRow, CategoryType } from "@/lib/supabase/types";
import { DeleteWithConfirm } from "@/components/admin/DeleteWithConfirm";
import { createCategoryAction, updateCategoryAction, deleteCategoryAction } from "@/lib/actions/admin/categories";
import { categoryFormInitialState } from "@/lib/admin/action-form-state";
import { AdminFormAlert } from "@/components/admin/AdminFormAlert";

interface CategoryWithCount extends CategoryRow {
  productCount: number;
}

interface CategoriesGridClientProps {
  initialCategories: CategoryWithCount[];
}

const labelCls = "block text-xs font-bold text-[#111111] uppercase tracking-wider";
const fieldCls =
  "mt-1.5 w-full rounded-lg border border-[#ECECEC] bg-white px-3 py-2.5 text-xs text-[#111111] shadow-sm transition focus:border-[#E31B23]/30 focus:outline-none focus:ring-1 focus:ring-[#E31B23]/30";

const TYPES: { value: CategoryType; label: string } = [
  { value: "books", label: "Books" },
  { value: "exams", label: "Exams" },
  { value: "stationery", label: "Stationery" },
  { value: "lab", label: "Lab" },
] as any;

export function CategoriesGridClient({ initialCategories }: CategoriesGridClientProps) {
  const router = useRouter();
  const [categories, setCategories] = useState(initialCategories);

  useEffect(() => {
    setCategories(initialCategories);
  }, [initialCategories]);

  // Search and Sort state
  const [search, setSearch] = useState("");
  const [sortColumn, setSortColumn] = useState<"name" | "type" | "count">("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Editing state
  const [editingCategory, setEditingCategory] = useState<CategoryRow | null>(null);

  // Form states for creation
  const [createState, createFormAction, createPending] = useActionState(
    createCategoryAction,
    categoryFormInitialState
  );

  // Form states for editing
  const [editState, editFormAction, editPending] = useActionState(
    updateCategoryAction,
    categoryFormInitialState
  );

  // Reset forms on success
  useEffect(() => {
    if (createState?.success) {
      router.refresh();
      // Reset input fields by refreshing window or form ref
    }
  }, [createState?.success, router]);

  useEffect(() => {
    if (editState?.success) {
      setEditingCategory(null);
      router.refresh();
    }
  }, [editState?.success, router]);

  // Icons mapper
  const getCategoryIcon = (type: CategoryType) => {
    switch (type) {
      case "books":
        return (
          <svg className="h-4.5 w-4.5 text-[#E31B23]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        );
      case "exams":
        return (
          <svg className="h-4.5 w-4.5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      case "stationery":
        return (
          <svg className="h-4.5 w-4.5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        );
      case "lab":
        return (
          <svg className="h-4.5 w-4.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
          </svg>
        );
    }
  };

  // Filter Categories
  const filteredCategories = useMemo(() => {
    return categories.filter((c) => {
      const q = search.trim().toLowerCase();
      if (!q) return true;
      return c.name.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q) || c.type.toLowerCase().includes(q);
    });
  }, [categories, search]);

  // Sort Categories
  const sortedCategories = useMemo(() => {
    const sorted = [...filteredCategories];
    sorted.sort((a, b) => {
      let aVal: any = "";
      let bVal: any = "";

      if (sortColumn === "name") {
        aVal = a.name;
        bVal = b.name;
      } else if (sortColumn === "type") {
        aVal = a.type;
        bVal = b.type;
      } else if (sortColumn === "count") {
        aVal = a.productCount;
        bVal = b.productCount;
      }

      if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [filteredCategories, sortColumn, sortDirection]);

  const handleSort = (colId: "name" | "type" | "count") => {
    if (sortColumn === colId) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortColumn(colId);
      setSortDirection("asc");
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
      {/* LEFT FORM PANEL (Add New or Edit) */}
      <div className="rounded-xl border border-[#ECECEC] bg-white p-6 shadow-sm self-start">
        {editingCategory ? (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-[#ECECEC] pb-3">
              <div>
                <h2 className="text-base font-bold text-[#111111]">Edit Category</h2>
                <p className="text-xs text-[#888888] mt-0.5">Modify properties for grouping items.</p>
              </div>
              <button
                onClick={() => setEditingCategory(null)}
                className="rounded-lg border border-[#ECECEC] bg-white px-2 py-1 text-xs font-bold text-[#555555] hover:bg-[#FAFAFA]"
              >
                Cancel
              </button>
            </div>

            <form action={editFormAction} className="space-y-4.5">
              <AdminFormAlert message={editState.error} />
              <input type="hidden" name="id" value={editingCategory.id} />

              <div>
                <label className={labelCls} htmlFor="edit_name">
                  Category Name <span className="text-red-600">*</span>
                </label>
                <input
                  id="edit_name"
                  name="name"
                  required
                  defaultValue={editingCategory.name}
                  className={fieldCls}
                  autoComplete="off"
                />
              </div>

              <div>
                <label className={labelCls} htmlFor="edit_slug">
                  Slug <span className="text-red-600">*</span>
                </label>
                <input
                  id="edit_slug"
                  name="slug"
                  required
                  defaultValue={editingCategory.slug}
                  className={fieldCls}
                />
              </div>

              <div>
                <label className={labelCls} htmlFor="edit_type">
                  Type <span className="text-red-600">*</span>
                </label>
                <select
                  id="edit_type"
                  name="type"
                  required
                  className={fieldCls}
                  defaultValue={editingCategory.type}
                >
                  <option value="books">Books</option>
                  <option value="exams">Exams</option>
                  <option value="stationery">Stationery</option>
                  <option value="lab">Lab</option>
                </select>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={editPending}
                  className="inline-flex min-h-10 w-full items-center justify-center rounded-lg bg-neutral-900 px-4 text-xs font-bold text-white shadow-sm hover:bg-neutral-800 disabled:opacity-60"
                >
                  {editPending ? "Saving..." : "Save Category"}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="border-b border-[#ECECEC] pb-3">
              <h2 className="text-base font-bold text-[#111111]">New Category</h2>
              <p className="text-xs text-[#888888] mt-0.5">Create catalog sections for products.</p>
            </div>

            <form action={createFormAction} className="space-y-4.5">
              <AdminFormAlert message={createState.error} />

              <div>
                <label className={labelCls} htmlFor="cat_name">
                  Category Name <span className="text-red-600">*</span>
                </label>
                <input id="cat_name" name="name" required className={fieldCls} autoComplete="off" />
              </div>

              <div>
                <label className={labelCls} htmlFor="cat_slug">
                  Slug <span className="text-red-600">*</span>
                </label>
                <input id="cat_slug" name="slug" required className={fieldCls} placeholder="e.g. primary-ruler" />
              </div>

              <div>
                <label className={labelCls} htmlFor="cat_type">
                  Type <span className="text-red-600">*</span>
                </label>
                <select id="cat_type" name="type" required className={fieldCls} defaultValue="">
                  <option value="" disabled>
                    Select category type
                  </option>
                  <option value="books">Books</option>
                  <option value="exams">Exams</option>
                  <option value="stationery">Stationery</option>
                  <option value="lab">Lab</option>
                </select>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={createPending}
                  className="inline-flex min-h-10 w-full items-center justify-center rounded-lg bg-neutral-900 px-4 text-xs font-bold text-white shadow-sm hover:bg-neutral-800 disabled:opacity-60"
                >
                  {createPending ? "Creating..." : "Create Category"}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* RIGHT LISTING PANEL */}
      <div className="rounded-xl border border-[#ECECEC] bg-white p-6 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#ECECEC] pb-4">
          <div>
            <h2 className="text-base font-bold text-[#111111]">Configured Categories</h2>
            <p className="text-xs text-[#888888] mt-0.5">{sortedCategories.length} items configured.</p>
          </div>

          {/* Search bar */}
          <div className="relative max-w-xs flex-1">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-[#888888]">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search sections..."
              className="w-full rounded-lg border border-[#ECECEC] bg-white py-1.5 pl-8.5 pr-3 text-xs text-[#111111] focus:border-[#E31B23]/30 focus:outline-none"
            />
          </div>
        </div>

        {/* Categories Grid List */}
        {sortedCategories.length === 0 ? (
          <p className="text-xs text-[#888888] py-8 text-center">No categories matched search query.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[#ECECEC] bg-[#FAFAFA] text-[10px] font-black uppercase tracking-wider text-[#888888]">
                <tr>
                  <th className="px-3 py-2 cursor-pointer" onClick={() => handleSort("name")}>
                    Name {sortColumn === "name" && (sortDirection === "asc" ? "▲" : "▼")}
                  </th>
                  <th className="px-3 py-2">Slug</th>
                  <th className="px-3 py-2 cursor-pointer" onClick={() => handleSort("type")}>
                    Type {sortColumn === "type" && (sortDirection === "asc" ? "▲" : "▼")}
                  </th>
                  <th className="px-3 py-2 cursor-pointer text-right" onClick={() => handleSort("count")}>
                    Products {sortColumn === "count" && (sortDirection === "asc" ? "▲" : "▼")}
                  </th>
                  <th className="px-3 py-2 text-right w-24">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ECECEC] font-medium text-[#555555]">
                {sortedCategories.map((c) => (
                  <tr key={c.id} className="hover:bg-[#FAFAFA] transition-colors">
                    <td className="px-3 py-2.5 font-bold text-[#111111] flex items-center gap-2">
                      {getCategoryIcon(c.type)}
                      <span>{c.name}</span>
                    </td>
                    <td className="px-3 py-2.5 font-mono text-[10px] text-[#888888]">{c.slug}</td>
                    <td className="px-3 py-2.5">
                      <span className="text-[10px] font-bold uppercase">{c.type}</span>
                    </td>
                    <td className="px-3 py-2.5 text-right font-black text-[#111111] tabular-nums">
                      {c.productCount.toLocaleString()} items
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => setEditingCategory(c)}
                          className="rounded-lg border border-[#ECECEC] bg-white px-2 py-1 text-xs font-bold text-[#111111] shadow-sm hover:bg-[#FAFAFA]"
                        >
                          Edit
                        </button>
                        <DeleteWithConfirm
                          action={deleteCategoryAction}
                          id={c.id}
                          confirmMessage={`Delete category "${c.name}"?`}
                        >
                          <button
                            type="submit"
                            className="rounded-lg border border-red-200 bg-white px-2 py-1 text-xs font-bold text-red-600 shadow-sm hover:bg-red-50"
                          >
                            Delete
                          </button>
                        </DeleteWithConfirm>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
