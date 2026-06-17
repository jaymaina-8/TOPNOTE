"use client";

import type { BookSubcategoryRow, BookTypeFilter } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

type Props = {
  value: BookTypeFilter;
  bookSubcategories: readonly BookSubcategoryRow[];
  onChange: (value: BookTypeFilter) => void;
  className?: string;
};

export function BookTypeTabs({ value, bookSubcategories, onChange, className }: Props) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)} role="tablist" aria-label="Book type filter">
      <button
        type="button"
        role="tab"
        aria-selected={value === "all"}
        onClick={() => onChange("all")}
        className={tabClassName(value === "all")}
      >
        All
      </button>
      {bookSubcategories.map((subcategory) => {
        const active = value === subcategory.slug;
        return (
          <button
            key={subcategory.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(subcategory.slug)}
            className={tabClassName(active)}
          >
            {subcategory.name}
          </button>
        );
      })}
    </div>
  );
}

function tabClassName(active: boolean): string {
  return cn(
    "inline-flex min-h-10 items-center justify-center rounded-full border px-4 py-2 text-sm font-semibold transition-colors",
    active
      ? "border-primary bg-primary text-white shadow-sm"
      : "border-neutral-200 bg-white text-neutral-700 hover:border-primary/20 hover:bg-primary/5 hover:text-primary",
  );
}