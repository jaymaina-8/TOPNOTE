"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useNotifications } from "./NotificationProvider";
import { BellPreview } from "./notifications/BellPreview";
import { NotificationToast } from "./notifications/NotificationToast";

interface NotificationBellProps {
  notificationsOpen?: boolean;
  setNotificationsOpen?: (open: boolean) => void;
}

export function NotificationBell({
  notificationsOpen: propOpen,
  setNotificationsOpen: propSetOpen,
}: NotificationBellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const {
    unreadCount,
    isShaking,
    toastQueue,
    dismissToast,
    notifications,
    markAsRead,
    deleteNotification,
    markAllAsRead,
  } = useNotifications();

  // Controlled state from parent with uncontrolled local state fallback for legacy compatibility
  const [localOpen, setLocalOpen] = useState(false);
  const notificationsOpen = propOpen !== undefined ? propOpen : localOpen;
  const setNotificationsOpen = propSetOpen !== undefined ? propSetOpen : setLocalOpen;

  const bellButtonRef = useRef<HTMLButtonElement>(null);
  const prevIsOpenRef = useRef(notificationsOpen);

  // Restore focus to bell when preview closes
  useEffect(() => {
    if (prevIsOpenRef.current === true && notificationsOpen === false) {
      setTimeout(() => bellButtonRef.current?.focus(), 50);
    }
    prevIsOpenRef.current = notificationsOpen;
  }, [notificationsOpen]);

  // Close sheet on route changes (fallback logic for legacy nav pages without prop state)
  useEffect(() => {
    if (propOpen === undefined) {
      setLocalOpen(false);
    }
  }, [pathname, propOpen]);

  const activeToast = toastQueue[0] ?? null;

  /* ── Toast action handlers ── */

  const handleToastDismiss = () => {
    dismissToast();
  };

  const handleToastMarkAsRead = async () => {
    if (activeToast) {
      await markAsRead(activeToast.id);
    }
    dismissToast();
  };

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
        onClick={() => setNotificationsOpen(!notificationsOpen)}
        className={cn(
          "relative rounded-lg p-2 text-neutral-600 transition-all hover:bg-neutral-100 hover:text-neutral-950",
          "focus:outline-none focus:ring-2 focus:ring-primary/20",
          notificationsOpen && "bg-neutral-100 text-neutral-950",
          isShaking && "animate-bell-shake"
        )}
        aria-label="View notifications"
        aria-expanded={notificationsOpen}
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

      <BellPreview
        notificationsOpen={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        notifications={notifications}
        onMarkAsRead={markAsRead}
        onDelete={deleteNotification}
        onMarkAllAsRead={markAllAsRead}
        forceDesktop={true}
      />

      {/* ── Centered modal popup ── */}
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
