"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/* ─────────────────────────────────────────────
   Types
───────────────────────────────────────────── */

export interface ToastPayload {
  id: string;
  title: string;
  message: string;
  metadata?: Record<string, unknown> | null;
}

interface NotificationToastProps {
  toast: ToastPayload | null;
  /** How many additional notifications are waiting behind this one. */
  queueLength: number;
  /** Hides the popup. Notification remains unread in the Notification Center. */
  onDismiss: () => void;
  /** Marks the notification as read AND closes the popup. */
  onMarkAsRead: () => void;
  /** Navigates to the order, marks as read, and closes the popup. */
  onViewOrder: () => void;
}

/* ─────────────────────────────────────────────
   Helpers
───────────────────────────────────────────── */

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
   Component
───────────────────────────────────────────── */

export function NotificationToast({
  toast,
  queueLength,
  onDismiss,
  onMarkAsRead,
  onViewOrder,
}: NotificationToastProps) {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const isMountedRef = useRef(false);

  /* ── Track component lifecycle ── */
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  /* ── Animate in/out when toast ID changes ── */
  useEffect(() => {
    if (!toast) {
      // Animate out then unmount
      setVisible(false);
      const t = setTimeout(() => {
        if (isMountedRef.current) setMounted(false);
      }, 300); // matches CSS transition duration
      return () => clearTimeout(t);
    }

    // Mount first (invisible), then trigger CSS enter transition
    setMounted(true);
    setVisible(false);
    const t = setTimeout(() => {
      if (isMountedRef.current) {
        setVisible(true);
      }
    }, 20);
    return () => clearTimeout(t);
  }, [toast?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── ESC = dismiss (notification stays unread) ── */
  useEffect(() => {
    if (!toast) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onDismiss();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toast, onDismiss]);

  /* ── Don't render when not mounted ── */
  if (!mounted || !toast) return null;

  const meta = (toast.metadata ?? {}) as {
    school_name?: string;
    order_number?: string;
    total_papers?: number;
    total_amount?: number;
  };

  /* ─────────────────────────────────────────────
     Render
  ───────────────────────────────────────────── */
  return (
    /**
     * Fixed top-center container.
     * pointer-events-none on wrapper so clicks on the page below work.
     * pointer-events-auto on the card itself.
     */
    <div
      aria-live="assertive"
      aria-atomic="true"
      className="pointer-events-none fixed inset-x-0 top-0 z-[9999] flex justify-center px-4 pt-4 sm:pt-5"
    >
      <div
        role="alertdialog"
        aria-modal="false"
        aria-labelledby="toast-title"
        className={cn(
          // Size
          "pointer-events-auto relative w-full max-w-[420px] overflow-hidden",
          // Shape + shadow
          "rounded-2xl border border-neutral-200/80 bg-white shadow-[0_8px_40px_-8px_rgba(0,0,0,0.22),0_2px_12px_-4px_rgba(0,0,0,0.12)]",
          // Slide-down + fade animation
          "transition-all duration-300 ease-out will-change-transform",
          visible ? "translate-y-0 opacity-100 scale-100" : "-translate-y-3 opacity-0 scale-[0.97]"
        )}
      >
        {/* ── Top accent stripe ── */}
        <div className="h-[3px] w-full bg-gradient-to-r from-red-500 via-red-400 to-rose-500" />

        <div className="p-4">
          {/* ── Header row ── */}
          <div className="flex items-start gap-3">
            {/* Icon */}
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600 ring-1 ring-red-100">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-5 w-5"
                aria-hidden="true"
              >
                <path d="M5.25 6.375a4.125 4.125 0 1 1 8.25 0 4.125 4.125 0 0 1-8.25 0ZM2.25 19.125a7.125 7.125 0 0 1 14.25 0v.003l-.001.119a.75.75 0 0 1-.363.63 13.067 13.067 0 0 1-6.761 1.873c-2.472 0-4.786-.684-6.76-1.873a.75.75 0 0 1-.364-.63l-.001-.122ZM18.75 7.5a.75.75 0 0 0-1.5 0v2.25H15a.75.75 0 0 0 0 1.5h2.25v2.25a.75.75 0 0 0 1.5 0v-2.25H21a.75.75 0 0 0 0-1.5h-2.25V7.5Z" />
              </svg>
            </div>

            {/* Text content */}
            <div className="flex-1 min-w-0">
              {/* Live badge */}
              <div className="mb-1 flex items-center gap-1.5">
                <span className="relative flex h-2 w-2" aria-hidden="true">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
                </span>
                <span className="text-[10px] font-black uppercase tracking-widest text-red-500">
                  New Order
                </span>
              </div>

              <h3
                id="toast-title"
                className="text-sm font-black tracking-tight text-neutral-900 leading-snug"
              >
                {toast.title}
              </h3>

              {meta.school_name && (
                <p className="mt-0.5 text-xs font-medium text-neutral-500 truncate">
                  {String(meta.school_name)}
                </p>
              )}
            </div>

            {/* Dismiss × */}
            <button
              onClick={onDismiss}
              className="ml-1 mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700 focus:outline-none focus:ring-2 focus:ring-neutral-200"
              aria-label="Dismiss notification"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="h-4 w-4"
                aria-hidden="true"
              >
                <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
              </svg>
            </button>
          </div>

          {/* ── Order metadata ── */}
          {(meta.order_number || meta.total_papers || meta.total_amount) && (
            <div className="mt-3 flex items-center gap-2 flex-wrap">
              {meta.order_number && (
                <span className="inline-flex items-center rounded-md bg-red-50 px-2 py-1 text-[11px] font-black text-red-600 ring-1 ring-inset ring-red-100">
                  {String(meta.order_number)}
                </span>
              )}
              {meta.total_papers != null && (
                <span className="inline-flex items-center gap-1 rounded-md bg-neutral-100 px-2 py-1 text-[11px] font-bold text-neutral-600">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 16 16"
                    fill="currentColor"
                    className="h-3 w-3"
                    aria-hidden="true"
                  >
                    <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM12.735 14c.618 0 1.093-.561.872-1.139a6.002 6.002 0 0 0-11.215 0c-.22.578.254 1.139.872 1.139h9.47Z" />
                  </svg>
                  {String(meta.total_papers)} Students
                </span>
              )}
              {meta.total_amount != null && (
                <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-[11px] font-black text-green-700 ring-1 ring-inset ring-green-100">
                  {formatKsh(Number(meta.total_amount))}
                </span>
              )}
              <span className="ml-auto text-[10px] font-semibold text-neutral-400">
                Just now
              </span>
            </div>
          )}

          {/* ── Action buttons ── */}
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center">
            <button
              onClick={onViewOrder}
              className="flex-1 flex justify-center items-center gap-1.5 rounded-xl bg-neutral-900 px-4 py-2 text-xs font-black text-white transition-all hover:bg-neutral-700 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:ring-offset-1"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5" aria-hidden="true">
                <path fillRule="evenodd" d="M3 10a.75.75 0 0 1 .75-.75h10.638L10.23 5.29a.75.75 0 1 1 1.04-1.08l5.5 5.25a.75.75 0 0 1 0 1.08l-5.5 5.25a.75.75 0 1 1-1.04-1.08l4.158-3.96H3.75A.75.75 0 0 1 3 10Z" clipRule="evenodd" />
              </svg>
              View Order
            </button>
            <button
              onClick={onMarkAsRead}
              className="flex-1 flex justify-center items-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-4 py-2 text-xs font-bold text-neutral-700 transition-all hover:bg-neutral-50 hover:border-neutral-300 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-neutral-200 focus:ring-offset-1"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5 text-green-600" aria-hidden="true">
                <path fillRule="evenodd" d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z" clipRule="evenodd" />
              </svg>
              Mark as Read
            </button>
          </div>

          {/* Queue indicator */}
          {queueLength > 0 && (
            <div className="mt-3 flex items-center justify-center gap-1.5 rounded-xl border border-amber-100 bg-amber-50 py-1.5 text-[10px] font-bold text-amber-700">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5 text-amber-500" aria-hidden="true">
                <path fillRule="evenodd" d="M8 1.75a.75.75 0 0 1 .692.462l1.41 3.393 3.664.293a.75.75 0 0 1 .428 1.317l-2.791 2.39.853 3.575a.75.75 0 0 1-1.12.814L8 11.812l-3.136 2.182a.75.75 0 0 1-1.12-.814l.853-3.574L1.806 7.216a.75.75 0 0 1 .428-1.317l3.664-.293 1.41-3.393A.75.75 0 0 1 8 1.75Z" clipRule="evenodd" />
              </svg>
              {queueLength} more notification{queueLength > 1 ? "s" : ""} queued
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
