"use client";

import { useMemo, useState, type ReactNode } from "react";

import { ProductCard } from "@/components/products/ProductCard";
import { ParentProductCard } from "@/components/products/ParentProductCard";
import { SchoolProductCard } from "@/components/products/SchoolProductCard";
import { catalogProductGridClass } from "@/components/products/productCardClasses";
import { sortCategoriesByDisplayOrder } from "@/lib/categories/display-order";
import { cn } from "@/lib/utils";
import type { CategoryRow, CategoryType, ProductWithCategory } from "@/lib/supabase/types";

function productMatchesSearch(product: ProductWithCategory, q: string): boolean {
  const trimmed = q.trim();
  if (!trimmed) return true;
  const s = trimmed.toLowerCase();
  const name = product.name.toLowerCase();
  const desc = (product.description ?? "").toLowerCase();
  const cat = (product.categories?.name ?? "").toLowerCase();
  const grade = (product.grade ?? "").toLowerCase();
  return name.includes(s) || desc.includes(s) || cat.includes(s) || grade.includes(s);
}

export type CatalogWithFiltersProps = {
  products: ProductWithCategory[];
  categories: CategoryRow[];
  sourcePage: string;
  variant: "product" | "parent" | "school";
  /** When set (e.g. from `/products?category=books`), the catalog opens with this filter applied. */
  initialCategoryType?: CategoryType | "all";
  /** Optional content between filters and the grid (e.g. school pricing callout). */
  children?: ReactNode;
  className?: string;
};

export function CatalogWithFilters({
  products,
  categories,
  sourcePage,
  variant,
  initialCategoryType,
  children,
  className,
}: CatalogWithFiltersProps) {
  const [query, setQuery] = useState("");
  const [selectedType, setSelectedType] = useState<CategoryType | "all">(
    () => initialCategoryType ?? "all",
  );

  const filtered = useMemo(() => {
    return products.filter((p) => {
      if (selectedType !== "all" && p.categories?.type !== selectedType) return false;
      if (!productMatchesSearch(p, query)) return false;
      return true;
    });
  }, [products, query, selectedType]);

  const sortedCategories = useMemo(() => sortCategoriesByDisplayOrder(categories), [categories]);

  return (
    <div className={cn("mt-6 space-y-9 md:mt-8 md:space-y-10", className)}>
      <div className="mx-auto w-full max-w-2xl">
        <div className="rounded-2xl bg-white p-5 shadow-[var(--shadow-sm)] sm:p-5 md:p-6">
          <label className="sr-only" htmlFor="catalog-search">
            Search products
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-neutral-400" aria-hidden>
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                />
              </svg>
            </span>
            <input
              id="catalog-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, subject, or category…"
              autoComplete="off"
              className="w-full rounded-xl bg-neutral-50/50 py-3 pl-10 pr-4 text-sm text-neutral-900 shadow-inner outline-none transition placeholder:text-neutral-400 focus:bg-white focus:ring-2 focus:ring-primary/25"
            />
          </div>

          {sortedCategories.length > 0 ? (
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2 pt-4">
              <button
                type="button"
                onClick={() => setSelectedType("all")}
                className={cn(
                  "rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors shadow-[var(--shadow-sm)]",
                  selectedType === "all"
                    ? "bg-primary/10 text-primary"
                    : "bg-white text-neutral-700 hover:bg-neutral-50",
                )}
              >
                All
              </button>
              {sortedCategories.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedType(c.type)}
                  className={cn(
                    "rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors shadow-[var(--shadow-sm)]",
                    selectedType === c.type
                      ? "bg-primary/10 text-primary"
                      : "bg-white text-neutral-700 hover:bg-neutral-50",
                  )}
                >
                  {c.name}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      {children}

      {filtered.length === 0 ? (
        <p className="mx-auto max-w-lg rounded-2xl bg-neutral-50/90 px-6 py-10 text-center text-sm leading-relaxed text-neutral-700 shadow-[var(--shadow-sm)]">
          No products match your search or category. Try another keyword or choose &quot;All&quot;.
        </p>
      ) : (
        <ul className={catalogProductGridClass}>
          {filtered.map((product) => (
            <li key={product.id}>
              {variant === "product" ? (
                <ProductCard product={product} sourcePage={sourcePage} />
              ) : variant === "parent" ? (
                <ParentProductCard product={product} sourcePage={sourcePage} />
              ) : (
                <SchoolProductCard product={product} sourcePage={sourcePage} />
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
