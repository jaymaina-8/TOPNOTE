"use client";

import { useEffect, useRef, useState } from "react";
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
   Swipeable Mobile Card
───────────────────────────────────────────── */

function SwipeableCard({
  notification,
  onClose,
  onMarkAsRead,
  onDelete,
}: {
  notification: Notification;
  onClose: () => void;
  onMarkAsRead: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [startX, setStartX] = useState(0);
  const [currentX, setCurrentX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    setStartX(e.touches[0].clientX);
    setIsSwiping(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isSwiping) return;
    setCurrentX(e.touches[0].clientX);
  };

  const handleTouchEnd = async () => {
    if (!isSwiping) return;
    setIsSwiping(false);
    const diff = currentX - startX;

    if (diff > 85 && !notification.is_read) {
      await onMarkAsRead(notification.id);
    } else if (diff < -85) {
      await onDelete(notification.id);
    }
    setStartX(0);
    setCurrentX(0);
  };

  const diffX = isSwiping && startX && currentX ? currentX - startX : 0;
  const transformX = Math.max(-120, Math.min(120, diffX));

  const meta = (notification.metadata ?? {}) as { school_name?: string; order_number?: string };
  const label = TYPE_LABEL[notification.type] ?? "System";
  const dotColor = TYPE_DOT[notification.type] ?? "bg-neutral-400";

  return (
    <li className="relative overflow-hidden select-none bg-neutral-100 first:rounded-t-lg last:rounded-b-lg">
      {/* Swipe Feedback Underlays */}
      {transformX > 0 && (
        <div className="absolute inset-0 flex items-center justify-start bg-emerald-500 pl-4 text-white text-xs font-black transition-opacity">
          <span className="flex items-center gap-1.5 animate-pulse">
            ✓ Mark Read
          </span>
        </div>
      )}
      {transformX < 0 && (
        <div className="absolute inset-0 flex items-center justify-end bg-red-600 pr-4 text-white text-xs font-black transition-opacity">
          <span className="flex items-center gap-1.5 animate-pulse">
            🗑 Delete
          </span>
        </div>
      )}

      {/* Content wrapper */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ transform: `translateX(${transformX}px)`, transition: isSwiping ? "none" : "transform 0.2s ease-out" }}
        className={cn(
          "flex items-start gap-3 px-4 py-2.5 bg-white transition-colors border-b border-neutral-100/50 cursor-pointer",
          !notification.is_read && "bg-[#E31B23]/5"
        )}
      >
        <div className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center">
          {!notification.is_read ? (
            <span className={cn("h-2.5 w-2.5 rounded-full animate-pulse", dotColor)} />
          ) : (
            <span className="h-2 w-2 rounded-full bg-neutral-200" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className={cn(
              "text-[9px] font-black uppercase tracking-wider",
              !notification.is_read ? "text-[#E31B23]" : "text-neutral-400"
            )}>
              {label}
            </span>
            <span className="shrink-0 text-[10px] text-neutral-400 font-semibold">
              {formatTimeAgo(notification.created_at)}
            </span>
          </div>
          <p className={cn(
            "mt-0.5 text-xs leading-snug",
            !notification.is_read ? "font-extrabold text-neutral-900" : "font-normal text-neutral-600"
          )}>
            {notification.title}
          </p>
          {meta.school_name && (
            <p className="text-[11px] text-neutral-500 font-medium mt-0.5 truncate">
              {String(meta.school_name)}
              {meta.order_number ? ` · ${String(meta.order_number)}` : ""}
            </p>
          )}
        </div>
      </div>
    </li>
  );
}

/* ─────────────────────────────────────────────
   Types
───────────────────────────────────────────── */

interface BellPreviewProps {
  notificationsOpen: boolean;
  onClose: () => void;
  notifications: Notification[];
  onMarkAsRead: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onMarkAllAsRead?: (ids: string[]) => Promise<void>;
  forceMobileTablet?: boolean;
  forceDesktop?: boolean;
}

/* ─────────────────────────────────────────────
   Main Component
───────────────────────────────────────────── */

export function BellPreview({
  notificationsOpen,
  onClose,
  notifications,
  onMarkAsRead,
  onDelete,
  onMarkAllAsRead,
  forceMobileTablet = false,
  forceDesktop = false,
}: BellPreviewProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [search, setSearch] = useState("");
  
  // Responsive mode flags
  const [isMobileMode, setIsMobileMode] = useState(false);
  const [isTabletMode, setIsTabletMode] = useState(false);

  // Mount/Delayed Exit states (for proper modal unmounting)
  const [shouldRender, setShouldRender] = useState(false);
  const [animatingOpen, setAnimatingOpen] = useState(false);

  // Swipe gesture variables (mobile bottom sheet dragging)
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const touchStartRef = useRef({ y: 0, time: 0 });

  // Handle entry and exit transition delays before completely unmounting
  useEffect(() => {
    if (notificationsOpen) {
      setShouldRender(true);
      const t = setTimeout(() => setAnimatingOpen(true), 10);
      return () => clearTimeout(t);
    } else {
      setAnimatingOpen(false);
      const t = setTimeout(() => setShouldRender(false), 250);
      return () => clearTimeout(t);
    }
  }, [notificationsOpen]);

  // Detect responsive screen size safely on client side
  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth;
      setIsMobileMode(w < 768);
      setIsTabletMode(w >= 768 && w < 1024);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Lock background scroll on mobile/tablet viewports when panel is open
  useEffect(() => {
    const shouldLock = (isMobileMode || isTabletMode) && notificationsOpen;
    if (shouldLock) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [notificationsOpen, isMobileMode, isTabletMode]);

  /* ── Click-outside closer (Desktop mode only) ── */
  useEffect(() => {
    if (!notificationsOpen) return;

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
  }, [notificationsOpen, onClose]);

  /* ── ESC key closer ── */
  useEffect(() => {
    if (!notificationsOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [notificationsOpen, onClose]);

  // Swipe Down gestures for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isMobileMode) return;
    const touch = e.touches[0];
    touchStartRef.current = { y: touch.clientY, time: Date.now() };
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !isMobileMode) return;
    const touch = e.touches[0];
    const diffY = touch.clientY - touchStartRef.current.y;
    if (diffY > 0) {
      setDragY(diffY);
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging || !isMobileMode) return;
    setIsDragging(false);
    const diffY = dragY;
    const duration = Date.now() - touchStartRef.current.time;
    const velocity = diffY / (duration || 1);

    if (diffY > 120 || velocity > 0.5) {
      onClose();
    }
    setDragY(0);
  };

  const isDesktopMode = !isMobileMode && !isTabletMode;

  if (forceMobileTablet && isDesktopMode) return null;
  if (forceDesktop && !isDesktopMode) return null;

  if (!shouldRender) return null;

  const filtered = notifications.filter((n) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    const meta = (n.metadata ?? {}) as { school_name?: string; order_number?: string };
    return (
      n.title.toLowerCase().includes(q) ||
      (n.message && n.message.toLowerCase().includes(q)) ||
      (meta.school_name && meta.school_name.toLowerCase().includes(q)) ||
      (meta.order_number && meta.order_number.toLowerCase().includes(q))
    );
  });

  const latest5 = filtered.slice(0, 15);
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const swipeHandlers = isMobileMode
    ? {
        onTouchStart: handleTouchStart,
        onTouchMove: handleTouchMove,
        onTouchEnd: handleTouchEnd,
      }
    : {};

  return (
    <>
      {/* Semi-transparent Backdrop Overlay with blur & fade transition (covers viewport, blocks clicks) */}
      {(isMobileMode || isTabletMode) && (
        <div
          onClick={onClose}
          className={cn(
            "fixed inset-0 z-[80] bg-black/45 backdrop-blur-[2px] transition-opacity duration-[250ms] ease-out",
            animatingOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
          )}
        />
      )}

      {/* Sheet / Dropdown Container */}
      <div
        ref={panelRef}
        role="dialog"
        aria-label="Recent notifications"
        className={cn(
          // Base transition setup
          "transition-all duration-[250ms] ease-out bg-white flex flex-col overflow-hidden",
          
          // Mobile & Tablet (<1024px): Centered modal configuration (60vh / max-h-[500px])
          "fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[90] w-[90vw] max-w-[450px] h-[60vh] max-h-[500px] rounded-2xl shadow-2xl border border-neutral-200 lg:fixed-none lg:top-auto lg:left-auto lg:translate-x-0 lg:translate-y-0",
          
          // Desktop (>= 1024px): Dropdown anchored to relative bell icon
          "lg:absolute lg:top-full lg:right-0 lg:left-auto lg:z-50 lg:w-[450px] lg:h-[600px] lg:rounded-2xl lg:mt-2 lg:border lg:border-neutral-200 lg:shadow-xl",
          
          // Open/Closed transitions for Mobile/Tablet/Desktop viewports
          isMobileMode || isTabletMode
            ? (animatingOpen ? "scale-100 opacity-100" : "scale-95 opacity-0 pointer-events-none")
            : (animatingOpen ? "translate-y-0 opacity-100 pointer-events-auto" : "translate-y-2 opacity-0 pointer-events-none")
        )}
      >
        {/* Sticky Header */}
        <div
          className="flex items-center justify-between border-b border-neutral-100 px-5 pb-3.5 pt-4 shrink-0 rounded-t-3xl"
        >
          <div className="flex items-center gap-2.5">
            <h3 className="text-sm font-black text-neutral-900 tracking-tight">Notifications</h3>
            {unreadCount > 0 && (
              <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#E31B23] px-1.5 text-[10px] font-black text-white leading-none">
                {unreadCount}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700 focus:outline-none focus:ring-2 focus:ring-neutral-200"
            aria-label="Close notifications panel"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
              <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
            </svg>
          </button>
        </div>

        {/* Sticky Search Input */}
        <div className="px-5 py-2.5 border-b border-neutral-50 shrink-0 bg-white">
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-neutral-400">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search notifications..."
              className="w-full rounded-lg border border-neutral-200 bg-neutral-50/50 py-1.5 pl-8.5 pr-4 text-xs text-neutral-800 placeholder-neutral-400 focus:border-neutral-300 focus:bg-white focus:outline-none focus:ring-1 focus:ring-neutral-200"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-neutral-400 hover:text-neutral-600 text-[10px] font-bold"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Scrollable Notification List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {latest5.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-5 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#E31B23]/5 text-[#E31B23] mb-4">
                <span className="text-xl">🔔</span>
              </div>
              <p className="text-sm font-black text-neutral-800">You&apos;re all caught up!</p>
              <p className="mt-1 text-xs text-neutral-400">No new notifications matching filters.</p>
            </div>
          ) : (
            <ul role="list" className="divide-y divide-neutral-100/50">
              {latest5.map((n) => (
                <SwipeableCard
                  key={n.id}
                  notification={n}
                  onClose={onClose}
                  onMarkAsRead={onMarkAsRead}
                  onDelete={onDelete}
                />
              ))}
            </ul>
          )}
        </div>

        {/* Sticky Footer */}
        <div className="border-t border-neutral-100 bg-neutral-50/70 p-3 shrink-0 flex items-center gap-2 mt-auto">
          {unreadCount > 0 && onMarkAllAsRead && (
            <button
              onClick={async () => {
                const unreadIds = notifications.filter((n) => !n.is_read).map((n) => n.id);
                await onMarkAllAsRead(unreadIds);
              }}
              className="flex-1 rounded-lg border border-neutral-200 bg-white py-2 text-xs font-bold text-neutral-700 transition hover:bg-neutral-50 focus:outline-none"
            >
              Mark all read
            </button>
          )}
          <Link
            href="/dashboard/notifications"
            onClick={onClose}
            className="flex-1 rounded-lg bg-[#E31B23] py-2 text-xs font-bold text-white text-center transition hover:bg-[#C1141C] focus:outline-none shadow-sm flex items-center justify-center gap-1"
          >
            View all
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
              <path fillRule="evenodd" d="M3 10a.75.75 0 0 1 .75-.75h10.638L10.23 5.29a.75.75 0 1 1 1.04-1.08l5.5 5.25a.75.75 0 0 1 0 1.08l-5.5 5.25a.75.75 0 1 1-1.04-1.08l4.158-3.96H3.75A.75.75 0 0 1 3 10Z" clipRule="evenodd" />
            </svg>
          </Link>
        </div>
      </div>
    </>
  );
}
