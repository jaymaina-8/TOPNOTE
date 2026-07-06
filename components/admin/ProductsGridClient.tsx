"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatKesPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ProductWithCategory, CategoryRow } from "@/lib/supabase/types";
import { DeleteWithConfirm } from "@/components/admin/DeleteWithConfirm";
import { deleteProductAction, toggleProductFeaturedAction, updateProductPriceAction, deleteMultipleProductsAction } from "@/lib/actions/admin/products";

interface ProductsGridClientProps {
  initialProducts: ProductWithCategory[];
  categories: CategoryRow[];
}

export function ProductsGridClient({ initialProducts, categories }: ProductsGridClientProps) {
  const router = useRouter();

  // Core items state
  const [products, setProducts] = useState(initialProducts);
  useEffect(() => {
    setProducts(initialProducts);
  }, [initialProducts]);

  // Filtering states
  const [search, setSearch] = useState("");
  const [selectedCategoryType, setSelectedCategoryType] = useState<string>("all");
  const [featuredFilter, setFeaturedFilter] = useState<string>("all");
  const [priceSort, setPriceSort] = useState<string>("all");

  // Inline Price Edit state
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [editingPriceValue, setEditingPriceValue] = useState("");
  const [priceActionPending, setPriceActionPending] = useState(false);

  // Sorting and Pagination
  const [sortColumn, setSortColumn] = useState<string>("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Selection states
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkActionPending, setBulkActionPending] = useState(false);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);

  // Apply filters
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // 1. Search Query
      const q = search.trim().toLowerCase();
      if (q) {
        const match = p.name.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q);
        if (!match) return false;
      }

      // 2. Category Chip type
      if (selectedCategoryType !== "all" && p.categories?.type !== selectedCategoryType) return false;

      // 3. Featured
      if (featuredFilter === "featured" && !p.is_featured) return false;
      if (featuredFilter === "standard" && p.is_featured) return false;

      return true;
    });
  }, [products, search, selectedCategoryType, featuredFilter]);

  // Apply sorting
  const sortedProducts = useMemo(() => {
    const sorted = [...filteredProducts];
    sorted.sort((a, b) => {
      let aVal: any = "";
      let bVal: any = "";

      if (sortColumn === "name") {
        aVal = a.name;
        bVal = b.name;
      } else if (sortColumn === "price") {
        aVal = Number(a.price || 0);
        bVal = Number(b.price || 0);
      } else if (sortColumn === "category") {
        aVal = a.categories?.name ?? "";
        bVal = b.categories?.name ?? "";
      } else if (sortColumn === "featured") {
        aVal = a.is_featured ? 1 : 0;
        bVal = b.is_featured ? 1 : 0;
      }

      if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [filteredProducts, sortColumn, sortDirection]);

  // Apply pagination
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedProducts.slice(start, start + pageSize);
  }, [sortedProducts, currentPage, pageSize]);

  const totalPages = Math.max(Math.ceil(sortedProducts.length / pageSize), 1);

  // Reset page
  useEffect(() => {
    setCurrentPage(1);
    setSelectedIds(new Set());
  }, [search, selectedCategoryType, featuredFilter, sortColumn, sortDirection]);

  // Selection handlers
  const handleSelectAll = () => {
    const pageIds = paginatedProducts.map((p) => p.id);
    const allSelected = pageIds.every((id) => selectedIds.has(id));

    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        pageIds.forEach((id) => next.delete(id));
      } else {
        pageIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const handleSelectRow = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const isRowSelected = (id: string) => selectedIds.has(id);
  const isAllPageSelected =
    paginatedProducts.length > 0 && paginatedProducts.every((p) => selectedIds.has(p.id));

  // Sort toggle
  const handleSort = (colId: string) => {
    if (sortColumn === colId) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortColumn(colId);
      setSortDirection("asc");
    }
  };

  // Toggle Featured state instantly
  const handleToggleFeatured = async (productId: string, currentFeatured: boolean) => {
    const res = await toggleProductFeaturedAction(productId, currentFeatured);
    if (res.success) {
      setProducts((prev) =>
        prev.map((item) => (item.id === productId ? { ...item, is_featured: !currentFeatured } : item))
      );
      router.refresh();
    } else {
      alert(res.error ?? "Failed to toggle featured state.");
    }
  };

  // Inline Price Edit Save
  const handleSavePrice = async (productId: string) => {
    const numeric = parseFloat(editingPriceValue);
    if (isNaN(numeric) || numeric < 0) {
      alert("Invalid price value");
      return;
    }
    setPriceActionPending(true);
    const res = await updateProductPriceAction(productId, numeric);
    setPriceActionPending(false);
    if (res.success) {
      setProducts((prev) =>
        prev.map((item) => (item.id === productId ? { ...item, price: numeric } : item))
      );
      setEditingPriceId(null);
      router.refresh();
    } else {
      alert(res.error ?? "Failed to update price.");
    }
  };

  // Bulk deletion
  const handleBulkDelete = async () => {
    setBulkActionPending(true);
    const ids = Array.from(selectedIds);
    const res = await deleteMultipleProductsAction(ids);
    setBulkActionPending(false);
    setShowBulkDeleteConfirm(false);
    if (res.success) {
      setSelectedIds(new Set());
      router.refresh();
    } else {
      alert(res.error ?? "Failed to delete products.");
    }
  };

  return (
    <div className="space-y-4">
      {/* Search and Category Chips */}
      <div className="rounded-xl border border-[#ECECEC] bg-white p-4 shadow-sm space-y-4">
        {/* Text search */}
        <div className="relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-[#888888]">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products by name or slug..."
            className="w-full rounded-lg border border-[#ECECEC] bg-white py-1.8 pl-9 pr-4 text-xs text-[#111111] focus:border-[#E31B23]/30 focus:outline-none focus:ring-1 focus:ring-[#E31B23]/30"
          />
        </div>

        {/* Category type chips filter */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-black uppercase tracking-wider text-[#888888] mr-2">Category:</span>
          {(["all", "books", "exams", "stationery", "lab"] as const).map((type) => (
            <button
              key={type}
              onClick={() => setSelectedCategoryType(type)}
              className={cn(
                "rounded-full px-3.5 py-1 text-xs font-bold transition border",
                selectedCategoryType === type
                  ? "bg-[#E31B23] text-white border-transparent shadow-sm"
                  : "bg-white border-[#ECECEC] text-[#555555] hover:bg-[#FAFAFA]"
              )}
            >
              {type === "all" ? "All Items" : type.toUpperCase()}
            </button>
          ))}

          {/* Quick Featured toggle filter */}
          <div className="ml-auto flex items-center gap-1">
            <select
              value={featuredFilter}
              onChange={(e) => setFeaturedFilter(e.target.value)}
              className="rounded-lg border border-[#ECECEC] bg-white px-2.5 py-1 text-xs font-semibold text-[#555555] focus:outline-none"
            >
              <option value="all">All Features</option>
              <option value="featured">Featured On Home</option>
              <option value="standard">Standard Items</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bulk action toolbar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between rounded-lg border border-[#E31B23]/20 bg-[#FAFAFA] px-4 py-2.5 shadow-sm animate-in slide-in-from-top duration-250">
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#E31B23] text-[10px] font-black text-white">
              {selectedIds.size}
            </span>
            <span className="text-xs font-bold text-[#111111]">Items Selected</span>
          </div>
          <button
            onClick={() => setShowBulkDeleteConfirm(true)}
            className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-red-700 transition"
          >
            Bulk Delete Selected
          </button>
        </div>
      )}

      {/* Grid listing content */}
      <div className="hidden md:block overflow-hidden rounded-xl border border-[#ECECEC] bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="sticky top-0 z-10 border-b border-[#ECECEC] bg-[#FAFAFA] text-[10px] font-black uppercase tracking-wider text-[#888888]">
              <tr>
                <th className="px-4 py-3.5 w-10">
                  <input
                    type="checkbox"
                    checked={isAllPageSelected}
                    onChange={handleSelectAll}
                    className="h-3.5 w-3.5 rounded border-[#ECECEC] text-[#E31B23] focus:ring-0"
                  />
                </th>
                <th className="px-4 py-3.5 cursor-pointer" onClick={() => handleSort("name")}>
                  Product Name {sortColumn === "name" && (sortDirection === "asc" ? "▲" : "▼")}
                </th>
                <th className="px-4 py-3.5">Slug</th>
                <th className="px-4 py-3.5 cursor-pointer" onClick={() => handleSort("category")}>
                  Category {sortColumn === "category" && (sortDirection === "asc" ? "▲" : "▼")}
                </th>
                <th className="px-4 py-3.5 cursor-pointer text-right" onClick={() => handleSort("price")}>
                  Price (Double Click to Edit) {sortColumn === "price" && (sortDirection === "asc" ? "▲" : "▼")}
                </th>
                <th className="px-4 py-3.5 cursor-pointer text-center" onClick={() => handleSort("featured")}>
                  Featured {sortColumn === "featured" && (sortDirection === "asc" ? "▲" : "▼")}
                </th>
                <th className="px-4 py-3.5 text-right w-24">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ECECEC]">
              {paginatedProducts.map((p) => (
                <tr
                  key={p.id}
                  className={cn(
                    "hover:bg-[#FAFAFA]/75 transition-colors group",
                    isRowSelected(p.id) && "bg-[#E31B23]/5"
                  )}
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={isRowSelected(p.id)}
                      onChange={() => handleSelectRow(p.id)}
                      className="h-3.5 w-3.5 rounded border-[#ECECEC] text-[#E31B23] focus:ring-0"
                    />
                  </td>
                  <td className="px-4 py-3 font-bold text-[#111111] max-w-xs truncate">{p.name}</td>
                  <td className="px-4 py-3 text-neutral-600 font-mono text-[10px]">{p.slug}</td>
                  <td className="px-4 py-3 text-neutral-600 font-semibold">{p.categories?.name ?? "—"}</td>
                  <td className="px-4 py-3 text-right">
                    {editingPriceId === p.id ? (
                      <div className="flex justify-end items-center gap-1 animate-in zoom-in-95 duration-100">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={editingPriceValue}
                          onChange={(e) => setEditingPriceValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSavePrice(p.id);
                            else if (e.key === "Escape") setEditingPriceId(null);
                          }}
                          className="w-20 rounded border border-[#ECECEC] bg-white px-1.5 py-0.5 text-right text-xs font-semibold focus:outline-none"
                          disabled={priceActionPending}
                          autoFocus
                        />
                        <button
                          onClick={() => handleSavePrice(p.id)}
                          className="rounded bg-[#E31B23] p-1 text-white hover:bg-[#C1141C] focus:outline-none"
                          disabled={priceActionPending}
                        >
                          ✓
                        </button>
                      </div>
                    ) : (
                      <span
                        onDoubleClick={() => {
                          setEditingPriceId(p.id);
                          setEditingPriceValue(p.price.toString());
                        }}
                        className="font-black text-[#111111] tabular-nums cursor-pointer border-b border-dashed border-[#ECECEC] pb-0.5 hover:border-[#111111]"
                        title="Double click to edit price inline"
                      >
                        {formatKesPrice(p.price)}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleToggleFeatured(p.id, p.is_featured)}
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-bold border transition",
                        p.is_featured
                          ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                          : "bg-neutral-50 text-neutral-600 border-neutral-100 hover:bg-[#FAFAFA]"
                      )}
                    >
                      {p.is_featured ? "Featured" : "Standard"}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1.5">
                      <Link
                        href={`/dashboard/products/${p.id}/edit`}
                        className="rounded-lg border border-[#ECECEC] bg-white px-2.5 py-1.2 text-xs font-bold text-[#111111] shadow-sm hover:bg-[#FAFAFA]"
                      >
                        Edit
                      </Link>
                      <DeleteWithConfirm
                        action={deleteProductAction}
                        id={p.id}
                        confirmMessage={`Delete product "${p.name}"?`}
                        extraHidden={{ slug_hint: p.slug }}
                      >
                        <button
                          type="submit"
                          className="rounded-lg border border-red-200 bg-white px-2.5 py-1.2 text-xs font-bold text-red-600 shadow-sm hover:bg-red-50"
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
      </div>

      {/* Mobile Card Grid */}
      <div className="grid gap-3.5 md:hidden">
        {paginatedProducts.map((p) => (
          <div key={`m-${p.id}`} className="rounded-xl border border-[#ECECEC] bg-white p-4.5 shadow-sm space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="text-sm font-black text-[#111111] leading-snug">{p.name}</h4>
                <p className="text-[10px] text-neutral-500 font-mono mt-0.5">{p.slug}</p>
              </div>
              <button
                onClick={() => handleToggleFeatured(p.id, p.is_featured)}
                className={cn(
                  "rounded-full px-2 py-0.5 text-[9px] font-bold border",
                  p.is_featured
                    ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                    : "bg-neutral-50 text-neutral-600 border-neutral-100"
                )}
              >
                {p.is_featured ? "Featured" : "Standard"}
              </button>
            </div>

            <div className="flex items-center justify-between border-t border-[#FAFAFA] pt-3 text-xs">
              <div>
                <span className="text-[10px] text-neutral-500 font-semibold uppercase">Category</span>
                <p className="font-bold text-[#111111]">{p.categories?.name ?? "—"}</p>
              </div>

              <div>
                <span className="text-[10px] text-neutral-500 font-semibold uppercase">Price</span>
                <p className="font-black text-[#111111] tabular-nums">{formatKesPrice(p.price)}</p>
              </div>
            </div>

            <div className="flex gap-1.5 border-t border-[#FAFAFA] pt-3 justify-end">
              <Link
                href={`/dashboard/products/${p.id}/edit`}
                className="rounded-lg border border-[#ECECEC] bg-white px-3 py-1.5 text-xs font-bold text-[#111111]"
              >
                Edit
              </Link>
              <DeleteWithConfirm
                action={deleteProductAction}
                id={p.id}
                confirmMessage={`Delete "${p.name}"?`}
                extraHidden={{ slug_hint: p.slug }}
              >
                <button
                  type="submit"
                  className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-bold text-red-600"
                >
                  Delete
                </button>
              </DeleteWithConfirm>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination control footer */}
      <div className="flex items-center justify-between border-t border-[#ECECEC] pt-4 text-xs">
        <span className="font-bold text-[#888888]">
          Showing {Math.min(filteredProducts.length, (currentPage - 1) * pageSize + 1)} to{" "}
          {Math.min(filteredProducts.length, currentPage * pageSize)} of {filteredProducts.length} items
        </span>

        <div className="flex items-center gap-1">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((c) => c - 1)}
            className="rounded-lg border border-[#ECECEC] bg-white px-2.5 py-1.5 font-bold hover:bg-[#FAFAFA] disabled:opacity-40 disabled:hover:bg-white"
          >
            Prev
          </button>
          {Array.from({ length: totalPages }).map((_, idx) => (
            <button
              key={idx + 1}
              onClick={() => setCurrentPage(idx + 1)}
              className={cn(
                "rounded-lg px-2.5 py-1.5 font-bold transition",
                currentPage === idx + 1
                  ? "bg-[#E31B23] text-white"
                  : "border border-[#ECECEC] bg-white text-[#555555]"
              )}
            >
              {idx + 1}
            </button>
          ))}
          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((c) => c + 1)}
            className="rounded-lg border border-[#ECECEC] bg-white px-2.5 py-1.5 font-bold hover:bg-[#FAFAFA] disabled:opacity-40 disabled:hover:bg-white"
          >
            Next
          </button>
        </div>
      </div>

      {/* Bulk Delete Confirm dialog */}
      {showBulkDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-2xl border border-[#ECECEC] space-y-4 animate-in zoom-in-95 duration-150">
            <div className="text-center">
              <h4 className="text-sm font-black text-[#111111] uppercase tracking-tight">Bulk Delete Products</h4>
              <p className="mt-2 text-xs text-[#555555] font-semibold leading-relaxed">
                Are you sure you want to permanently delete these {selectedIds.size} products? This action is irreversible.
              </p>
            </div>
            <div className="flex gap-2.5">
              <button
                onClick={() => setShowBulkDeleteConfirm(false)}
                disabled={bulkActionPending}
                className="flex-1 rounded-lg border border-[#ECECEC] bg-white py-2 text-xs font-bold text-[#555555] hover:bg-[#FAFAFA]"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkDelete}
                disabled={bulkActionPending}
                className="flex-1 rounded-lg bg-red-600 py-2 text-xs font-bold text-white shadow-sm hover:bg-red-700 disabled:opacity-50"
              >
                {bulkActionPending ? "Deleting..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
