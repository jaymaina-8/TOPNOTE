"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { Notification } from "@/components/admin/NotificationProvider";

/* ─────────────────────────────────────────────
   Helpers
───────────────────────────────────────────── */

function formatTimeAgo(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const TYPE_DOT: Record<string, string> = {
  exam_order: "bg-red-500",
  payment:    "bg-green-500",
  inquiry:    "bg-blue-500",
  testimonial:"bg-purple-500",
  product:    "bg-indigo-500",
  warning:    "bg-orange-500",
};

const TYPE_LABEL: Record<string, string> = {
  exam_order:  "Exam Order",
  payment:     "Payment",
  inquiry:     "Inquiry",
  testimonial: "Testimonial",
  product:     "Product",
  warning:     "Warning",
};

/* ─────────────────────────────────────────────
   Types
───────────────────────────────────────────── */

interface BellPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: Notification[];
  onMarkAsRead: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

/* ─────────────────────────────────────────────
   Component
───────────────────────────────────────────── */

export function BellPreview({
  isOpen,
  onClose,
  notifications,
}: BellPreviewProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  /* ── Click-outside to close ── */
  useEffect(() => {
    if (!isOpen) return;

    const handleClick = (e: MouseEvent) => {
      const bell = document.getElementById("notification-bell-btn");
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        bell !== e.target &&
        !bell?.contains(e.target as Node)
      ) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isOpen, onClose]);

  /* ── ESC to close ── */
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const latest5 = notifications.slice(0, 5);
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-label="Recent notifications"
      className={cn(
        "absolute right-0 top-full z-50 mt-2 w-[350px]",
        "overflow-hidden rounded-2xl border border-neutral-200/80 bg-white",
        "shadow-[0_12px_40px_-8px_rgba(0,0,0,0.18),0_2px_12px_-4px_rgba(0,0,0,0.08)]",
        "animate-in fade-in slide-in-from-top-2 duration-200"
      )}
    >
      {/* ── Header ── */}
      <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-black text-neutral-900">Notifications</h3>
          {unreadCount > 0 && (
            <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-black text-white">
              {unreadCount}
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="rounded-lg p-1.5 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700 focus:outline-none focus:ring-2 focus:ring-neutral-200"
          aria-label="Close notifications preview"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
            <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
          </svg>
        </button>
      </div>

      {/* ── Notification rows ── */}
      {latest5.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-400">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-6 w-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
            </svg>
          </div>
          <p className="mt-3 text-xs font-bold text-neutral-700">You&apos;re all caught up</p>
          <p className="mt-1 text-[11px] text-neutral-400">No new notifications.</p>
        </div>
      ) : (
        <ul role="list" className="divide-y divide-neutral-50">
          {latest5.map((n) => {
            const meta = (n.metadata ?? {}) as { school_name?: string; order_number?: string };
            const dotColor = TYPE_DOT[n.type] ?? "bg-neutral-400";
            const label = TYPE_LABEL[n.type] ?? "System";

            return (
              <li key={n.id}>
                <Link
                  href="/dashboard/notifications"
                  onClick={onClose}
                  className={cn(
                    "flex items-start gap-3 px-4 py-3 transition-colors hover:bg-neutral-50",
                    !n.is_read && "bg-red-50/30"
                  )}
                >
                  {/* Unread dot */}
                  <div className="mt-1.5 flex h-5 w-5 shrink-0 items-center justify-center">
                    {!n.is_read ? (
                      <span className={cn("h-2 w-2 rounded-full", dotColor)} />
                    ) : (
                      <span className="h-2 w-2 rounded-full bg-neutral-200" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className={cn(
                        "text-[10px] font-bold uppercase tracking-wider",
                        !n.is_read ? "text-red-500" : "text-neutral-400"
                      )}>
                        {label}
                      </span>
                      <span className="shrink-0 text-[10px] text-neutral-400">
                        {formatTimeAgo(n.created_at)}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[12px] font-bold text-neutral-900 leading-snug truncate">
                      {n.title}
                    </p>
                    {meta.school_name && (
                      <p className="text-[11px] text-neutral-500 truncate">
                        {String(meta.school_name)}
                        {meta.order_number ? ` · ${String(meta.order_number)}` : ""}
                      </p>
                    )}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      {/* ── Footer ── */}
      <div className="border-t border-neutral-100 bg-neutral-50/60">
        <Link
          href="/dashboard/notifications"
          onClick={onClose}
          className="flex w-full items-center justify-center gap-1.5 py-3 text-xs font-bold text-neutral-600 transition-colors hover:text-neutral-900 hover:bg-neutral-100/60 focus:outline-none focus:ring-2 focus:ring-neutral-300 focus:ring-inset"
        >
          View all notifications
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
            <path fillRule="evenodd" d="M3 10a.75.75 0 0 1 .75-.75h10.638L10.23 5.29a.75.75 0 1 1 1.04-1.08l5.5 5.25a.75.75 0 0 1 0 1.08l-5.5 5.25a.75.75 0 1 1-1.04-1.08l4.158-3.96H3.75A.75.75 0 0 1 3 10Z" clipRule="evenodd" />
          </svg>
        </Link>
      </div>
    </div>
  );
}
