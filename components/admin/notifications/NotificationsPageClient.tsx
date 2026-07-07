"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { useSearchParams } from "next/navigation";
import { useNotifications, type Notification } from "@/components/admin/NotificationProvider";
import { NotificationFilters, type FilterType, type FilterCounts } from "./NotificationFilters";
import { NotificationTimelineRow } from "./NotificationTimelineRow";
import { NotificationDrawer } from "./NotificationDrawer";
import { NotificationPreferences } from "./NotificationPreferences";

/* ─────────────────────────────────────────────
   Date grouping
───────────────────────────────────────────── */

type DateGroup = "Today" | "Yesterday" | "Earlier This Week" | "Last Week" | "Earlier This Month" | "Older";
const GROUP_ORDER: DateGroup[] = ["Today", "Yesterday", "Earlier This Week", "Last Week", "Earlier This Month", "Older"];

function getDateGroup(isoString: string): DateGroup {
  const now = new Date();
  
  // Today start
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  // Yesterday start
  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(yesterdayStart.getDate() - 1);
  
  // Start of this week (Sunday)
  const thisWeekStart = new Date(todayStart);
  thisWeekStart.setDate(thisWeekStart.getDate() - thisWeekStart.getDay());
  
  // Start of last week (7 days before Sunday of this week)
  const lastWeekStart = new Date(thisWeekStart);
  lastWeekStart.setDate(lastWeekStart.getDate() - 7);
  
  // Start of this month
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const d = new Date(isoString);
  const dTime = d.getTime();

  if (dTime >= todayStart.getTime()) return "Today";
  if (dTime >= yesterdayStart.getTime()) return "Yesterday";
  if (dTime >= thisWeekStart.getTime()) return "Earlier This Week";
  if (dTime >= lastWeekStart.getTime()) return "Last Week";
  if (dTime >= thisMonthStart.getTime()) return "Earlier This Month";
  return "Older";
}

/* ─────────────────────────────────────────────
   Skeleton
───────────────────────────────────────────── */

function SkeletonRow() {
  return (
    <div className="flex items-start gap-3 border-b border-neutral-100 px-4 py-3.5 animate-pulse">
      <div className="mt-0.5 h-4 w-4 rounded bg-neutral-200 shrink-0" />
      <div className="mt-0.5 h-7 w-7 rounded-lg bg-neutral-200 shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="flex justify-between gap-4">
          <div className="h-2 w-16 rounded bg-neutral-200" />
          <div className="h-2 w-12 rounded bg-neutral-200" />
        </div>
        <div className="h-3 w-2/5 rounded bg-neutral-200" />
        <div className="h-2 w-3/5 rounded bg-neutral-200" />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Main component
───────────────────────────────────────────── */

export function NotificationsPageClient() {
  const {
    notifications,
    isLoading,
    unreadCount,
    latestInsertedId,
    preferences,
    handlePreferencesChange,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllRead,
  } = useNotifications();

  /* ── Local UI state ── */
  const searchParams = useSearchParams();
  const initialFilter = (searchParams?.get("filter") as FilterType) || "all";
  const [activeFilter, setActiveFilter] = useState<FilterType>(initialFilter);
  const [searchQuery, setSearchQuery]   = useState("");
  const [selectedIds, setSelectedIds]   = useState<Set<string>>(new Set());
  const [displayCount, setDisplayCount] = useState(25);
  const [activeNotifId, setActiveNotifId] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isBulkMarkingRead, setIsBulkMarkingRead] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting]       = useState(false);

  const lastSelectedIndexRef = useRef<number | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const searchRef   = useRef<HTMLInputElement>(null);

  /* ── Filter counts ── */
  const tabCounts = useMemo<FilterCounts>(() => {
    const c: FilterCounts = { all: 0, unread: 0, orders: 0, payments: 0, inquiries: 0, products: 0, testimonials: 0, system: 0 };
    notifications.forEach((n) => {
      c.all++;
      if (!n.is_read) c.unread++;
      if (n.type === "exam_order")  c.orders++;
      if (n.type === "payment")     c.payments++;
      if (n.type === "inquiry")     c.inquiries++;
      if (n.type === "product")     c.products++;
      if (n.type === "testimonial") c.testimonials++;
      if (n.type === "system" || n.type === "warning") c.system++;
    });
    return c;
  }, [notifications]);

  /* ── Filtered + searched items ── */
  const filteredItems = useMemo<Notification[]>(() => {
    let items = [...notifications];

    // Type filter
    switch (activeFilter) {
      case "unread":       items = items.filter((n) => !n.is_read); break;
      case "orders":       items = items.filter((n) => n.type === "exam_order"); break;
      case "payments":     items = items.filter((n) => n.type === "payment"); break;
      case "inquiries":    items = items.filter((n) => n.type === "inquiry"); break;
      case "products":     items = items.filter((n) => n.type === "product"); break;
      case "testimonials": items = items.filter((n) => n.type === "testimonial"); break;
      case "system":       items = items.filter((n) => n.type === "system" || n.type === "warning"); break;
    }

    // Search filter
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      items = items.filter((n) => {
        const m = (n.metadata ?? {}) as Record<string, unknown>;
        return (
          n.title.toLowerCase().includes(q) ||
          n.message.toLowerCase().includes(q) ||
          String(m.school_name ?? "").toLowerCase().includes(q) ||
          String(m.order_number ?? "").toLowerCase().includes(q) ||
          String(m.customer_name ?? "").toLowerCase().includes(q)
        );
      });
    }

    return items;
  }, [notifications, activeFilter, searchQuery]);

  /* ── Visible slice (infinite scroll) ── */
  const visibleItems = useMemo(() => filteredItems.slice(0, displayCount), [filteredItems, displayCount]);
  const hasMore = filteredItems.length > displayCount;

  /* ── Date-grouped items ── */
  const groupedItems = useMemo<[DateGroup, Notification[]][]>(() => {
    const groups = new Map<DateGroup, Notification[]>();
    visibleItems.forEach((n) => {
      const g = getDateGroup(n.created_at);
      if (!groups.has(g)) groups.set(g, []);
      groups.get(g)!.push(n);
    });
    return GROUP_ORDER.filter((g) => groups.has(g)).map((g) => [g, groups.get(g)!]);
  }, [visibleItems]);

  /* ── Infinite scroll observer ── */
  useEffect(() => {
    if (!hasMore || !sentinelRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) setDisplayCount((c) => c + 25); },
      { rootMargin: "200px" }
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore]);

  /* ── Reset displayCount when filter/search changes ── */
  useEffect(() => { setDisplayCount(25); }, [activeFilter, searchQuery]);

  /* ── Clear selection when filter changes ── */
  useEffect(() => { setSelectedIds(new Set()); lastSelectedIndexRef.current = null; }, [activeFilter, searchQuery]);

  /* ── Active notification (for drawer) ── */
  const activeNotification = useMemo(
    () => notifications.find((n) => n.id === activeNotifId) ?? null,
    [notifications, activeNotifId]
  );

  /* ── Checkbox handlers ── */
  const handleCheckboxChange = useCallback(
    (id: string, e: React.MouseEvent<HTMLInputElement>) => {
      const visibleIndex = visibleItems.findIndex((n) => n.id === id);

      if (e.shiftKey && lastSelectedIndexRef.current !== null) {
        const start = Math.min(lastSelectedIndexRef.current, visibleIndex);
        const end   = Math.max(lastSelectedIndexRef.current, visibleIndex);
        const rangeIds = visibleItems.slice(start, end + 1).map((n) => n.id);
        setSelectedIds((prev) => {
          const next = new Set(prev);
          rangeIds.forEach((rid) => next.add(rid));
          return next;
        });
      } else {
        setSelectedIds((prev) => {
          const next = new Set(prev);
          if (next.has(id)) next.delete(id);
          else next.add(id);
          return next;
        });
        lastSelectedIndexRef.current = visibleIndex;
      }
    },
    [visibleItems]
  );

  const handleSelectAll = () => {
    if (selectedIds.size === visibleItems.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(visibleItems.map((n) => n.id)));
    }
  };

  /* ── Bulk actions ── */
  const handleMarkAllRead = async () => {
    if (isBulkMarkingRead) return;
    setIsBulkMarkingRead(true);
    const ids = filteredItems.filter((n) => !n.is_read).map((n) => n.id);
    if (ids.length) await markAllAsRead(ids);
    setIsBulkMarkingRead(false);
  };

  const handleMarkSelectedRead = async () => {
    if (!selectedIds.size) return;
    setIsBulkMarkingRead(true);
    const ids = [...selectedIds].filter((id) => {
      const n = notifications.find((x) => x.id === id);
      return n && !n.is_read;
    });
    if (ids.length) await markAllAsRead(ids);
    setSelectedIds(new Set());
    setIsBulkMarkingRead(false);
  };

  const handleDeleteSelected = async () => {
    if (!selectedIds.size) return;
    setIsBulkDeleting(true);
    for (const id of selectedIds) await deleteNotification(id);
    setSelectedIds(new Set());
    setIsBulkDeleting(false);
  };

  const handleDeleteAllRead = async () => {
    const ids = notifications.filter((n) => n.is_read).map((n) => n.id);
    if (!ids.length) return;
    setIsBulkDeleting(true);
    await deleteAllRead(ids);
    setShowDeleteConfirm(false);
    setIsBulkDeleting(false);
  };

  const hasReadNotifications = notifications.some((n) => n.is_read);
  const allSelectedOnPage = selectedIds.size > 0 && selectedIds.size === visibleItems.length;
  const someSelected = selectedIds.size > 0;

  /* ─────────────────────────────────────────────
     Render
  ───────────────────────────────────────────── */

  return (
    <div className="relative">
      {/* ═══ PAGE HEADER ═══ */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">TOPNOTE PUBLISHERS</p>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-neutral-950 md:text-3xl">
            Notifications
          </h1>
          <p className="mt-1 max-w-lg text-sm text-neutral-500 leading-relaxed">
            Stay updated with exam orders, inquiries, payments and system events.
          </p>
          {/* Stats pills */}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {unreadCount > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-600 ring-1 ring-red-100">
                <span className="h-1.5 w-1.5 rounded-full bg-red-500" aria-hidden="true" />
                Unread: {unreadCount}
              </span>
            )}
            <span className="inline-flex items-center rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-600">
              Total: {notifications.length}
            </span>
          </div>
        </div>

        {/* Header action buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleMarkAllRead}
            disabled={isBulkMarkingRead || unreadCount === 0}
            className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs font-bold text-neutral-700 shadow-sm transition-all hover:bg-neutral-50 disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-neutral-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5 text-green-600">
              <path fillRule="evenodd" d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z" clipRule="evenodd" />
            </svg>
            {isBulkMarkingRead ? "Marking…" : "Mark all read"}
          </button>

          <button
            onClick={() => setShowDeleteConfirm(true)}
            disabled={!hasReadNotifications}
            className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs font-bold text-neutral-700 shadow-sm transition-all hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-neutral-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5">
              <path fillRule="evenodd" d="M5 3.25V4H2.75a.75.75 0 0 0 0 1.5h.3l.815 8.15A1.5 1.5 0 0 0 5.357 15h5.285a1.5 1.5 0 0 0 1.493-1.35l.815-8.15h.3a.75.75 0 0 0 0-1.5H11v-.75A2.25 2.25 0 0 0 8.75 1h-1.5A2.25 2.25 0 0 0 5 3.25Zm2.25-.75a.75.75 0 0 0-.75.75V4h3v-.75a.75.75 0 0 0-.75-.75h-1.5ZM6.05 6a.75.75 0 0 1 .787.713l.275 5.5a.75.75 0 0 1-1.498.075l-.275-5.5A.75.75 0 0 1 6.05 6Zm3.9 0a.75.75 0 0 1 .712.787l-.275 5.5a.75.75 0 0 1-1.498-.075l.275-5.5a.75.75 0 0 1 .786-.711Z" clipRule="evenodd" />
            </svg>
            Delete read
          </button>

          <button
            onClick={() => setShowSettings(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-xs font-bold text-neutral-700 shadow-sm transition-all hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-neutral-200"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5 text-neutral-500">
              <path fillRule="evenodd" d="M6.455 1.146a.5.5 0 0 1 .49-.396h1.11a.5.5 0 0 1 .49.396l.175.868c.45.197.873.46 1.255.776l.85-.303a.5.5 0 0 1 .595.224l.555.96a.5.5 0 0 1-.103.626l-.662.575a4.052 4.052 0 0 1 0 1.446l.662.574a.5.5 0 0 1 .103.627l-.555.96a.5.5 0 0 1-.595.224l-.85-.303c-.382.315-.805.578-1.256.776l-.174.868a.5.5 0 0 1-.49.396h-1.11a.5.5 0 0 1-.49-.396l-.175-.868a3.99 3.99 0 0 1-1.255-.776l-.85.303a.5.5 0 0 1-.594-.224l-.556-.96a.5.5 0 0 1 .103-.626l.662-.575a4.054 4.054 0 0 1 0-1.446l-.662-.574a.5.5 0 0 1-.103-.627l.555-.96a.5.5 0 0 1 .595-.224l.85.303c.382-.315.805-.579 1.255-.776l.175-.868ZM8 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" clipRule="evenodd" />
            </svg>
            Settings
          </button>
        </div>
      </div>

      {/* ═══ FILTERS ═══ */}
      <div className="mb-4">
        <NotificationFilters
          activeFilter={activeFilter}
          onChangeFilter={setActiveFilter}
          counts={tabCounts}
        />
      </div>

      {/* ═══ SEARCH + BULK ACTIONS BAR ═══ */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-neutral-400">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-4 w-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.637 10.637Z" />
            </svg>
          </span>
          <input
            ref={searchRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by school, order, name…"
            className="w-full rounded-lg border border-neutral-200 bg-white py-2 pl-9 pr-8 text-sm text-neutral-900 placeholder-neutral-400 shadow-sm transition-all focus:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-200"
            aria-label="Search notifications"
          />
          {searchQuery && (
            <button
              onClick={() => { setSearchQuery(""); searchRef.current?.focus(); }}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-neutral-400 hover:text-neutral-700"
              aria-label="Clear search"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="h-3.5 w-3.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Bulk action buttons (visible when items selected) */}
        {someSelected && (
          <div className="flex items-center gap-2 animate-in fade-in duration-150">
            <span className="text-xs font-bold text-neutral-500">{selectedIds.size} selected</span>
            <button
              onClick={handleMarkSelectedRead}
              disabled={isBulkMarkingRead}
              className="inline-flex items-center gap-1 rounded-lg bg-neutral-900 px-3 py-2 text-xs font-bold text-white transition-all hover:bg-neutral-700 disabled:opacity-50"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5">
                <path fillRule="evenodd" d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z" clipRule="evenodd" />
              </svg>
              Mark read
            </button>
            <button
              onClick={handleDeleteSelected}
              disabled={isBulkDeleting}
              className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-600 transition-all hover:bg-red-100 disabled:opacity-50"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5">
                <path fillRule="evenodd" d="M5 3.25V4H2.75a.75.75 0 0 0 0 1.5h.3l.815 8.15A1.5 1.5 0 0 0 5.357 15h5.285a1.5 1.5 0 0 0 1.493-1.35l.815-8.15h.3a.75.75 0 0 0 0-1.5H11v-.75A2.25 2.25 0 0 0 8.75 1h-1.5A2.25 2.25 0 0 0 5 3.25Zm2.25-.75a.75.75 0 0 0-.75.75V4h3v-.75a.75.75 0 0 0-.75-.75h-1.5Z" clipRule="evenodd" />
              </svg>
              {isBulkDeleting ? "Deleting…" : "Delete"}
            </button>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="text-xs font-medium text-neutral-400 hover:text-neutral-700 transition-colors"
            >
              Clear
            </button>
          </div>
        )}

        {/* Select all (when not in bulk mode) */}
        {visibleItems.length > 0 && (
          <button
            onClick={handleSelectAll}
            className="ml-auto text-xs font-semibold text-neutral-400 hover:text-neutral-700 transition-colors"
          >
            {allSelectedOnPage ? "Deselect all" : "Select all"}
          </button>
        )}
      </div>

      {/* ═══ TIMELINE LIST ═══ */}
      <div
        id="notification-timeline"
        aria-label="Notifications list"
        className="space-y-6"
      >
        {isLoading ? (
          <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
            {Array.from({ length: 7 }).map((_, i) => <SkeletonRow key={i} />)}
          </div>
        ) : visibleItems.length === 0 ? (
          // Empty state
          <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm flex flex-col items-center justify-center px-8 py-20 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-400">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-8 w-8">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
              </svg>
            </div>
            {searchQuery ? (
              <>
                <h3 className="mt-4 text-sm font-black text-neutral-900">No results for &ldquo;{searchQuery}&rdquo;</h3>
                <p className="mt-1.5 text-xs text-neutral-500 max-w-[220px]">Try a different school name, order number, or keyword.</p>
              </>
            ) : (
              <>
                <h3 className="mt-4 text-sm font-black text-neutral-900">You&apos;re all caught up 🎉</h3>
                <p className="mt-1.5 text-xs text-neutral-500 max-w-[240px]">
                  New exam orders and system activity will appear here.
                </p>
              </>
            )}
          </div>
        ) : (
          // Timeline groups
          groupedItems.map(([group, items]) => (
            <div key={group} className="space-y-2.5">
              {/* Group header (renders outside individual card blocks) */}
              <div className="flex items-center gap-3 px-1 py-1">
                <span className="text-[10.5px] font-black uppercase tracking-widest text-[#E31B23]">
                  {group}
                </span>
                <div className="h-px flex-1 bg-neutral-200" />
                <span className="text-[10px] font-bold text-neutral-400">{items.length}</span>
              </div>

              {/* Rows Card container */}
              <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm divide-y divide-neutral-100">
                {items.map((n) => (
                  <NotificationTimelineRow
                    key={n.id}
                    notification={n}
                    isSelected={selectedIds.has(n.id)}
                    isNew={n.id === latestInsertedId}
                    onCheckboxChange={handleCheckboxChange}
                    onRowClick={(id) => setActiveNotifId(id)}
                    onMarkAsRead={markAsRead}
                    onDelete={deleteNotification}
                  />
                ))}
              </div>
            </div>
          ))
        )}

        {/* Infinite scroll sentinel */}
        {hasMore && <div ref={sentinelRef} className="py-4 text-center text-xs text-neutral-400">Loading more…</div>}
      </div>

      {/* ═══ DETAIL DRAWER ═══ */}
      <NotificationDrawer
        notification={activeNotification}
        onClose={() => setActiveNotifId(null)}
        onMarkAsRead={markAsRead}
        onDelete={deleteNotification}
      />

      {/* ═══ SETTINGS DRAWER ═══ */}
      {showSettings && (
        <>
          <div
            className="fixed inset-0 z-40 bg-neutral-900/20 backdrop-blur-[2px]"
            onClick={() => setShowSettings(false)}
          />
          <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[380px] bg-white shadow-2xl border-l border-neutral-200 animate-in slide-in-from-right duration-300 overflow-hidden">
            <NotificationPreferences
              preferences={preferences}
              onChangePreferences={handlePreferencesChange}
              onClose={() => setShowSettings(false)}
            />
          </div>
        </>
      )}

      {/* ═══ DELETE CONFIRMATION ═══ */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-neutral-100 animate-in zoom-in-95 duration-150 space-y-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-600 mx-auto">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
                <path fillRule="evenodd" d="M16.5 4.478v.227a48.816 48.816 0 0 1 3.878.512.75.75 0 1 1-.256 1.478l-.209-.035-1.005 13.07a3 3 0 0 1-2.991 2.77H8.084a3 3 0 0 1-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 0 1-.256-1.478A48.567 48.567 0 0 1 7.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 0 1 3.369 0c1.603.051 2.815 1.387 2.815 2.951Zm-6.136-1.452a51.196 51.196 0 0 1 3.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 0 0-6 0v-.113c0-.794.609-1.428 1.364-1.452Zm-.355 5.945a.75.75 0 1 0-1.5.058l.347 9a.75.75 0 1 0 1.499-.058l-.346-9Zm5.48.058a.75.75 0 1 0-1.498-.058l-.347 9a.75.75 0 0 0 1.5.058l.345-9Z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="text-center">
              <h4 className="text-sm font-black text-neutral-900">Delete Read Notifications?</h4>
              <p className="mt-2 text-xs text-neutral-500 font-medium leading-relaxed">
                All read notifications will be permanently deleted. Unread notifications will remain.
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
                onClick={handleDeleteAllRead}
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
  );
}
