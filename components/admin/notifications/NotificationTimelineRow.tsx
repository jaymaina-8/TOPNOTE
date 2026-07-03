"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import type { Notification } from "@/components/admin/NotificationProvider";

/* ─────────────────────────────────────────────
   Helpers
───────────────────────────────────────────── */

export function formatTimeAgo(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(isoString).toLocaleDateString("en-KE", { day: "numeric", month: "short" });
}

function formatKsh(amount: number) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    minimumFractionDigits: 0,
  })
    .format(amount)
    .replace("KES", "KSh");
}

/* ─────────────────────────────────────────────
   Type config
───────────────────────────────────────────── */

const TYPE_CONFIG: Record<
  string,
  { label: string; dotBg: string; iconBg: string; iconColor: string; accentBg: string; accentBorder: string; icon: React.ReactNode }
> = {
  exam_order: {
    label: "Exam Order",
    dotBg: "bg-red-500",
    iconBg: "bg-red-50",
    iconColor: "text-red-600",
    accentBg: "bg-red-50/40",
    accentBorder: "border-l-red-400",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
        <path d="M7 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM14.5 9a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM1.615 16.428a1.224 1.224 0 0 1-.569-1.175 6.002 6.002 0 0 1 11.908 0c.058.467-.172.92-.57 1.174A9.953 9.953 0 0 1 7 18a9.953 9.953 0 0 1-5.385-1.572ZM14.5 16h-.106c.07-.297.088-.611.048-.933a7.47 7.47 0 0 0-1.588-3.755 4.502 4.502 0 0 1 5.874 2.636.818.818 0 0 1-.36.98A7.465 7.465 0 0 1 14.5 16Z" />
      </svg>
    ),
  },
  inquiry: {
    label: "Inquiry",
    dotBg: "bg-blue-500",
    iconBg: "bg-blue-50",
    iconColor: "text-blue-600",
    accentBg: "bg-blue-50/30",
    accentBorder: "border-l-blue-400",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
        <path fillRule="evenodd" d="M10 2c-2.236 0-4.43.18-6.57.524C1.993 2.755 1 4.014 1 5.426v5.148c0 1.413.993 2.67 2.43 2.902.848.137 1.705.248 2.57.331v3.443a.75.75 0 0 0 1.28.53l3.58-3.579a.78.78 0 0 1 .527-.224 41.202 41.202 0 0 0 5.183-.5c1.437-.232 2.43-1.49 2.43-2.903V5.426c0-1.413-.993-2.67-2.43-2.902A41.289 41.289 0 0 0 10 2Zm0 7a1 1 0 1 0 0-2 1 1 0 0 0 0 2ZM8 8a1 1 0 1 1-2 0 1 1 0 0 1 2 0Zm5 1a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
      </svg>
    ),
  },
  payment: {
    label: "Payment",
    dotBg: "bg-green-500",
    iconBg: "bg-green-50",
    iconColor: "text-green-700",
    accentBg: "bg-green-50/30",
    accentBorder: "border-l-green-400",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
        <path fillRule="evenodd" d="M1 4a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V4Zm12 4a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM4 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm13-1a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z" clipRule="evenodd" />
      </svg>
    ),
  },
  testimonial: {
    label: "Testimonial",
    dotBg: "bg-purple-500",
    iconBg: "bg-purple-50",
    iconColor: "text-purple-600",
    accentBg: "bg-purple-50/20",
    accentBorder: "border-l-purple-400",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
        <path fillRule="evenodd" d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401Z" clipRule="evenodd" />
      </svg>
    ),
  },
  product: {
    label: "Product",
    dotBg: "bg-indigo-500",
    iconBg: "bg-indigo-50",
    iconColor: "text-indigo-600",
    accentBg: "bg-indigo-50/20",
    accentBorder: "border-l-indigo-400",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
        <path fillRule="evenodd" d="M6 5v1H4.667a1.75 1.75 0 0 0-1.743 1.598l-.826 9.5A1.75 1.75 0 0 0 3.84 19H16.16a1.75 1.75 0 0 0 1.742-1.902l-.826-9.5A1.75 1.75 0 0 0 15.333 6H14V5a4 4 0 0 0-8 0Zm4-2.5A2.5 2.5 0 0 0 7.5 5v1h5V5A2.5 2.5 0 0 0 10 2.5ZM7.5 10a2.5 2.5 0 0 0 5 0V8.75a.75.75 0 0 1 1.5 0V10a4 4 0 0 1-8 0V8.75a.75.75 0 0 1 1.5 0V10Z" clipRule="evenodd" />
      </svg>
    ),
  },
  warning: {
    label: "Warning",
    dotBg: "bg-orange-500",
    iconBg: "bg-orange-50",
    iconColor: "text-orange-600",
    accentBg: "bg-orange-50/20",
    accentBorder: "border-l-orange-400",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
        <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495ZM10 5a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 5Zm0 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
      </svg>
    ),
  },
};

const FALLBACK_CONFIG = TYPE_CONFIG.warning;

/* ─────────────────────────────────────────────
   Props
───────────────────────────────────────────── */

interface NotificationTimelineRowProps {
  notification: Notification;
  isSelected: boolean;
  isNew: boolean;
  onCheckboxChange: (id: string, e: React.MouseEvent<HTMLInputElement>) => void;
  onRowClick: (id: string) => void;
  onMarkAsRead: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

/* ─────────────────────────────────────────────
   Component
───────────────────────────────────────────── */

export function NotificationTimelineRow({
  notification,
  isSelected,
  isNew,
  onCheckboxChange,
  onRowClick,
  onMarkAsRead,
  onDelete,
}: NotificationTimelineRowProps) {
  const [isMarkingRead, setIsMarkingRead] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const { id, title, type, is_read, created_at, metadata } = notification;
  const meta = (metadata ?? {}) as {
    school_name?: string;
    order_number?: string;
    total_papers?: number;
    total_amount?: number;
    customer_name?: string;
  };

  const cfg = TYPE_CONFIG[type] ?? FALLBACK_CONFIG;

  const handleMarkAsRead = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (is_read || isMarkingRead) return;
    setIsMarkingRead(true);
    try { await onMarkAsRead(id); } finally { setIsMarkingRead(false); }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isDeleting) return;
    setIsDeleting(true);
    try { await onDelete(id); } catch { setIsDeleting(false); }
  };

  return (
    <div
      role="row"
      aria-selected={isSelected}
      className={cn(
        "group relative flex items-start gap-3 border-l-[3px] px-4 py-3.5 transition-all duration-150",
        // Unread styling
        !is_read ? [cfg.accentBorder, cfg.accentBg] : "border-l-transparent bg-white",
        // Selected
        isSelected && "bg-blue-50/60 border-l-blue-400",
        // New item highlight
        isNew && "animate-highlight-fade",
        // Deleting fade
        isDeleting && "opacity-40 pointer-events-none",
        // Hover
        "hover:bg-neutral-50/80 cursor-pointer",
        // Bottom divider
        "border-b border-neutral-100/80"
      )}
      onClick={() => !isDeleting && onRowClick(id)}
    >
      {/* Checkbox */}
      <div
        className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        <input
          type="checkbox"
          checked={isSelected}
          aria-label={`Select notification: ${title}`}
          onChange={() => {}} // controlled via onClick below
          onClick={(e) => onCheckboxChange(id, e)}
          className="h-3.5 w-3.5 cursor-pointer rounded border-neutral-300 text-neutral-900 accent-neutral-900 focus:ring-1 focus:ring-neutral-400 focus:ring-offset-1"
        />
      </div>

      {/* Type icon */}
      <div
        className={cn(
          "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
          cfg.iconBg,
          cfg.iconColor
        )}
      >
        {cfg.icon}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Top line: badge + time */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            {!is_read && (
              <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", cfg.dotBg)} aria-hidden="true" />
            )}
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
              {cfg.label}
            </span>
          </div>
          <span className="shrink-0 text-[10.5px] font-medium text-neutral-400">
            {formatTimeAgo(created_at)}
          </span>
        </div>

        {/* Title */}
        <p className={cn(
          "mt-0.5 text-sm leading-snug",
          !is_read ? "font-black text-neutral-900" : "font-semibold text-neutral-700"
        )}>
          {title}
        </p>

        {/* Metadata sub-line */}
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
          {meta.school_name && (
            <span className="text-[11px] text-neutral-500 font-medium truncate max-w-[180px]">
              {meta.school_name}
            </span>
          )}
          {meta.order_number && (
            <code className="text-[10px] font-black text-red-500">
              {meta.order_number}
            </code>
          )}
          {meta.total_papers && (
            <span className="text-[11px] text-neutral-400">
              {meta.total_papers} Students
            </span>
          )}
          {meta.total_amount && (
            <span className="text-[11px] font-bold text-green-700">
              {formatKsh(meta.total_amount)}
            </span>
          )}
          {meta.customer_name && !meta.school_name && (
            <span className="text-[11px] text-neutral-500 font-medium">
              {meta.customer_name}
            </span>
          )}
        </div>
      </div>

      {/* Hover actions (right side) */}
      <div
        className={cn(
          "ml-auto flex shrink-0 items-center gap-1 opacity-0 transition-opacity duration-150",
          "group-hover:opacity-100",
          isMarkingRead || isDeleting ? "opacity-100" : ""
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {!is_read && (
          <button
            onClick={handleMarkAsRead}
            disabled={isMarkingRead}
            title="Mark as read"
            className="flex h-7 w-7 items-center justify-center rounded-md text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-green-600 disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-neutral-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
              <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
            </svg>
          </button>
        )}
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          title="Delete notification"
          className="flex h-7 w-7 items-center justify-center rounded-md text-neutral-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-red-100"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
            <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 3.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  );
}
