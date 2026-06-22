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
    <div
      className={cn(
        "no-scrollbar flex overflow-x-auto pb-1.5 pt-0.5 sm:flex-wrap sm:gap-2 sm:overflow-visible sm:pb-0",
        className,
      )}
      role="tablist"
      aria-label="Book type filter"
    >
      <div className="flex gap-2.5 sm:gap-2">
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
              <span className="whitespace-nowrap">{subcategory.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function tabClassName(active: boolean): string {
  return cn(
    "inline-flex min-h-[2.5rem] items-center justify-center rounded-full border px-5 py-2 text-[13px] font-bold transition-all duration-200 sm:min-h-10 sm:text-sm",
    active
      ? "border-primary bg-primary text-white shadow-md shadow-primary/20"
      : "border-neutral-200 bg-white text-neutral-600 hover:border-primary/30 hover:bg-neutral-50 hover:text-primary",
  );
}