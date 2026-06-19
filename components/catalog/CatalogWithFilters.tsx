"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { BookTypeTabs } from "@/components/catalog/BookTypeTabs";
import { ProductCard } from "@/components/products/ProductCard";
import { ParentProductCard } from "@/components/products/ParentProductCard";
import { SchoolProductCard } from "@/components/products/SchoolProductCard";
import { catalogProductGridClass } from "@/components/products/productCardClasses";
import { sortCategoriesByDisplayOrder } from "@/lib/categories/display-order";
import { parseBookType } from "@/lib/book-types";
import { cn } from "@/lib/utils";
import type { BookSubcategoryRow, BookTypeFilter, CategoryRow, CategoryType, ProductWithCategory } from "@/lib/supabase/types";

function gradeSortKey(grade: string | null): number {
  if (grade == null || grade.trim() === "") return 10_000;
  const match = grade.match(/\d+/);
  return match ? parseInt(match[0], 10) : 10_000;
}

/** Within a single category: grade first, then name (never mix category order). */
function sortProductsWithinCategory(products: ProductWithCategory[]): ProductWithCategory[] {
  return [...products].sort((a, b) => {
    const diff = gradeSortKey(a.grade) - gradeSortKey(b.grade);
    if (diff !== 0) return diff;
    return a.name.localeCompare(b.name);
  });
}

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
  bookSubcategories: BookSubcategoryRow[];
  sourcePage: string;
  variant: "product" | "parent" | "school";
  /** When set (e.g. from `/products?category=books`), the catalog opens with this filter applied. */
  initialCategoryType?: CategoryType | "all";
  initialBookType?: BookTypeFilter;
  /** Optional content between filters and the grid (e.g. school pricing callout). */
  children?: ReactNode;
  className?: string;
};

function ListingCard({
  product,
  variant,
  sourcePage,
}: {
  product: ProductWithCategory;
  variant: CatalogWithFiltersProps["variant"];
  sourcePage: string;
}) {
  if (variant === "product") {
    return <ProductCard product={product} sourcePage={sourcePage} />;
  }
  if (variant === "parent") {
    return <ParentProductCard product={product} sourcePage={sourcePage} />;
  }
  return <SchoolProductCard product={product} sourcePage={sourcePage} />;
}

export function CatalogWithFilters({
  products,
  categories,
  bookSubcategories,
  sourcePage,
  variant,
  initialCategoryType,
  initialBookType,
  children,
  className,
}: CatalogWithFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");
  const [selectedType, setSelectedType] = useState<CategoryType | "all">(
    () => initialCategoryType ?? "all",
  );
  const [selectedBookType, setSelectedBookType] = useState<BookTypeFilter>(() => initialBookType ?? "all");
  const searchParamsString = searchParams.toString();

  useEffect(() => {
    const urlBookType = parseBookType(searchParams.get("bookType") ?? undefined, bookSubcategories.map((subcategory) => subcategory.slug));
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedBookType(urlBookType);
    // Intentionally react to URL changes only; state is otherwise controlled by tab clicks.
  }, [bookSubcategories, searchParams, searchParamsString]);

  const updateBookType = (value: BookTypeFilter) => {
    setSelectedBookType(value);

    const params = new URLSearchParams(searchParams.toString());
    if (value === "all") {
      params.delete("bookType");
    } else {
      params.set("bookType", value);
    }

    const nextUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    router.replace(nextUrl, { scroll: false });
  };

  const filtered = useMemo(() => {
    return products.filter((p) => {
      if (selectedType !== "all" && p.categories?.type !== selectedType) return false;
      if (p.categories?.type === "books" && selectedBookType !== "all" && p.bookSubcategory?.slug !== selectedBookType) return false;
      if (!productMatchesSearch(p, query)) return false;
      return true;
    });
  }, [products, query, selectedType, selectedBookType]);

  const sortedCategories = useMemo(() => sortCategoriesByDisplayOrder(categories), [categories]);

  const groupedProducts = useMemo(() => {
    return filtered.reduce(
      (acc, product) => {
        const key = product.categories?.slug ?? "uncategorized";
        if (!acc[key]) acc[key] = [];
        acc[key].push(product);
        return acc;
      },
      {} as Record<string, ProductWithCategory[]>,
    );
  }, [filtered]);

  const knownCategorySlugs = useMemo(
    () => new Set(sortedCategories.map((c) => c.slug)),
    [sortedCategories],
  );

  const extraGroupSlugs = useMemo(() => {
    return Object.keys(groupedProducts)
      .filter((slug) => !knownCategorySlugs.has(slug))
      .sort((a, b) => a.localeCompare(b));
  }, [groupedProducts, knownCategorySlugs]);

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
        <div className="space-y-10 md:space-y-12">
          {sortedCategories.map((category) => {
            const rawItems = groupedProducts[category.slug] ?? [];
            const items = sortProductsWithinCategory(
              category.slug === "books" && selectedBookType !== "all"
                ? rawItems.filter((product) => product.bookSubcategory?.slug === selectedBookType)
                : rawItems,
            );
            if (items.length === 0) return null;
            return (
              <section key={category.slug} className="space-y-4 md:space-y-5" aria-labelledby={`catalog-heading-${category.slug}`}>
                <div className="space-y-3">
                  <h2
                    id={`catalog-heading-${category.slug}`}
                    className="text-lg font-bold tracking-tight text-neutral-900 md:text-xl"
                  >
                    {category.slug === "books" ? category.name.toUpperCase() : category.name}
                  </h2>
                  {category.slug === "books" ? (
                    <BookTypeTabs
                      value={selectedBookType}
                      bookSubcategories={bookSubcategories}
                      onChange={updateBookType}
                    />
                  ) : null}
                </div>
                <ul className={catalogProductGridClass}>
                  {items.map((product) => (
                    <li key={product.id}>
                      <ListingCard product={product} variant={variant} sourcePage={sourcePage} />
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
          {extraGroupSlugs.map((slug) => {
            const rawItems = groupedProducts[slug] ?? [];
            const items = sortProductsWithinCategory(rawItems);
            if (items.length === 0) return null;
            const title = slug === "uncategorized" ? "Other products" : slug;
            return (
              <section key={slug} className="space-y-4 md:space-y-5" aria-labelledby={`catalog-heading-extra-${slug}`}>
                <h2
                  id={`catalog-heading-extra-${slug}`}
                  className="text-lg font-bold tracking-tight text-neutral-900 md:text-xl"
                >
                  {title}
                </h2>
                <ul className={catalogProductGridClass}>
                  {items.map((product) => (
                    <li key={product.id}>
                      <ListingCard product={product} variant={variant} sourcePage={sourcePage} />
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
