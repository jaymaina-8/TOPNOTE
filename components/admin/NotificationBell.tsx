"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useNotifications } from "./NotificationProvider";
import { BellPreview } from "./notifications/BellPreview";
import { NotificationToast } from "./notifications/NotificationToast";

export function NotificationBell() {
  const router = useRouter();
  const {
    unreadCount,
    isShaking,
    toastQueue,
    dismissToast,
    notifications,
    markAsRead,
    deleteNotification,
  } = useNotifications();

  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const bellButtonRef = useRef<HTMLButtonElement>(null);
  const prevIsOpenRef = useRef(isPreviewOpen);

  // Restore focus to bell when preview closes
  useEffect(() => {
    if (prevIsOpenRef.current === true && isPreviewOpen === false) {
      setTimeout(() => bellButtonRef.current?.focus(), 50);
    }
    prevIsOpenRef.current = isPreviewOpen;
  }, [isPreviewOpen]);

  const activeToast = toastQueue[0] ?? null;

  /* ── Toast action handlers ── */

  /** Dismiss: hide popup only. Notification stays unread in the center. */
  const handleToastDismiss = () => {
    dismissToast();
  };

  /** Mark as Read: mark the notification + close popup. */
  const handleToastMarkAsRead = async () => {
    if (activeToast) {
      await markAsRead(activeToast.id);
    }
    dismissToast();
  };

  /**
   * View Order: mark as read + navigate to orders + close popup.
   * markAsRead is fire-and-forget here; navigation is more important to feel instant.
   */
  const handleToastViewOrder = () => {
    if (activeToast) {
      markAsRead(activeToast.id).catch(() => {});
    }
    dismissToast();
    router.push("/dashboard/orders");
    router.refresh();
  };

  return (
    <div className="relative inline-block text-left">
      {/* ── Bell button ── */}
      <button
        ref={bellButtonRef}
        id="notification-bell-btn"
        onClick={() => setIsPreviewOpen((o) => !o)}
        className={cn(
          "relative rounded-lg p-2 text-neutral-600 transition-all hover:bg-neutral-100 hover:text-neutral-950",
          "focus:outline-none focus:ring-2 focus:ring-primary/20",
          isPreviewOpen && "bg-neutral-100 text-neutral-950",
          isShaking && "animate-bell-shake"
        )}
        aria-label="View notifications"
        aria-expanded={isPreviewOpen}
        aria-haspopup="true"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className="h-5.5 w-5.5"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"
          />
        </svg>

        {/* Unread badge */}
        {unreadCount > 0 && (
          <span
            aria-label={`${unreadCount} unread notifications`}
            className="absolute top-1.5 right-1.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-black leading-none text-white shadow-sm ring-2 ring-white animate-pulse"
          >
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* ── 350px preview dropdown ── */}
      <BellPreview
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        notifications={notifications}
        onMarkAsRead={markAsRead}
        onDelete={deleteNotification}
      />

      {/* ── Centered modal popup — never auto-dismisses ── */}
      <NotificationToast
        toast={activeToast}
        queueLength={Math.max(0, toastQueue.length - 1)}
        onDismiss={handleToastDismiss}
        onMarkAsRead={handleToastMarkAsRead}
        onViewOrder={handleToastViewOrder}
      />
    </div>
  );
}
