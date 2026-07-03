"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { Database } from "@/lib/supabase/types";
import { formatTimeAgo, NotificationCard } from "./NotificationCard";
import { NotificationFilters, FilterType } from "./NotificationFilters";
import { NotificationSearch } from "./NotificationSearch";
import { NotificationPreferences, Preferences } from "./NotificationPreferences";

type Notification = Database["public"]["Tables"]["notifications"]["Row"] & {
  read_at?: string | null;
  updated_at?: string | null;
  reference_type?: string | null;
  reference_id?: string | null;
};

interface GroupedNotification {
  isGroup: true;
  id: string;
  ids: string[];
  title: string;
  message: string;
  type: "exam_order";
  is_read: boolean;
  created_at: string;
  notifications: Notification[];
}

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: Notification[];
  isLoading: boolean;
  preferences: Preferences;
  onChangePreferences: (prefs: Preferences) => void;
  onMarkAsRead: (id: string) => Promise<void>;
  onMarkAllAsRead: (ids: string[]) => Promise<void>;
  onDeleteNotification: (id: string) => Promise<void>;
  onDeleteAllRead: (ids: string[]) => Promise<void>;
  latestInsertedId: string | null;
}

export function NotificationCenter({
  isOpen,
  onClose,
  notifications,
  isLoading,
  preferences,
  onChangePreferences,
  onMarkAsRead,
  onMarkAllAsRead,
  onDeleteNotification,
  onDeleteAllRead,
  latestInsertedId,
}: NotificationCenterProps) {
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [isBulkMarkingRead, setIsBulkMarkingRead] = useState(false);
  const [displayCount, setDisplayCount] = useState(25);

  const panelRef = useRef<HTMLDivElement>(null);

  // Body scroll lock
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Keyboard: ESC + focus trap
  useEffect(() => {
    if (!isOpen) return;

    const panel = panelRef.current;
    if (panel) {
      const els = panel.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      els[0]?.focus();
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") { onClose(); return; }
      if (e.key !== "Tab" || !panel) return;

      const els = Array.from(
        panel.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
      );
      if (!els.length) { e.preventDefault(); return; }

      const first = els[0];
      const last = els[els.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        last.focus(); e.preventDefault();
      } else if (!e.shiftKey && document.activeElement === last) {
        first.focus(); e.preventDefault();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
      onClose();
    }
  };

  // Group consecutive exam orders within 1 hour (3+)
  const groupedNotifications = useMemo(() => {
    const list = [...notifications];
    const result: (Notification | GroupedNotification)[] = [];
    let i = 0;
    const oneHourMs = 60 * 60 * 1000;

    while (i < list.length) {
      const current = list[i];
      if (current.type !== "exam_order") {
        result.push(current);
        i++;
        continue;
      }

      const group: Notification[] = [current];
      let j = i + 1;

      while (j < list.length) {
        const next = list[j];
        if (next.type !== "exam_order") break;
        const nextMs = new Date(next.created_at).getTime();
        const lastMs = new Date(group[group.length - 1].created_at).getTime();
        if (Math.abs(lastMs - nextMs) <= oneHourMs) {
          group.push(next);
          j++;
        } else break;
      }

      if (group.length >= 3) {
        const ids = group.map((n) => n.id);
        const schools = group
          .map((n) => ((n.metadata || {}) as { school_name?: string }).school_name || "Unknown School")
          .filter((v, idx, self) => self.indexOf(v) === idx);

        result.push({
          isGroup: true,
          id: ids.join(","),
          ids,
          title: `${group.length} New Exam Orders`,
          message: schools.join(", "),
          type: "exam_order",
          is_read: group.every((n) => n.is_read),
          created_at: group[0].created_at,
          notifications: group,
        });
        i = j;
      } else {
        result.push(current);
        i++;
      }
    }
    return result;
  }, [notifications]);

  const tabCounts = useMemo(() => {
    const counts = { all: 0, unread: 0, orders: 0, payments: 0, inquiries: 0, products: 0, testimonials: 0, system: 0 };
    notifications.forEach((n) => {
      counts.all++;
      if (!n.is_read) counts.unread++;
      if (n.type === "exam_order")  counts.orders++;
      if (n.type === "payment")     counts.payments++;
      if (n.type === "inquiry")     counts.inquiries++;
      if (n.type === "product")     counts.products++;
      if (n.type === "testimonial") counts.testimonials++;
      if (n.type === "system" || n.type === "warning") counts.system++;
    });
    return counts;
  }, [notifications]);

  const filteredItems = useMemo(() => {
    let items = groupedNotifications;
    if (activeFilter === "unread") items = items.filter((i) => !i.is_read);
    else if (activeFilter === "orders") items = items.filter((i) => i.type === "exam_order");
    else if (activeFilter === "payments") items = items.filter((i) => i.type === "payment");
    else if (activeFilter === "system") items = items.filter((i) => i.type === "system");

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      items = items.filter((item) => {
        if ("isGroup" in item) {
          return (
            item.title.toLowerCase().includes(q) ||
            item.message.toLowerCase().includes(q) ||
            item.notifications.some((n) => {
              const m = (n.metadata || {}) as { school_name?: string; order_number?: string; session?: string };
              return (
                n.title.toLowerCase().includes(q) ||
                (m.school_name || "").toLowerCase().includes(q) ||
                (m.order_number || "").toLowerCase().includes(q) ||
                (m.session || "").toLowerCase().includes(q)
              );
            })
          );
        }
        const m = (item.metadata || {}) as { school_name?: string; order_number?: string; session?: string };
        return (
          item.title.toLowerCase().includes(q) ||
          item.message.toLowerCase().includes(q) ||
          (m.school_name || "").toLowerCase().includes(q) ||
          (m.order_number || "").toLowerCase().includes(q) ||
          (m.session || "").toLowerCase().includes(q)
        );
      });
    }
    return items;
  }, [groupedNotifications, activeFilter, searchQuery]);

  const visibleItems = useMemo(() => filteredItems.slice(0, displayCount), [filteredItems, displayCount]);
  const hasMore = filteredItems.length > displayCount;

  const handleMarkAllReadClick = async () => {
    if (isBulkMarkingRead) return;
    setIsBulkMarkingRead(true);
    const ids: string[] = [];
    filteredItems.forEach((item) => {
      if (!item.is_read) {
        if ("isGroup" in item) ids.push(...item.ids);
        else ids.push(item.id);
      }
    });
    if (ids.length > 0) await onMarkAllAsRead(ids);
    setIsBulkMarkingRead(false);
  };

  const handleDeleteAllReadClick = async () => {
    const ids = notifications.filter((n) => n.is_read).map((n) => n.id);
    if (!ids.length) return;
    setIsBulkDeleting(true);
    try {
      await onDeleteAllRead(ids);
      setShowDeleteConfirm(false);
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const hasReadNotifications = notifications.some((n) => n.is_read);

  if (!isOpen) return null;

  return (
    <div
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/50 backdrop-blur-sm p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="notification-center-title"
    >
      {/* Panel — full screen on mobile, 680px on desktop */}
      <div
        ref={panelRef}
        tabIndex={-1}
        className={cn(
          "relative flex h-full w-full flex-col bg-white focus-visible:outline-none overflow-hidden",
          "sm:h-[min(80vh,760px)] sm:w-[680px] sm:max-w-[95vw] sm:rounded-2xl sm:shadow-[0_24px_80px_-16px_rgba(0,0,0,0.28)] sm:border sm:border-neutral-200/70",
          isOpen
            ? "animate-in fade-in zoom-in-95 duration-200 sm:slide-in-from-bottom-4"
            : "animate-out fade-out zoom-out-95 duration-200"
        )}
      >
        {isPreferencesOpen ? (
          <NotificationPreferences
            preferences={preferences}
            onChangePreferences={onChangePreferences}
            onClose={() => setIsPreferencesOpen(false)}
          />
        ) : (
          <>
            {/* ─── Sticky Header ─── */}
            <div className="shrink-0 border-b border-neutral-100 bg-white/95 backdrop-blur-md">
              {/* Title row */}
              <div className="flex items-center justify-between gap-3 px-5 pt-4 pb-3">
                <div className="flex items-center gap-3">
                  <h3
                    id="notification-center-title"
                    className="text-base font-black tracking-tight text-neutral-900"
                  >
                    Notifications
                  </h3>
                  {tabCounts.unread > 0 && (
                    <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-black text-white shadow-sm">
                      {tabCounts.unread}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setIsPreferencesOpen(true)}
                    className="rounded-lg p-1.5 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-neutral-200"
                    aria-label="Notification settings"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4.5 w-4.5">
                      <path fillRule="evenodd" d="M7.84 1.804A1 1 0 0 1 8.82 1h2.36a1 1 0 0 1 .98.804l.331 1.652a6.993 6.993 0 0 1 1.929 1.115l1.598-.54a1 1 0 0 1 1.186.447l1.18 2.044a1 1 0 0 1-.205 1.251l-1.267 1.113a7.047 7.047 0 0 1 0 2.228l1.267 1.113a1 1 0 0 1 .206 1.25l-1.18 2.045a1 1 0 0 1-1.187.447l-1.598-.54a6.993 6.993 0 0 1-1.929 1.115l-.33 1.652a1 1 0 0 1-.98.804H8.82a1 1 0 0 1-.98-.804l-.331-1.652a6.993 6.993 0 0 1-1.929-1.115l-1.598.54a1 1 0 0 1-1.186-.447l-1.18-2.044a1 1 0 0 1 .205-1.251l1.267-1.114a7.05 7.05 0 0 1 0-2.227L1.821 7.773a1 1 0 0 1-.206-1.25l1.18-2.045a1 1 0 0 1 1.187-.447l1.598.54A6.992 6.992 0 0 1 7.51 3.456l.33-1.652ZM10 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" clipRule="evenodd" />
                    </svg>
                  </button>
                  <button
                    onClick={onClose}
                    className="rounded-lg p-1.5 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-200"
                    aria-label="Close notifications"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4.5 w-4.5">
                      <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Search */}
              <div className="px-5 pb-3">
                <NotificationSearch value={searchQuery} onChange={setSearchQuery} />
              </div>

              {/* Filter tabs */}
              <div className="px-5 pb-0">
                <NotificationFilters
                  activeFilter={activeFilter}
                  onChangeFilter={setActiveFilter}
                  counts={tabCounts}
                />
              </div>
            </div>

            {/* ─── Scrollable List ─── */}
            <div
              id="notification-list"
              className="flex-1 overflow-y-auto"
              role="tabpanel"
            >
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex gap-4 border-l-4 border-l-neutral-200 p-5 animate-pulse border-b border-neutral-100">
                    <div className="h-9 w-9 rounded-xl bg-neutral-200 shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-2 w-16 rounded bg-neutral-200" />
                      <div className="h-3 w-2/5 rounded bg-neutral-200" />
                      <div className="h-2 w-3/5 rounded bg-neutral-200" />
                      <div className="mt-3 h-16 rounded-xl bg-neutral-200" />
                    </div>
                  </div>
                ))
              ) : visibleItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center px-8 py-24 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-400 ring-4 ring-neutral-100/50">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-8 w-8">
                      <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <h4 className="mt-4 text-sm font-black text-neutral-900">You&apos;re all caught up!</h4>
                  <p className="mt-1.5 text-[12px] text-neutral-500 font-medium leading-relaxed max-w-[220px]">
                    No notifications match this filter. Check back later.
                  </p>
                </div>
              ) : (
                <>
                  {visibleItems.map((item) => {
                    const isNew =
                      item.id === latestInsertedId ||
                      ("isGroup" in item && item.ids.includes(latestInsertedId || ""));

                    if ("isGroup" in item) {
                      return (
                        <div
                          key={item.id}
                          className={cn(
                            "border-l-4 border-l-red-500 p-5 border-b border-neutral-100 transition-all hover:-translate-y-px hover:shadow-md hover:shadow-neutral-200/60",
                            !item.is_read ? "bg-red-50/30" : "bg-white",
                            isNew && "animate-highlight-fade"
                          )}
                        >
                          <div className="flex items-start gap-4">
                            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600 ring-1 ring-inset ring-red-100">
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                                <path d="M5.25 6.375a4.125 4.125 0 1 1 8.25 0 4.125 4.125 0 0 1-8.25 0ZM2.25 19.125a7.125 7.125 0 0 1 14.25 0v.003l-.001.119a.75.75 0 0 1-.363.63 13.067 13.067 0 0 1-6.761 1.873c-2.472 0-4.786-.684-6.76-1.873a.75.75 0 0 1-.364-.63l-.001-.122Z" />
                              </svg>
                            </div>
                            <div className="flex-1 min-w-0 space-y-2">
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  {!item.is_read && (
                                    <span className="relative flex h-2 w-2">
                                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                                      <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
                                    </span>
                                  )}
                                  <span className="rounded-full bg-red-50 px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-wider text-red-600">
                                    Grouped Orders
                                  </span>
                                </div>
                                <span className="text-[10.5px] font-semibold text-neutral-400">
                                  {formatTimeAgo(item.created_at)}
                                </span>
                              </div>

                              <h4 className="text-[13px] font-black text-neutral-900">{item.title}</h4>

                              <div className="rounded-xl border border-neutral-100 bg-white overflow-hidden divide-y divide-neutral-100">
                                {item.notifications.map((n) => {
                                  const m = (n.metadata || {}) as { school_name?: string; order_number?: string };
                                  return (
                                    <div key={n.id} className="flex items-center justify-between gap-3 px-3 py-2">
                                      <span className="text-[12px] font-bold text-neutral-700 truncate">{m.school_name || "Unknown School"}</span>
                                      <code className="shrink-0 text-[10px] font-black text-red-500">{m.order_number}</code>
                                    </div>
                                  );
                                })}
                              </div>

                              <div className="flex items-center gap-2 pt-1">
                                <Link
                                  href="/dashboard/orders"
                                  onClick={onClose}
                                  className="inline-flex items-center gap-1.5 rounded-lg bg-neutral-900 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-neutral-700 active:scale-95"
                                >
                                  View All Orders
                                </Link>
                                {!item.is_read && (
                                  <button
                                    onClick={() => onMarkAllAsRead(item.ids)}
                                    className="inline-flex items-center rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-[11px] font-bold text-neutral-600 hover:bg-neutral-50"
                                  >
                                    Mark All Read
                                  </button>
                                )}
                                <button
                                  onClick={async () => { for (const id of item.ids) await onDeleteNotification(id); }}
                                  className="ml-auto inline-flex items-center rounded-lg border border-transparent px-2.5 py-1.5 text-[11px] font-bold text-neutral-400 hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                                  title="Delete group"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
                                    <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 3.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z" clipRule="evenodd" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <NotificationCard
                        key={item.id}
                        notification={item}
                        onMarkAsRead={onMarkAsRead}
                        onDelete={onDeleteNotification}
                        onCloseCenter={onClose}
                        isNew={isNew}
                      />
                    );
                  })}

                  {hasMore && (
                    <div className="p-5 text-center">
                      <button
                        onClick={() => setDisplayCount((p) => p + 25)}
                        className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-5 py-2.5 text-xs font-bold text-neutral-700 shadow-sm transition-all hover:bg-neutral-50 active:scale-95 focus:outline-none focus:ring-2 focus:ring-neutral-300"
                      >
                        Load more
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
                          <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* ─── Sticky Footer ─── */}
            <div className="shrink-0 flex items-center justify-between border-t border-neutral-100 bg-white/95 px-5 py-3.5 backdrop-blur-md">
              {tabCounts.unread > 0 ? (
                <button
                  onClick={handleMarkAllReadClick}
                  disabled={isBulkMarkingRead}
                  className="flex items-center gap-1.5 text-[11px] font-bold text-red-600 transition-colors hover:text-red-700 disabled:opacity-50 focus:outline-none focus:underline"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
                    <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                  </svg>
                  {isBulkMarkingRead ? "Marking read…" : "Mark all read"}
                </button>
              ) : (
                <span className="flex items-center gap-1.5 text-[11px] font-semibold text-neutral-400">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
                    <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd" />
                  </svg>
                  All caught up
                </span>
              )}

              {hasReadNotifications && (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="text-[11px] font-bold text-neutral-400 transition-colors hover:text-red-600 focus:outline-none focus:underline"
                >
                  Delete all read
                </button>
              )}
            </div>
          </>
        )}

        {/* Delete confirmation overlay */}
        {showDeleteConfirm && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-neutral-900/60 p-6 backdrop-blur-sm sm:rounded-2xl">
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-neutral-100 animate-in zoom-in-95 duration-150 space-y-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-600 mx-auto">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
                  <path fillRule="evenodd" d="M16.5 4.478v.227a48.816 48.816 0 0 1 3.878.512.75.75 0 1 1-.256 1.478l-.209-.035-1.005 13.07a3 3 0 0 1-2.991 2.77H8.084a3 3 0 0 1-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 0 1-.256-1.478A48.567 48.567 0 0 1 7.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 0 1 3.369 0c1.603.051 2.815 1.387 2.815 2.951Zm-6.136-1.452a51.196 51.196 0 0 1 3.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 0 0-6 0v-.113c0-.794.609-1.428 1.364-1.452Zm-.355 5.945a.75.75 0 1 0-1.5.058l.347 9a.75.75 0 1 0 1.499-.058l-.346-9Zm5.48.058a.75.75 0 1 0-1.498-.058l-.347 9a.75.75 0 0 0 1.5.058l.345-9Z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="text-center">
                <h4 className="text-sm font-black text-neutral-900">Delete Read Notifications?</h4>
                <p className="mt-2 text-xs text-neutral-500 font-medium leading-relaxed">
                  All read notifications will be permanently deleted. Unread notifications will remain. This cannot be undone.
                </p>
              </div>
              <div className="flex gap-2.5">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isBulkDeleting}
                  className="flex-1 rounded-xl border border-neutral-200 bg-white py-2.5 text-xs font-bold text-neutral-700 hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-neutral-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAllReadClick}
                  disabled={isBulkDeleting}
                  className="flex-1 rounded-xl bg-red-600 py-2.5 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-red-200"
                >
                  {isBulkDeleting ? "Deleting…" : "Delete all read"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
