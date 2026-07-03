"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { Notification } from "@/components/admin/NotificationProvider";
import { formatTimeAgo } from "./NotificationTimelineRow";

/* ─────────────────────────────────────────────
   Helpers
───────────────────────────────────────────── */

const TYPE_LABEL: Record<string, string> = {
  exam_order:  "Exam Order",
  inquiry:     "Inquiry",
  payment:     "Payment",
  testimonial: "Testimonial",
  product:     "Product",
  warning:     "Warning",
  system:      "System",
};

const TYPE_ICON_BG: Record<string, string> = {
  exam_order:  "bg-red-50 text-red-600 ring-red-100",
  inquiry:     "bg-blue-50 text-blue-600 ring-blue-100",
  payment:     "bg-green-50 text-green-700 ring-green-100",
  testimonial: "bg-purple-50 text-purple-600 ring-purple-100",
  product:     "bg-indigo-50 text-indigo-600 ring-indigo-100",
  warning:     "bg-orange-50 text-orange-600 ring-orange-100",
};

function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleString("en-KE", {
    dateStyle: "medium",
    timeStyle: "short",
  });
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
   Props
───────────────────────────────────────────── */

interface NotificationDrawerProps {
  notification: Notification | null;
  onClose: () => void;
  onMarkAsRead: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

/* ─────────────────────────────────────────────
   Detail row helper
───────────────────────────────────────────── */

function DetailRow({ label, value, mono = false }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3 border-b border-neutral-100 last:border-0">
      <span className="shrink-0 text-[11px] font-bold uppercase tracking-wider text-neutral-400">
        {label}
      </span>
      <span className={cn(
        "text-right text-[12px] font-semibold text-neutral-800 leading-snug",
        mono && "font-mono font-black text-red-600"
      )}>
        {value}
      </span>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Component
───────────────────────────────────────────── */

export function NotificationDrawer({
  notification,
  onClose,
  onMarkAsRead,
  onDelete,
}: NotificationDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMarkingRead, setIsMarkingRead] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  /* ── Animate in/out when notification changes ── */
  useEffect(() => {
    if (notification) {
      setIsOpen(true);
      setTimeout(() => closeButtonRef.current?.focus(), 100);
    } else {
      setIsOpen(false);
    }
  }, [notification?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── ESC to close + focus trap ── */
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") { onClose(); return; }
      if (e.key !== "Tab" || !panelRef.current) return;

      const focusable = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, [tabindex]:not([tabindex="-1"])'
        )
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        last.focus(); e.preventDefault();
      } else if (!e.shiftKey && document.activeElement === last) {
        first.focus(); e.preventDefault();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  /* ── Body scroll lock on mobile ── */
  useEffect(() => {
    if (isOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = prev; };
    }
  }, [isOpen]);

  const handleMarkAsRead = async () => {
    if (!notification || notification.is_read || isMarkingRead) return;
    setIsMarkingRead(true);
    try { await onMarkAsRead(notification.id); } finally { setIsMarkingRead(false); }
  };

  const handleDelete = async () => {
    if (!notification || isDeleting) return;
    setIsDeleting(true);
    try {
      await onDelete(notification.id);
      onClose();
    } catch { setIsDeleting(false); }
  };

  /* ── Don't render DOM at all when never opened ── */
  if (!notification && !isOpen) return null;

  const n = notification;
  const meta = ((n?.metadata) ?? {}) as {
    school_name?: string;
    order_number?: string;
    order_id?: string;
    total_papers?: number;
    total_amount?: number;
    county?: string;
    customer_name?: string;
    status?: string;
    session?: string;
  };

  const typeLabel = TYPE_LABEL[n?.type ?? ""] ?? "System";
  const iconColors = TYPE_ICON_BG[n?.type ?? ""] ?? "bg-neutral-100 text-neutral-500 ring-neutral-100";

  return (
    <>
      {/* ── Backdrop ── */}
      <div
        onClick={onClose}
        aria-hidden="true"
        className={cn(
          "fixed inset-0 z-40 bg-neutral-900/25 backdrop-blur-[2px] transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
      />

      {/* ── Drawer panel ── */}
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Notification details"
        tabIndex={-1}
        className={cn(
          // Layout
          "fixed inset-y-0 right-0 z-50 flex flex-col bg-white",
          // Width: full-screen mobile, 420px desktop
          "w-full sm:w-[420px] sm:max-w-[90vw]",
          // Shadow
          "shadow-[−24px_0_60px_-16px_rgba(0,0,0,0.20)] sm:border-l sm:border-neutral-200",
          // Slide animation
          "transition-transform duration-300 ease-out will-change-transform",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* ─ Header ─ */}
        <div className="flex shrink-0 items-center justify-between border-b border-neutral-100 px-5 py-4 bg-white/95">
          <div className="flex items-center gap-3">
            <div className={cn(
              "flex h-8 w-8 items-center justify-center rounded-lg ring-1 ring-inset",
              iconColors
            )}>
              {/* Bell icon */}
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-4 w-4">
                <path fillRule="evenodd" d="M3.06 4.5a4.943 4.943 0 0 1 9.88 0c0 1.874-.416 3.114-.867 3.921A4.027 4.027 0 0 1 11 9.774a3.65 3.65 0 0 1-.404.36c-.154.12-.226.167-.226.167v.026a2.75 2.75 0 0 1-4.74 0v-.026s-.072-.046-.226-.167a3.65 3.65 0 0 1-.404-.36 4.027 4.027 0 0 1-1.073-1.353C3.476 7.614 3.06 6.374 3.06 4.5ZM8 15.25a3.75 3.75 0 0 1-3.37-2.1c.326.09.665.139 1.01.14h4.72c.346 0 .685-.05 1.01-.14A3.75 3.75 0 0 1 8 15.25Z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">{typeLabel}</p>
              <h2 className="text-sm font-black text-neutral-900 leading-tight">{n?.title ?? "Notification"}</h2>
            </div>
          </div>
          <button
            ref={closeButtonRef}
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700 focus:outline-none focus:ring-2 focus:ring-neutral-200"
            aria-label="Close details panel"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
              <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
            </svg>
          </button>
        </div>

        {/* ─ Scrollable body ─ */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {/* Status pill */}
          <div className="mb-4 flex items-center gap-2">
            <span className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold",
              n?.is_read
                ? "bg-neutral-100 text-neutral-500"
                : "bg-red-50 text-red-600 ring-1 ring-red-100"
            )}>
              {!n?.is_read && (
                <span className="h-1.5 w-1.5 rounded-full bg-red-500" aria-hidden="true" />
              )}
              {n?.is_read ? "Read" : "Unread"}
            </span>
            <span className="text-[11px] text-neutral-400">
              {n ? formatTimeAgo(n.created_at) : ""}
            </span>
          </div>

          {/* Detail fields */}
          <div className="rounded-xl border border-neutral-100 bg-neutral-50/50 px-4">
            {meta.school_name && <DetailRow label="School" value={meta.school_name} />}
            {meta.customer_name && !meta.school_name && <DetailRow label="Customer" value={meta.customer_name} />}
            {meta.order_number && <DetailRow label="Order Number" value={meta.order_number} mono />}
            {meta.total_papers != null && <DetailRow label="Students" value={`${meta.total_papers} students`} />}
            {meta.total_amount != null && <DetailRow label="Amount" value={formatKsh(meta.total_amount)} />}
            {meta.county && <DetailRow label="County" value={meta.county} />}
            {meta.session && <DetailRow label="Session" value={meta.session} />}
            {meta.status && <DetailRow label="Status" value={meta.status} />}
            {n && <DetailRow label="Submitted" value={formatDate(n.created_at)} />}
          </div>

          {/* Message */}
          {n?.message && (
            <div className="mt-4 rounded-xl border border-neutral-100 bg-white p-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-2">Message</p>
              <p className="text-sm text-neutral-700 leading-relaxed">{n.message}</p>
            </div>
          )}
        </div>

        {/* ─ Sticky footer ─ */}
        <div className="shrink-0 border-t border-neutral-100 bg-white/95 px-5 py-4">
          <div className="flex items-center gap-2">
            {/* Open Order */}
            {(meta.order_id || n?.type === "exam_order") && (
              <Link
                href="/dashboard/orders"
                onClick={onClose}
                className="flex-1 rounded-xl bg-neutral-900 py-2.5 text-center text-xs font-black text-white transition-all hover:bg-neutral-700 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:ring-offset-1"
              >
                Open Order
              </Link>
            )}

            {/* Mark Read */}
            {!n?.is_read && (
              <button
                onClick={handleMarkAsRead}
                disabled={isMarkingRead}
                className="flex-1 rounded-xl border border-neutral-200 bg-white py-2.5 text-xs font-bold text-neutral-700 transition-all hover:bg-neutral-50 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-neutral-200 focus:ring-offset-1"
              >
                {isMarkingRead ? "Marking…" : "Mark Read"}
              </button>
            )}

            {/* Delete */}
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="rounded-xl border border-transparent py-2.5 px-4 text-xs font-bold text-neutral-400 transition-all hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-red-100"
            >
              {isDeleting ? "…" : "Delete"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
