"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { Database } from "@/lib/supabase/types";

type Notification = Database["public"]["Tables"]["notifications"]["Row"] & {
  read_at?: string | null;
  updated_at?: string | null;
  reference_type?: string | null;
  reference_id?: string | null;
};

interface NotificationCardProps {
  notification: Notification;
  onMarkAsRead: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onCloseCenter?: () => void;
  isNew?: boolean;
}

export function formatTimeAgo(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-KE", { day: "numeric", month: "short" });
}

const TYPE_CONFIG: Record<
  string,
  {
    label: string;
    borderColor: string;
    bgUnread: string;
    badgeBg: string;
    badgeText: string;
    iconBg: string;
    iconText: string;
    dotColor: string;
    icon: React.ReactNode;
  }
> = {
  exam_order: {
    label: "Exam Order",
    borderColor: "border-l-red-500",
    bgUnread: "bg-red-50/30",
    badgeBg: "bg-red-50",
    badgeText: "text-red-600",
    iconBg: "bg-red-50",
    iconText: "text-red-600",
    dotColor: "bg-red-500",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
        <path d="M5.25 6.375a4.125 4.125 0 1 1 8.25 0 4.125 4.125 0 0 1-8.25 0ZM2.25 19.125a7.125 7.125 0 0 1 14.25 0v.003l-.001.119a.75.75 0 0 1-.363.63 13.067 13.067 0 0 1-6.761 1.873c-2.472 0-4.786-.684-6.76-1.873a.75.75 0 0 1-.364-.63l-.001-.122Z" />
      </svg>
    ),
  },
  inquiry: {
    label: "Inquiry",
    borderColor: "border-l-blue-500",
    bgUnread: "bg-blue-50/20",
    badgeBg: "bg-blue-50",
    badgeText: "text-blue-600",
    iconBg: "bg-blue-50",
    iconText: "text-blue-600",
    dotColor: "bg-blue-500",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
        <path fillRule="evenodd" d="M4.848 2.771A49.144 49.144 0 0 1 12 2.25c2.43 0 4.817.178 7.152.52 1.978.292 3.348 2.024 3.348 3.97v6.02c0 1.946-1.37 3.678-3.348 3.97a48.901 48.901 0 0 1-3.476.383.39.39 0 0 0-.297.17l-2.755 4.133a.75.75 0 0 1-1.248 0l-2.755-4.133a.39.39 0 0 0-.297-.17 48.9 48.9 0 0 1-3.476-.384c-1.978-.29-3.348-2.024-3.348-3.97V6.741c0-1.946 1.37-3.68 3.348-3.97Z" clipRule="evenodd" />
      </svg>
    ),
  },
  payment: {
    label: "Payment",
    borderColor: "border-l-green-500",
    bgUnread: "bg-green-50/20",
    badgeBg: "bg-green-50",
    badgeText: "text-green-700",
    iconBg: "bg-green-50",
    iconText: "text-green-700",
    dotColor: "bg-green-500",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
        <path d="M4.5 3.75a3 3 0 0 0-3 3v.75h21v-.75a3 3 0 0 0-3-3h-15ZM22.5 9.75h-21v7.5a3 3 0 0 0 3 3h15a3 3 0 0 0 3-3v-7.5ZM18 15.75a.75.75 0 1 1 0 1.5.75.75 0 0 1 0-1.5ZM15.75 15a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Z" />
      </svg>
    ),
  },
  testimonial: {
    label: "Testimonial",
    borderColor: "border-l-purple-500",
    bgUnread: "bg-purple-50/20",
    badgeBg: "bg-purple-50",
    badgeText: "text-purple-600",
    iconBg: "bg-purple-50",
    iconText: "text-purple-600",
    dotColor: "bg-purple-500",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
        <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z" clipRule="evenodd" />
      </svg>
    ),
  },
  product: {
    label: "Product",
    borderColor: "border-l-indigo-500",
    bgUnread: "bg-indigo-50/20",
    badgeBg: "bg-indigo-50",
    badgeText: "text-indigo-600",
    iconBg: "bg-indigo-50",
    iconText: "text-indigo-600",
    dotColor: "bg-indigo-500",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
        <path fillRule="evenodd" d="M7.5 6v.75H5.513c-.96 0-1.764.724-1.865 1.679l-1.263 12A1.875 1.875 0 0 0 4.25 22.5h15.5a1.875 1.875 0 0 0 1.865-2.071l-1.263-12a1.875 1.875 0 0 0-1.865-1.679H16.5V6a4.5 4.5 0 1 0-9 0ZM12 3a3 3 0 0 0-3 3v.75h6V6a3 3 0 0 0-3-3Zm-3 8.25a3 3 0 1 0 6 0v-.75a.75.75 0 0 1 1.5 0v.75a4.5 4.5 0 1 1-9 0v-.75a.75.75 0 0 1 1.5 0v.75Z" clipRule="evenodd" />
      </svg>
    ),
  },
  warning: {
    label: "Warning",
    borderColor: "border-l-orange-500",
    bgUnread: "bg-orange-50/20",
    badgeBg: "bg-orange-50",
    badgeText: "text-orange-600",
    iconBg: "bg-orange-50",
    iconText: "text-orange-600",
    dotColor: "bg-orange-500",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
        <path fillRule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003ZM12 8.25a.75.75 0 0 1 .75.75v3.75a.75.75 0 0 1-1.5 0V9a.75.75 0 0 1 .75-.75Zm0 8.25a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" clipRule="evenodd" />
      </svg>
    ),
  },
};

const FALLBACK_CONFIG = {
  label: "System",
  borderColor: "border-l-neutral-400",
  bgUnread: "bg-neutral-50/50",
  badgeBg: "bg-neutral-100",
  badgeText: "text-neutral-600",
  iconBg: "bg-neutral-100",
  iconText: "text-neutral-500",
  dotColor: "bg-neutral-400",
  icon: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
      <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm8.706-1.442c1.146-.573 2.437.463 2.126 1.706l-.709 2.836.042-.02a.75.75 0 0 1 .67 1.34l-.04.022c-1.147.573-2.438-.463-2.127-1.706l.71-2.836-.042.02a.75.75 0 1 1-.671-1.34l.041-.022ZM12 9a.75.75 0 1 0 0-1.5A.75.75 0 0 0 12 9Z" clipRule="evenodd" />
    </svg>
  ),
};

function formatKsh(amount: number) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    minimumFractionDigits: 0,
  })
    .format(amount)
    .replace("KES", "KSh");
}

export function NotificationCard({
  notification,
  onMarkAsRead,
  onDelete,
  onCloseCenter,
  isNew = false,
}: NotificationCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isMarkingRead, setIsMarkingRead] = useState(false);

  const { id, title, message, type, metadata, is_read, created_at } = notification;
  const meta = (metadata || {}) as {
    order_id?: string;
    order_number?: string;
    school_name?: string;
    total_amount?: number;
    total_papers?: number;
    session?: string;
  };

  const cfg = TYPE_CONFIG[type] ?? FALLBACK_CONFIG;

  const handleMarkAsRead = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (is_read || isMarkingRead) return;
    setIsMarkingRead(true);
    try {
      await onMarkAsRead(id);
    } finally {
      setIsMarkingRead(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isDeleting) return;
    setIsDeleting(true);
    try {
      await onDelete(id);
    } catch {
      setIsDeleting(false);
    }
  };

  return (
    <div
      className={cn(
        // Base
        "group relative flex gap-4 border-l-4 p-5 transition-all duration-200",
        // Color strip
        cfg.borderColor,
        // Unread vs read backgrounds
        !is_read ? cfg.bgUnread : "bg-white",
        // Hover lift
        "hover:-translate-y-px hover:shadow-md hover:shadow-neutral-200/60 hover:z-10",
        // Bottom separator
        "border-b border-neutral-100",
        // New item entry animation
        isNew && "animate-in fade-in slide-in-from-top-2 duration-300 animate-highlight-fade",
        // Loading states
        isDeleting && "opacity-40 pointer-events-none",
        isMarkingRead && "opacity-70"
      )}
    >
      {/* Type icon */}
      <div
        className={cn(
          "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset ring-neutral-200/50",
          cfg.iconBg,
          cfg.iconText
        )}
      >
        {cfg.icon}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-2">
        {/* Top row: badge + unread dot + time */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {!is_read && (
              <span className="relative flex h-2 w-2 shrink-0">
                <span className={cn("absolute inline-flex h-full w-full animate-ping rounded-full opacity-75", cfg.dotColor)} />
                <span className={cn("relative inline-flex h-2 w-2 rounded-full", cfg.dotColor)} />
              </span>
            )}
            <span
              className={cn(
                "inline-flex items-center rounded-full px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-wider",
                cfg.badgeBg,
                cfg.badgeText
              )}
            >
              {cfg.label}
            </span>
          </div>
          <span className="shrink-0 text-[10.5px] font-semibold text-neutral-400">
            {formatTimeAgo(created_at)}
          </span>
        </div>

        {/* Title and message */}
        <div>
          <h4 className={cn(
            "text-[13px] tracking-tight leading-snug",
            !is_read ? "font-extrabold text-neutral-900" : "font-normal text-neutral-600"
          )}>
            {title}
          </h4>
          <p className="mt-0.5 text-[12px] text-neutral-500 font-medium leading-relaxed">
            {message}
          </p>
        </div>

        {/* Exam order metadata table */}
        {type === "exam_order" && meta.order_id && (
          <div className="rounded-xl border border-neutral-100 bg-white overflow-hidden shadow-sm">
            <div className="grid grid-cols-2 divide-x divide-neutral-100">
              {meta.school_name && (
                <div className="p-3">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-neutral-400">School</p>
                  <p className="mt-0.5 text-[12px] font-bold text-neutral-800 leading-tight">{meta.school_name}</p>
                </div>
              )}
              {meta.order_number && (
                <div className="p-3">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-neutral-400">Order</p>
                  <code className="mt-0.5 block text-[12px] font-black text-red-600">{meta.order_number}</code>
                </div>
              )}
            </div>
            {(meta.total_papers || meta.total_amount) && (
              <div className="grid grid-cols-2 divide-x divide-neutral-100 border-t border-neutral-100">
                {meta.total_papers && (
                  <div className="p-3">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-neutral-400">Students</p>
                    <p className="mt-0.5 text-[13px] font-black text-neutral-900">{meta.total_papers}</p>
                  </div>
                )}
                {meta.total_amount && (
                  <div className="p-3">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-neutral-400">Total</p>
                    <p className="mt-0.5 text-[13px] font-black text-neutral-900">{formatKsh(meta.total_amount)}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* General metadata for other types */}
        {type !== "exam_order" && Object.keys(meta).length > 0 && (
          <div className="rounded-xl border border-neutral-100 bg-neutral-50 p-3 space-y-1.5">
            {Object.entries(meta).map(([key, value]) => {
              if (typeof value === "object" || key.endsWith("_id")) return null;
              const cleanKey = key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
              return (
                <div key={key} className="flex items-center justify-between gap-3">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-neutral-400">{cleanKey}</span>
                  <span className="text-[11px] font-bold text-neutral-700 truncate max-w-[180px]">{String(value)}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex items-center gap-2 pt-1">
          {type === "exam_order" && meta.order_id && (
            <Link
              href="/dashboard/orders"
              onClick={onCloseCenter}
              className="inline-flex items-center gap-1.5 rounded-lg bg-neutral-900 px-3 py-1.5 text-[11px] font-bold text-white transition-all hover:bg-neutral-700 active:scale-95 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:ring-offset-1"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3">
                <path fillRule="evenodd" d="M3 10a.75.75 0 0 1 .75-.75h10.638L10.23 5.29a.75.75 0 1 1 1.04-1.08l5.5 5.25a.75.75 0 0 1 0 1.08l-5.5 5.25a.75.75 0 1 1-1.04-1.08l4.158-3.96H3.75A.75.75 0 0 1 3 10Z" clipRule="evenodd" />
              </svg>
              View Order
            </Link>
          )}

          {!is_read && (
            <button
              onClick={handleMarkAsRead}
              disabled={isMarkingRead}
              className="inline-flex items-center gap-1 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-[11px] font-bold text-neutral-600 transition-all hover:bg-neutral-50 hover:text-neutral-900 active:scale-95 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-neutral-200"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3 w-3">
                <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
              </svg>
              Mark Read
            </button>
          )}

          <button
            onClick={handleDelete}
            disabled={isDeleting}
            title="Delete notification"
            className="ml-auto inline-flex items-center gap-1 rounded-lg border border-transparent px-2.5 py-1.5 text-[11px] font-bold text-neutral-400 transition-all hover:border-red-200 hover:bg-red-50 hover:text-red-600 active:scale-95 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-red-100"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
              <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 3.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z" clipRule="evenodd" />
            </svg>
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
