"use client";

import { cn } from "@/lib/utils";

export type FilterType =
  | "all"
  | "unread"
  | "orders"
  | "payments"
  | "inquiries"
  | "products"
  | "testimonials"
  | "system";

export interface FilterCounts {
  all: number;
  unread: number;
  orders: number;
  payments: number;
  inquiries: number;
  products: number;
  testimonials: number;
  system: number;
}

interface NotificationFiltersProps {
  activeFilter: FilterType;
  onChangeFilter: (filter: FilterType) => void;
  counts: FilterCounts;
}

const TABS: { id: FilterType; label: string }[] = [
  { id: "all",          label: "All" },
  { id: "unread",       label: "Unread" },
  { id: "orders",       label: "Exam Orders" },
  { id: "payments",     label: "Payments" },
  { id: "inquiries",    label: "Inquiries" },
  { id: "products",     label: "Products" },
  { id: "testimonials", label: "Testimonials" },
  { id: "system",       label: "System" },
];

export function NotificationFilters({
  activeFilter,
  onChangeFilter,
  counts,
}: NotificationFiltersProps) {
  return (
    <div
      className="flex gap-1.5 overflow-x-auto scrollbar-none py-0.5"
      role="tablist"
      aria-label="Filter notifications"
    >
      {TABS.map((tab) => {
        const isActive = activeFilter === tab.id;
        const count = counts[tab.id];

        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            aria-controls="notification-timeline"
            id={`filter-tab-${tab.id}`}
            onClick={() => onChangeFilter(tab.id)}
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold transition-all",
              "select-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-1",
              isActive
                ? "border-neutral-900 bg-neutral-900 text-white shadow-sm"
                : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300 hover:bg-neutral-50 hover:text-neutral-900"
            )}
          >
            <span className="whitespace-nowrap">{tab.label}</span>
            {count > 0 && (
              <span
                className={cn(
                  "flex h-4.5 min-w-[18px] items-center justify-center rounded-full px-1 text-[9px] font-black leading-none",
                  isActive ? "bg-white/20 text-white" : "bg-neutral-100 text-neutral-600"
                )}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
