"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { formatKesPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ExamOrderWithSession } from "@/lib/exams/types";
import type { ExamOrderStatus } from "@/lib/exams/types";
import {
  bulkUpdateExamOrderStatusAction,
  bulkDeleteExamOrdersAction,
  updateExamOrderStatusAction,
  updateExamOrderStatusSingleAction,
  duplicateExamOrderAction,
} from "@/lib/actions/admin/exam-orders";
import { createClient } from "@/lib/supabase/client";

interface OrdersGridClientProps {
  initialOrders: ExamOrderWithSession[];
  sessions: Array<{ id: string; name: string }>;
}

const STATUS_OPTIONS: ExamOrderStatus[] = [
  "pending",
  "contacted",
  "confirmed",
  "processing",
  "delivered",
  "cancelled",
];

const COLUMN_KEYS = [
  { id: "order_number", label: "Order Number" },
  { id: "school_name", label: "School" },
  { id: "phone", label: "Phone" },
  { id: "session", label: "Exam Session" },
  { id: "amount", label: "Total Amount" },
  { id: "status", label: "Status" },
  { id: "pdf_status", label: "PDF Status" },
  { id: "date", label: "Date" },
] as const;

export function OrdersGridClient({ initialOrders, sessions }: OrdersGridClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialStatus = searchParams?.get("status") || "all";
  const initialPdf = searchParams?.get("pdf") || "all";
  const initialSearch = searchParams?.get("search") || "";

  // Grid/Data state
  const [orders, setOrders] = useState(initialOrders);
  useEffect(() => {
    setOrders(initialOrders);
  }, [initialOrders]);

  // Filtering states
  const [search, setSearch] = useState(initialSearch);
  const [statusFilter, setStatusFilter] = useState<string>(initialStatus);
  const [pdfFilter, setPdfFilter] = useState<string>(initialPdf);
  const [sessionFilter, setSessionFilter] = useState<string>("all");
  const [countyFilter, setCountyFilter] = useState<string>("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(
    initialStatus !== "all" || initialPdf !== "all" || initialSearch !== ""
  );

  // Sorting states
  const [sortColumn, setSortColumn] = useState<string>("date");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Selection states
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Visible columns state
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(
    new Set(COLUMN_KEYS.map((c) => c.id))
  );
  const [showColumnDropdown, setShowColumnDropdown] = useState(false);

  // Drawer / Detail modal states
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);

  // Context row actions state
  const [openRowMenuId, setOpenRowMenuId] = useState<string | null>(null);

  // Bulk actions states
  const [bulkActionPending, setBulkActionPending] = useState(false);
  const [showBulkConfirm, setShowBulkConfirm] = useState<{
    type: "delete" | "status";
    status?: ExamOrderStatus;
  } | null>(null);

  // Local notification & custom confirmation dialog state
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const triggerConfirm = (title: string, message: string, onConfirm: () => void) => {
    setConfirmDialog({ isOpen: true, title, message, onConfirm });
  };

  const columnDropdownRef = useRef<HTMLDivElement>(null);
  const rowMenuRef = useRef<HTMLDivElement>(null);

  // Close menus on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (columnDropdownRef.current && !columnDropdownRef.current.contains(e.target as Node)) {
        setShowColumnDropdown(false);
      }
      if (rowMenuRef.current && !rowMenuRef.current.contains(e.target as Node)) {
        setOpenRowMenuId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const activeOrder = useMemo(() => {
    return orders.find((o) => o.id === activeOrderId) ?? null;
  }, [orders, activeOrderId]);

  // Extract unique counties for filter
  const counties = useMemo(() => {
    const set = new Set<string>();
    orders.forEach((o) => {
      if (o.county) set.add(o.county.trim());
    });
    return Array.from(set).sort();
  }, [orders]);

  // Apply filters
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      // 1. Search Query
      const q = search.trim().toLowerCase();
      if (q) {
        const matchSearch =
          o.order_number.toLowerCase().includes(q) ||
          o.school_name.toLowerCase().includes(q) ||
          o.phone.toLowerCase().includes(q) ||
          o.contact_person.toLowerCase().includes(q) ||
          o.county.toLowerCase().includes(q);
        if (!matchSearch) return false;
      }

      // 2. Status
      if (statusFilter !== "all" && o.status !== statusFilter) return false;

      // 3. PDF Generation Status
      if (pdfFilter !== "all") {
        const isGenerated = !!o.pdf_storage_path;
        const isFailed = o.pdf_generation_failed;
        if (pdfFilter === "ready" && !isGenerated) return false;
        if (pdfFilter === "failed" && !isFailed) return false;
        if (pdfFilter === "pending" && (isGenerated || isFailed)) return false;
      }

      // 4. Session
      if (sessionFilter !== "all" && o.session_id !== sessionFilter) return false;

      // 5. County
      if (countyFilter !== "all" && o.county.trim() !== countyFilter) return false;

      // 6. Date Range
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        if (new Date(o.created_at) < start) return false;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        if (new Date(o.created_at) > end) return false;
      }

      return true;
    });
  }, [orders, search, statusFilter, pdfFilter, sessionFilter, countyFilter, startDate, endDate]);

  // Apply Sorting
  const sortedOrders = useMemo(() => {
    const sorted = [...filteredOrders];
    sorted.sort((a, b) => {
      let aVal: any = "";
      let bVal: any = "";

      if (sortColumn === "order_number") {
        aVal = a.order_number;
        bVal = b.order_number;
      } else if (sortColumn === "school_name") {
        aVal = a.school_name;
        bVal = b.school_name;
      } else if (sortColumn === "phone") {
        aVal = a.phone;
        bVal = b.phone;
      } else if (sortColumn === "session") {
        aVal = a.exam_sessions?.name ?? "";
        bVal = b.exam_sessions?.name ?? "";
      } else if (sortColumn === "amount") {
        aVal = Number(a.total_amount || 0);
        bVal = Number(b.total_amount || 0);
      } else if (sortColumn === "status") {
        aVal = a.status;
        bVal = b.status;
      } else if (sortColumn === "pdf_status") {
        aVal = a.pdf_storage_path ? 2 : a.pdf_generation_failed ? 0 : 1;
        bVal = b.pdf_storage_path ? 2 : b.pdf_generation_failed ? 0 : 1;
      } else if (sortColumn === "date") {
        aVal = new Date(a.created_at).getTime();
        bVal = new Date(b.created_at).getTime();
      }

      if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [filteredOrders, sortColumn, sortDirection]);

  // Apply Pagination
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedOrders.slice(start, start + pageSize);
  }, [sortedOrders, currentPage, pageSize]);

  const totalPages = Math.max(Math.ceil(sortedOrders.length / pageSize), 1);

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
    setSelectedIds(new Set());
  }, [search, statusFilter, pdfFilter, sessionFilter, countyFilter, startDate, endDate, sortColumn, sortDirection]);

  // Selection helpers
  const handleSelectAll = () => {
    const pageIds = paginatedOrders.map((o) => o.id);
    const allSelected = pageIds.every((id) => selectedIds.has(id));

    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        pageIds.forEach((id) => next.delete(id));
      } else {
        pageIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const handleSelectRow = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const isRowSelected = (id: string) => selectedIds.has(id);
  const isAllPageSelected =
    paginatedOrders.length > 0 && paginatedOrders.every((o) => selectedIds.has(o.id));

  // Toggle sorting
  const handleSort = (colId: string) => {
    if (sortColumn === colId) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortColumn(colId);
      setSortDirection("asc");
    }
  };

  // Toggle Column Visibility
  const handleToggleColumn = (colId: string) => {
    setVisibleColumns((prev) => {
      const next = new Set(prev);
      if (next.has(colId)) {
        if (next.size > 1) next.delete(colId); // Don't hide last column
      } else {
        next.add(colId);
      }
      return next;
    });
  };

  // CSV Export utility
  const handleExportCSV = () => {
    const selectedOrders = sortedOrders.filter((o) => selectedIds.has(o.id));
    const listToExport = selectedOrders.length > 0 ? selectedOrders : sortedOrders;

    const headers = ["Order Number", "School", "Contact Person", "Phone", "County", "Session", "Amount (KES)", "Status", "Date"];
    const rows = listToExport.map((o) => [
      o.order_number,
      o.school_name,
      o.contact_person,
      o.phone,
      o.county,
      o.exam_sessions?.name ?? "",
      o.total_amount,
      o.status,
      new Date(o.created_at).toLocaleDateString(),
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.map((val) => `"${val}"`).join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `TopNote_Orders_Export_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Excel export mimics CSV for direct compatibility
  const handleExportExcel = () => {
    handleExportCSV();
  };

  // Bulk status update action
  const handleBulkStatusUpdate = async (status: ExamOrderStatus) => {
    setBulkActionPending(true);
    const ids = Array.from(selectedIds);
    const res = await bulkUpdateExamOrderStatusAction(ids, status);
    setBulkActionPending(false);
    setShowBulkConfirm(null);
    if (res.success) {
      setSelectedIds(new Set());
      showToast("Selected orders updated successfully!", "success");
      router.refresh();
    } else {
      showToast(res.error ?? "Failed to update orders.", "error");
    }
  };

  // Bulk delete action
  const handleBulkDelete = async () => {
    setBulkActionPending(true);
    const ids = Array.from(selectedIds);
    const res = await bulkDeleteExamOrdersAction(ids);
    setBulkActionPending(false);
    setShowBulkConfirm(null);
    if (res.success) {
      setSelectedIds(new Set());
      showToast("Selected orders deleted successfully!", "success");
      router.refresh();
    } else {
      showToast(res.error ?? "Failed to delete orders.", "error");
    }
  };

  // Copy helpers
  const copyToClipboard = (text: string, message: string) => {
    navigator.clipboard.writeText(text);
    showToast(message, "success");
  };

  // Status Config for color codes and labels
  const STATUS_CONFIG: Record<
    ExamOrderStatus,
    { label: string; text: string; bg: string; border: string; selectClass: string }
  > = {
    pending: {
      label: "Pending",
      text: "text-amber-700",
      bg: "bg-amber-50",
      border: "border-amber-200",
      selectClass: "bg-amber-50 text-amber-700 border-amber-200",
    },
    contacted: {
      label: "Contacted",
      text: "text-amber-700",
      bg: "bg-amber-50",
      border: "border-amber-200",
      selectClass: "bg-amber-50 text-amber-700 border-amber-200",
    },
    confirmed: {
      label: "Confirmed",
      text: "text-blue-700",
      bg: "bg-blue-50",
      border: "border-blue-200",
      selectClass: "bg-blue-50 text-blue-700 border-blue-200",
    },
    processing: {
      label: "Processing",
      text: "text-purple-700",
      bg: "bg-purple-50",
      border: "border-purple-200",
      selectClass: "bg-purple-50 text-purple-700 border-purple-200",
    },
    delivered: {
      label: "Completed",
      text: "text-emerald-700",
      bg: "bg-emerald-50",
      border: "border-emerald-200",
      selectClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
    },
    cancelled: {
      label: "Cancelled",
      text: "text-red-700",
      bg: "bg-red-50",
      border: "border-red-200",
      selectClass: "bg-red-50 text-red-700 border-red-200",
    },
  };

  const statusBadge = (s: ExamOrderStatus) => {
    const cfg = STATUS_CONFIG[s] || STATUS_CONFIG.pending;
    return (
      <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase", cfg.selectClass)}>
        {cfg.label}
      </span>
    );
  };

  const StatusSelector = ({
    orderId,
    currentStatus,
    disabled = false,
  }: {
    orderId: string;
    currentStatus: ExamOrderStatus;
    disabled?: boolean;
  }) => {
    const config = STATUS_CONFIG[currentStatus] || STATUS_CONFIG.pending;
    return (
      <div className="relative inline-block" onClick={(e) => e.stopPropagation()}>
        <select
          value={currentStatus}
          disabled={disabled}
          onChange={async (e) => {
            const nextStatus = e.target.value as ExamOrderStatus;
            // Optimistic update
            setOrders((prev) =>
              prev.map((o) => (o.id === orderId ? { ...o, status: nextStatus } : o))
            );
            const res = await updateExamOrderStatusSingleAction(orderId, nextStatus);
            if (res.success) {
              showToast(`✓ Order marked as ${STATUS_CONFIG[nextStatus]?.label || nextStatus}`, "success");
            } else {
              // Revert
              setOrders((prev) =>
                prev.map((o) => (o.id === orderId ? { ...o, status: currentStatus } : o))
              );
              showToast(res.error || "Failed to update status", "error");
            }
          }}
          className={cn(
            "appearance-none rounded-full border pl-2.5 pr-6 py-0.5 text-[10px] font-bold uppercase cursor-pointer transition focus:outline-none focus:ring-1 focus:ring-offset-1 focus:ring-neutral-200",
            config.selectClass
          )}
        >
          <option value="pending">Pending</option>
          <option value="contacted">Contacted</option>
          <option value="confirmed">Confirmed</option>
          <option value="processing">Processing</option>
          <option value="delivered">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <span className="absolute right-2.5 top-[50%] -translate-y-[50%] pointer-events-none text-[8px] opacity-70">▼</span>
      </div>
    );
  };

  // Realtime subscription for exam_orders
  useEffect(() => {
    const supabase = createClient();
    if (!supabase) return;

    const channel = supabase
      .channel("realtime-exam-orders-grid")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "exam_orders" },
        async (payload) => {
          if (payload.eventType === "UPDATE") {
            const updated = payload.new as any;
            setOrders((prev) =>
              prev.map((o) => (o.id === updated.id ? { ...o, ...updated } : o))
            );
          } else if (payload.eventType === "INSERT") {
            router.refresh();
          } else if (payload.eventType === "DELETE") {
            const deletedId = payload.old.id as string;
            setOrders((prev) => prev.filter((o) => o.id !== deletedId));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [router]);

  // Fetch status history for active order
  const [statusHistory, setStatusHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    if (!activeOrderId) {
      setStatusHistory([]);
      return;
    }
    const fetchHistory = async () => {
      setLoadingHistory(true);
      const supabase = createClient();
      if (!supabase) {
        setLoadingHistory(false);
        return;
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from("exam_order_status_history")
        .select("*")
        .eq("order_id", activeOrderId)
        .order("changed_at", { ascending: false });
      if (!error && data) {
        setStatusHistory(data);
      }
      setLoadingHistory(false);
    };
    fetchHistory();
  }, [activeOrderId]);

  const pdfBadge = (failed: boolean, path: string | null) => {
    if (path) {
      return (
        <span className="inline-flex items-center rounded-full border border-emerald-100 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 uppercase">
          Ready
        </span>
      );
    }
    if (failed) {
      return (
        <span className="inline-flex items-center rounded-full border border-red-100 bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-600 uppercase">
          Failed
        </span>
      );
    }
    return (
      <span className="inline-flex items-center rounded-full border border-sky-100 bg-sky-50 px-2 py-0.5 text-[10px] font-bold text-sky-600 uppercase animate-pulse">
        Pending
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {/* ── HEADER ── */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#111111] tracking-tight">Orders Grid</h1>
          <p className="text-sm text-[#555555] mt-1">Review school orders, verify papers breakdown, and download invoice PDFs.</p>
        </div>

        {/* View toggles and settings */}
        <div className="flex items-center gap-2">
          {/* Column Toggle dropdown */}
          <div className="relative" ref={columnDropdownRef}>
            <button
              onClick={() => setShowColumnDropdown((o) => !o)}
              className="flex h-9 items-center gap-1.5 rounded-lg border border-[#ECECEC] bg-white px-3 text-xs font-bold text-[#111111] shadow-sm hover:bg-[#FAFAFA] focus:outline-none"
            >
              Columns
              <svg className="h-4 w-4 text-[#888888]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {showColumnDropdown && (
              <div className="absolute right-0 mt-1.5 z-20 w-44 rounded-lg border border-[#ECECEC] bg-white p-2.5 shadow-md space-y-1.5 animate-in fade-in zoom-in-95 duration-100">
                <p className="text-[9px] font-black uppercase tracking-wider text-[#888888] px-1 mb-1">Visible Columns</p>
                {COLUMN_KEYS.map((col) => (
                  <label key={col.id} className="flex items-center gap-2 rounded-md px-1 py-1 text-xs font-semibold text-[#555555] hover:bg-[#FAFAFA] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={visibleColumns.has(col.id)}
                      onChange={() => handleToggleColumn(col.id)}
                      className="h-3.5 w-3.5 rounded border-[#ECECEC] text-[#E31B23] focus:ring-0"
                    />
                    <span>{col.label}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Quick advanced filters button */}
          <button
            onClick={() => setShowAdvancedFilters((o) => !o)}
            className={cn(
              "flex h-9 items-center gap-1.5 rounded-lg border px-3 text-xs font-bold transition shadow-sm focus:outline-none",
              showAdvancedFilters
                ? "border-[#E31B23]/30 bg-[#E31B23]/5 text-[#E31B23]"
                : "border-[#ECECEC] bg-white text-[#111111] hover:bg-[#FAFAFA]"
            )}
          >
            Filters
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
          </button>
        </div>
      </div>

      {/* ── SEARCH AND ADVANCED FILTERS BAR ── */}
      <div className="rounded-xl border border-[#ECECEC] bg-white p-4 shadow-sm space-y-3.5">
        {/* Basic Search and Instant queries */}
        <div className="relative w-full">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-[#888888]">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by school name, phone number, order ID..."
            className="w-full rounded-lg border border-[#ECECEC] bg-white py-1.8 pl-9 pr-4 text-xs text-[#111111] placeholder-[#888888] focus:border-[#E31B23]/30 focus:outline-none focus:ring-1 focus:ring-[#E31B23]/30"
          />
        </div>

        {/* Expandable Advanced Filters Grid */}
        {showAdvancedFilters && (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6 pt-3 border-t border-[#FAFAFA] animate-in fade-in duration-200">
            {/* Status Filter */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#888888]">Order Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full rounded-lg border border-[#ECECEC] bg-white px-2.5 py-1.5 text-xs text-[#555555] focus:outline-none"
              >
                <option value="all">All Statuses</option>
                {STATUS_OPTIONS.map((st) => (
                  <option key={st} value={st}>
                    {STATUS_CONFIG[st]?.label || st}
                  </option>
                ))}
              </select>
            </div>

            {/* PDF Status Filter */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#888888]">PDF Status</label>
              <select
                value={pdfFilter}
                onChange={(e) => setPdfFilter(e.target.value)}
                className="w-full rounded-lg border border-[#ECECEC] bg-white px-2.5 py-1.5 text-xs text-[#555555] focus:outline-none"
              >
                <option value="all">All PDF Statuses</option>
                <option value="ready">Ready (Stored)</option>
                <option value="failed">Failed Generation</option>
                <option value="pending">Generating / Pending</option>
              </select>
            </div>

            {/* Session Filter */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#888888]">Exam Session</label>
              <select
                value={sessionFilter}
                onChange={(e) => setSessionFilter(e.target.value)}
                className="w-full rounded-lg border border-[#ECECEC] bg-white px-2.5 py-1.5 text-xs text-[#555555] focus:outline-none"
              >
                <option value="all">All Sessions</option>
                {sessions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* County Filter */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#888888]">County Location</label>
              <select
                value={countyFilter}
                onChange={(e) => setCountyFilter(e.target.value)}
                className="w-full rounded-lg border border-[#ECECEC] bg-white px-2.5 py-1.5 text-xs text-[#555555] focus:outline-none"
              >
                <option value="all">All Counties</option>
                {counties.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Range Filter */}
            <div className="space-y-1 sm:col-span-2 lg:col-span-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#888888]">Date Range</label>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full rounded-lg border border-[#ECECEC] bg-white px-2.5 py-1 text-xs text-[#555555] focus:outline-none"
                />
                <span className="text-xs text-[#888888]">to</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full rounded-lg border border-[#ECECEC] bg-white px-2.5 py-1 text-xs text-[#555555] focus:outline-none"
                />
                {(startDate || endDate) && (
                  <button
                    onClick={() => { setStartDate(""); setEndDate(""); }}
                    className="text-[10px] font-bold text-red-600 hover:underline shrink-0"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── BULK ACTION FLOATING TOOLBAR ── */}
      {selectedIds.size > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#E31B23]/20 bg-[#FAFAFA] px-4 py-3 shadow-md animate-in slide-in-from-top duration-250">
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#E31B23] text-[10px] font-black text-white">
              {selectedIds.size}
            </span>
            <span className="text-xs font-bold text-[#111111]">Orders Selected</span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {/* Mark status options */}
            <select
              onChange={(e) => {
                if (e.target.value) {
                  setShowBulkConfirm({
                    type: "status",
                    status: e.target.value as ExamOrderStatus,
                  });
                }
              }}
              defaultValue=""
              className="rounded-lg border border-[#ECECEC] bg-white px-2.5 py-1.5 text-xs font-semibold text-[#555555] focus:outline-none"
            >
              <option value="" disabled>
                Change status to...
              </option>
              {STATUS_OPTIONS.map((st) => (
                <option key={st} value={st}>
                  {st.toUpperCase()}
                </option>
              ))}
            </select>

            <button
              onClick={handleExportCSV}
              className="rounded-lg border border-[#ECECEC] bg-white px-2.5 py-1.5 text-xs font-bold text-[#555555] hover:bg-[#FAFAFA]"
            >
              Export CSV
            </button>

            <button
              onClick={() => setShowBulkConfirm({ type: "delete" })}
              className="rounded-lg bg-red-600 px-3 py-1.8 text-xs font-bold text-white shadow-sm hover:bg-red-700 transition"
            >
              Delete Selected
            </button>
          </div>
        </div>
      )}

      {/* ── ORDERS DATA TABLE (DESKTOP) / CARDS (MOBILE) ── */}
      {sortedOrders.length === 0 ? (
        /* Empty State */
        <div className="rounded-xl border border-dashed border-[#ECECEC] bg-white py-14 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FAFAFA] text-[#888888] mb-4">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <h3 className="text-sm font-bold text-[#111111]">No exam orders found</h3>
          <p className="text-xs text-[#888888] mt-1">Try modifying your query search terms or filter constraints.</p>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-hidden rounded-xl border border-[#ECECEC] bg-white shadow-sm">
            <div className="overflow-auto custom-scrollbar max-h-[650px]">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 z-10 border-b border-[#ECECEC] bg-[#FAFAFA] text-[10px] font-black uppercase tracking-wider text-[#888888]">
                  <tr>
                    {/* Checkbox col */}
                    <th className="px-4 py-3.5 w-10">
                      <input
                        type="checkbox"
                        checked={isAllPageSelected}
                        onChange={handleSelectAll}
                        className="h-3.5 w-3.5 rounded border-[#ECECEC] text-[#E31B23] focus:ring-0 cursor-pointer"
                      />
                    </th>
                    {visibleColumns.has("order_number") && (
                      <th className="px-4 py-3.5 cursor-pointer" onClick={() => handleSort("order_number")}>
                        Order # {sortColumn === "order_number" && (sortDirection === "asc" ? "▲" : "▼")}
                      </th>
                    )}
                    {visibleColumns.has("school_name") && (
                      <th className="px-4 py-3.5 cursor-pointer" onClick={() => handleSort("school_name")}>
                        School {sortColumn === "school_name" && (sortDirection === "asc" ? "▲" : "▼")}
                      </th>
                    )}
                    {visibleColumns.has("phone") && (
                      <th className="px-4 py-3.5 cursor-pointer" onClick={() => handleSort("phone")}>
                        Phone {sortColumn === "phone" && (sortDirection === "asc" ? "▲" : "▼")}
                      </th>
                    )}
                    {visibleColumns.has("session") && (
                      <th className="px-4 py-3.5 cursor-pointer" onClick={() => handleSort("session")}>
                        Session {sortColumn === "session" && (sortDirection === "asc" ? "▲" : "▼")}
                      </th>
                    )}
                    {visibleColumns.has("amount") && (
                      <th className="px-4 py-3.5 cursor-pointer text-right" onClick={() => handleSort("amount")}>
                        Total Amount {sortColumn === "amount" && (sortDirection === "asc" ? "▲" : "▼")}
                      </th>
                    )}
                    {visibleColumns.has("status") && (
                      <th className="px-4 py-3.5 cursor-pointer" onClick={() => handleSort("status")}>
                        Status {sortColumn === "status" && (sortDirection === "asc" ? "▲" : "▼")}
                      </th>
                    )}
                    {visibleColumns.has("pdf_status") && (
                      <th className="px-4 py-3.5 cursor-pointer animate-pulse" onClick={() => handleSort("pdf_status")}>
                        PDF Status {sortColumn === "pdf_status" && (sortDirection === "asc" ? "▲" : "▼")}
                      </th>
                    )}
                    {visibleColumns.has("date") && (
                      <th className="px-4 py-3.5 cursor-pointer" onClick={() => handleSort("date")}>
                        Date {sortColumn === "date" && (sortDirection === "asc" ? "▲" : "▼")}
                      </th>
                    )}
                    <th className="px-4 py-3.5 text-right w-16">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ECECEC]">
                  {paginatedOrders.map((o) => (
                    <tr
                      key={o.id}
                      onClick={() => setActiveOrderId(o.id)}
                      className={cn(
                        "hover:bg-[#FAFAFA]/75 transition-colors group cursor-pointer",
                        isRowSelected(o.id) && "bg-[#E31B23]/5"
                      )}
                    >
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isRowSelected(o.id)}
                          onChange={() => handleSelectRow(o.id)}
                          className="h-3.5 w-3.5 rounded border-[#ECECEC] text-[#E31B23] focus:ring-0 cursor-pointer"
                        />
                      </td>
                      {visibleColumns.has("order_number") && (
                        <td className="px-4 py-3 font-bold text-[#111111]">
                          {o.order_number}
                        </td>
                      )}
                      {visibleColumns.has("school_name") && (
                        <td className="px-4 py-3 font-semibold text-[#111111]">
                          <p>{o.school_name}</p>
                          <p className="text-[10px] text-[#888888] mt-0.5">{o.contact_person}</p>
                        </td>
                      )}
                      {visibleColumns.has("phone") && <td className="px-4 py-3 text-neutral-600 font-semibold">{o.phone}</td>}
                      {visibleColumns.has("session") && (
                        <td className="px-4 py-3 text-neutral-600 font-semibold">{o.exam_sessions?.name ?? "—"}</td>
                      )}
                      {visibleColumns.has("amount") && (
                        <td className="px-4 py-3 font-black text-[#111111] tabular-nums text-right">
                          {formatKesPrice(Number(o.total_amount))}
                        </td>
                      )}
                      {visibleColumns.has("status") && (
                        <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          <StatusSelector orderId={o.id} currentStatus={o.status} />
                        </td>
                      )}
                      {visibleColumns.has("pdf_status") && (
                        <td className="px-4 py-3">{pdfBadge(o.pdf_generation_failed, o.pdf_storage_path)}</td>
                      )}
                      {visibleColumns.has("date") && (
                        <td className="px-4 py-3 text-[10px] text-[#888888] font-semibold">
                          {new Intl.DateTimeFormat("en-KE", { dateStyle: "short", timeStyle: "short" }).format(
                            new Date(o.created_at)
                          )}
                        </td>
                      )}
                      <td className="px-4 py-3 text-right relative" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-end items-center gap-1.5">
                          {/* View Button */}
                          <button
                            onClick={() => setActiveOrderId(o.id)}
                            className="inline-flex h-7 items-center gap-1 rounded-lg border border-[#ECECEC] bg-white px-2.5 py-1 text-xs font-bold text-[#555555] hover:text-[#111111] shadow-sm hover:bg-[#FAFAFA] focus:outline-none"
                            title="View Details"
                          >
                            <span>👁</span>
                            <span className="hidden lg:inline">View</span>
                          </button>

                          {/* Download Button */}
                          {o.pdf_storage_path ? (
                            <a
                              href={`/api/exam-orders/${o.id}/pdf`}
                              className="inline-flex h-7 items-center gap-1 rounded-lg border border-[#ECECEC] bg-white px-2.5 py-1 text-xs font-bold text-[#555555] hover:text-[#111111] shadow-sm hover:bg-[#FAFAFA] focus:outline-none"
                              title="Download PDF"
                            >
                              <span>⬇</span>
                              <span className="hidden lg:inline">Download</span>
                            </a>
                          ) : (
                            <button
                              disabled
                              className="inline-flex h-7 items-center gap-1 rounded-lg border border-[#ECECEC] bg-neutral-50 px-2.5 py-1 text-xs font-bold text-neutral-300 cursor-not-allowed shadow-none"
                              title="PDF is generating..."
                            >
                              <span>⬇</span>
                              <span className="hidden lg:inline">Download</span>
                            </button>
                          )}

                          {/* More Button */}
                          <div className="relative">
                            <button
                              onClick={() => setOpenRowMenuId(o.id === openRowMenuId ? null : o.id)}
                              className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#ECECEC] bg-white text-[#888888] hover:text-[#111111] shadow-sm hover:bg-[#FAFAFA] focus:outline-none"
                            >
                              ⋮
                            </button>

                            {/* Dropdown Menu */}
                            {openRowMenuId === o.id && (
                              <div
                                ref={rowMenuRef}
                                className="absolute right-0 mt-1 z-30 w-44 rounded-lg border border-[#ECECEC] bg-white p-1.5 shadow-lg space-y-0.5 text-left animate-in fade-in zoom-in-95 duration-100"
                              >
                                <div className="px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-[#888888] border-b border-[#F4F4F5] mb-1">
                                  Change Status
                                </div>
                                <div className="grid grid-cols-1 gap-0.5 px-1 py-1">
                                  {STATUS_OPTIONS.map((st) => (
                                    <button
                                      key={st}
                                      onClick={async () => {
                                        setOpenRowMenuId(null);
                                        setOrders((prev) =>
                                          prev.map((ord) => (ord.id === o.id ? { ...ord, status: st } : ord))
                                        );
                                        const res = await updateExamOrderStatusSingleAction(o.id, st);
                                        if (res.success) {
                                          showToast(`✓ Order marked as ${STATUS_CONFIG[st]?.label || st}`, "success");
                                        } else {
                                          setOrders((prev) =>
                                            prev.map((ord) => (ord.id === o.id ? { ...ord, status: o.status } : ord))
                                          );
                                          showToast(res.error || "Failed to update status", "error");
                                        }
                                      }}
                                      className={cn(
                                        "flex w-full items-center rounded px-2 py-1 text-[10px] font-bold uppercase",
                                        o.status === st ? "bg-[#E31B23]/5 text-[#E31B23]" : "text-neutral-600 hover:bg-neutral-50"
                                      )}
                                    >
                                      {STATUS_CONFIG[st]?.label || st}
                                    </button>
                                  ))}
                                </div>
                                <div className="h-px bg-[#F4F4F5] my-1" />
                                
                                <button
                                  onClick={async () => {
                                    setOpenRowMenuId(null);
                                    showToast("Duplicating order...", "success");
                                    const res = await duplicateExamOrderAction(o.id);
                                    if (res.success) {
                                      showToast("✓ Order duplicated successfully!", "success");
                                    } else {
                                      showToast(res.error || "Failed to duplicate order", "error");
                                    }
                                  }}
                                  className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-xs font-semibold text-[#555555] hover:bg-[#FAFAFA] hover:text-[#111111]"
                                >
                                  <span>👯</span> Duplicate Order
                                </button>
                                
                                <button
                                  onClick={() => {
                                    setOpenRowMenuId(null);
                                    triggerConfirm(
                                      "Delete Order?",
                                      "This action cannot be undone. Are you sure you want to delete this order?",
                                      () => {
                                        bulkDeleteExamOrdersAction([o.id]).then((res) => {
                                          if (res.success) {
                                            showToast("Order deleted successfully!", "success");
                                            router.refresh();
                                          } else {
                                            showToast(res.error ?? "Failed to delete order.", "error");
                                          }
                                        });
                                      }
                                    );
                                  }}
                                  className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
                                >
                                  <span>🗑</span> Delete Order
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card Grid View */}
          <div className="grid gap-3.5 md:hidden">
            {paginatedOrders.map((o) => (
              <div key={`m-${o.id}`} className="rounded-xl border border-[#ECECEC] bg-white p-4.5 shadow-sm space-y-3.5">
                <div className="flex items-start justify-between">
                  <div>
                    <h4
                      className="text-sm font-black text-[#111111] tracking-tight cursor-pointer"
                      onClick={() => setActiveOrderId(o.id)}
                    >
                      {o.order_number}
                    </h4>
                    <p className="text-[10px] font-bold text-[#888888] mt-0.5">
                      {new Intl.DateTimeFormat("en-KE", { dateStyle: "short", timeStyle: "short" }).format(
                        new Date(o.created_at)
                      )}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                    <StatusSelector orderId={o.id} currentStatus={o.status} />
                    {pdfBadge(o.pdf_generation_failed, o.pdf_storage_path)}
                  </div>
                </div>

                <div className="space-y-1 text-xs">
                  <p className="font-semibold text-[#111111]">{o.school_name}</p>
                  <p className="text-[#555555]">{o.contact_person}</p>
                  <p className="text-[#888888]">{o.phone}</p>
                </div>

                <div className="flex items-center justify-between border-t border-[#FAFAFA] pt-3.5">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#888888]">Total Amount</p>
                    <p className="text-sm font-black text-[#111111] mt-0.5">
                      {formatKesPrice(Number(o.total_amount))}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setActiveOrderId(o.id)}
                      className="rounded-lg border border-[#ECECEC] bg-white px-3 py-1.5 text-xs font-bold text-[#111111] shadow-sm hover:bg-[#FAFAFA]"
                    >
                      View
                    </button>
                    {o.pdf_storage_path && (
                      <a
                        href={`/api/exam-orders/${o.id}/pdf`}
                        className="rounded-lg border border-[#ECECEC] bg-white px-3 py-1.5 text-xs font-bold text-[#111111] shadow-sm hover:bg-[#FAFAFA]"
                      >
                        PDF
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* ── PAGINATION CONTROLS ── */}
          <div className="flex items-center justify-between border-t border-[#ECECEC] pt-4 text-xs">
            <span className="font-bold text-[#888888]">
              Showing {Math.min(filteredOrders.length, (currentPage - 1) * pageSize + 1)} to{" "}
              {Math.min(filteredOrders.length, currentPage * pageSize)} of {filteredOrders.length} orders
            </span>

            <div className="flex items-center gap-1.5">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((c) => c - 1)}
                className="rounded-lg border border-[#ECECEC] bg-white px-3 py-1.5 font-bold hover:bg-[#FAFAFA] disabled:opacity-40 disabled:hover:bg-white focus:outline-none"
              >
                Previous
              </button>
              {Array.from({ length: totalPages }).map((_, idx) => {
                const page = idx + 1;
                // Limit page numbers display for spacing
                if (totalPages > 6 && Math.abs(page - currentPage) > 1 && page !== 1 && page !== totalPages) {
                  if (page === 2 || page === totalPages - 1) return <span key={page}>...</span>;
                  return null;
                }

                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={cn(
                      "rounded-lg px-3 py-1.5 font-bold transition focus:outline-none",
                      currentPage === page
                        ? "bg-[#E31B23] text-white shadow-sm"
                        : "border border-[#ECECEC] bg-white text-[#555555] hover:bg-[#FAFAFA]"
                    )}
                  >
                    {page}
                  </button>
                );
              })}
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((c) => c + 1)}
                className="rounded-lg border border-[#ECECEC] bg-white px-3 py-1.5 font-bold hover:bg-[#FAFAFA] disabled:opacity-40 disabled:hover:bg-white focus:outline-none"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── CENTERED MODAL / RIGHT SIDE DETAILED DRAWER ── */}
      {activeOrder && (
        <>
          {/* Backdrop screen lock */}
          <div
            onClick={() => setActiveOrderId(null)}
            className="fixed inset-0 z-40 bg-black/35 backdrop-blur-[1px] transition-opacity"
          />

          {/* Slide over details drawer container */}
          <div className="fixed inset-y-0 right-0 z-50 w-full max-w-xl bg-white shadow-2xl border-l border-[#ECECEC] flex flex-col animate-in slide-in-from-right duration-250 overflow-hidden">
            {/* Header */}
            <div className="flex h-14 items-center justify-between border-b border-[#ECECEC] px-5 bg-[#FAFAFA]/50 shrink-0">
              <div>
                <h3 className="text-sm font-black text-[#111111] uppercase tracking-tight">{activeOrder.order_number}</h3>
                <p className="text-[10px] font-bold text-[#888888] mt-0.5">Order Details & Breakdown</p>
              </div>
              <button
                onClick={() => setActiveOrderId(null)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-[#888888] hover:bg-neutral-100 hover:text-[#111111] focus:outline-none"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Scrollable breakdown items */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
              {/* Summary metadata cards */}
              <div className="grid gap-3.5 grid-cols-2">
                <div className="rounded-lg bg-[#FAFAFA] p-3 border border-[#ECECEC]">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-[#888888]">Status</p>
                  <div className="mt-1">
                    <StatusSelector orderId={activeOrder.id} currentStatus={activeOrder.status} />
                  </div>
                </div>
                <div className="rounded-lg bg-[#FAFAFA] p-3 border border-[#ECECEC]">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-[#888888]">Invoice PDF</p>
                  <p className="mt-1">{pdfBadge(activeOrder.pdf_generation_failed, activeOrder.pdf_storage_path)}</p>
                </div>
              </div>

              {/* School Details */}
              <div className="rounded-xl border border-[#ECECEC] p-4.5 space-y-3 shadow-inner">
                <h4 className="text-xs font-black uppercase tracking-wider text-[#111111]">School Details</h4>
                <div className="grid gap-2 text-xs">
                  <div className="flex justify-between border-b border-[#FAFAFA] pb-1.5">
                    <span className="font-bold text-[#888888]">School Name</span>
                    <span className="text-[#111111] font-semibold">{activeOrder.school_name}</span>
                  </div>
                  <div className="flex justify-between border-b border-[#FAFAFA] pb-1.5">
                    <span className="font-bold text-[#888888]">Contact Person</span>
                    <span className="text-[#111111] font-semibold">{activeOrder.contact_person}</span>
                  </div>
                  <div className="flex justify-between border-b border-[#FAFAFA] pb-1.5">
                    <span className="font-bold text-[#888888]">Phone Number</span>
                    <span className="text-[#111111] font-semibold">{activeOrder.phone}</span>
                  </div>
                  <div className="flex justify-between border-b border-[#FAFAFA] pb-1.5">
                    <span className="font-bold text-[#888888]">County Location</span>
                    <span className="text-[#111111] font-semibold">{activeOrder.county}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-bold text-[#888888]">Delivery Area</span>
                    <span className="text-[#111111] font-semibold">{activeOrder.delivery_location}</span>
                  </div>
                </div>
              </div>

              {/* Order breakdown papers list */}
              <div className="rounded-xl border border-[#ECECEC] overflow-hidden">
                <div className="border-b border-[#ECECEC] bg-[#FAFAFA] px-4.5 py-3">
                  <h4 className="text-xs font-black uppercase tracking-wider text-[#111111]">Paper Breakdown</h4>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#FAFAFA] text-[10px] font-black uppercase tracking-wider text-[#888888] border-b border-[#ECECEC]">
                      <tr>
                        <th className="px-4 py-2">Class</th>
                        <th className="px-4 py-2 text-right">Students</th>
                        <th className="px-4 py-2 text-right">Unit Price</th>
                        <th className="px-4 py-2 text-right">Line Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#ECECEC] text-[#555555]">
                      {(activeOrder.items as any[])
                        .filter((item) => item.quantity > 0)
                        .map((item, index) => (
                          <tr key={index}>
                            <td className="px-4 py-2 font-semibold text-[#111111]">{item.class_label}</td>
                            <td className="px-4 py-2 text-right font-semibold tabular-nums">{item.quantity}</td>
                            <td className="px-4 py-2 text-right font-semibold tabular-nums">{formatKesPrice(item.unit_price)}</td>
                            <td className="px-4 py-2 text-right font-black text-[#111111] tabular-nums">
                              {formatKesPrice(item.line_total)}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Total summary info */}
              <div className="rounded-xl bg-[#FAFAFA] border border-[#ECECEC] p-4.5 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="font-semibold text-[#888888]">Total Papers/Students</span>
                  <span className="font-bold text-[#111111]">{activeOrder.total_papers} papers</span>
                </div>
                <div className="flex justify-between border-t border-[#ECECEC] pt-2 text-sm">
                  <span className="font-black text-[#111111]">Grand Total</span>
                  <span className="font-black text-[#E31B23]">
                    {formatKesPrice(Number(activeOrder.total_amount))}
                  </span>
                </div>
              </div>

              {/* Additional notes if present */}
              {activeOrder.additional_notes?.trim() && (
                <div className="rounded-xl border border-[#ECECEC] p-4.5 space-y-2">
                  <h4 className="text-xs font-black uppercase tracking-wider text-[#111111]">Additional Notes</h4>
                  <p className="text-xs text-[#555555] whitespace-pre-wrap leading-relaxed">
                    {activeOrder.additional_notes}
                  </p>
                </div>
              )}

              {/* Status History Timeline */}
              <div className="rounded-xl border border-[#ECECEC] p-4.5 space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-[#111111]">Status History</h4>
                {loadingHistory ? (
                  <div className="text-xs text-neutral-400 animate-pulse">Loading status history...</div>
                ) : statusHistory.length === 0 ? (
                  <div className="text-xs text-neutral-400 italic">No status changes recorded yet.</div>
                ) : (
                  <div className="relative border-l border-neutral-200 pl-4 space-y-4">
                    {statusHistory.map((hist) => {
                      const prevLabel = hist.previous_status ? STATUS_CONFIG[hist.previous_status as ExamOrderStatus]?.label || hist.previous_status : "Created";
                      const newLabel = STATUS_CONFIG[hist.new_status as ExamOrderStatus]?.label || hist.new_status;
                      const dateStr = new Intl.DateTimeFormat("en-KE", {
                        dateStyle: "short",
                        timeStyle: "short",
                      }).format(new Date(hist.changed_at));
                      
                      return (
                        <div key={hist.id} className="relative">
                          {/* Dot marker */}
                          <span className="absolute -left-[21px] top-1 flex h-2 w-2 items-center justify-center rounded-full bg-neutral-300 ring-4 ring-white" />
                          <div className="text-xs">
                            <p className="font-bold text-[#111111]">
                              {prevLabel} → <span className="text-[#E31B23]">{newLabel}</span>
                            </p>
                            <p className="text-[10px] text-neutral-400 mt-0.5">
                              Changed by <span className="font-semibold">{hist.changed_by}</span> · {dateStr}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Sticky bottom drawer action bar footer */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#ECECEC] bg-[#FAFAFA] px-5 py-4 shrink-0">
              <div className="flex items-center gap-1.5">
                {activeOrder.pdf_storage_path && (
                  <a
                    href={`/api/exam-orders/${activeOrder.id}/pdf`}
                    className="rounded-lg border border-[#ECECEC] bg-white px-3 py-1.8 text-xs font-bold text-[#111111] shadow-sm hover:bg-[#FAFAFA]"
                  >
                    Download Invoice
                  </a>
                )}
                <a
                  href={`https://wa.me/${activeOrder.phone.replace(/[^0-9]/g, "")}`}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.8 text-xs font-bold text-emerald-700 shadow-sm hover:bg-emerald-100"
                >
                  WhatsApp
                </a>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => {
                    triggerConfirm(
                      "Delete Order?",
                      "This action cannot be undone. Are you sure you want to delete this order?",
                      () => {
                        bulkDeleteExamOrdersAction([activeOrder.id]).then((res) => {
                          if (res.success) {
                            showToast("Order deleted successfully!", "success");
                            setActiveOrderId(null);
                            router.refresh();
                          } else {
                            showToast(res.error ?? "Failed to delete order.", "error");
                          }
                        });
                      }
                    );
                  }}
                  className="rounded-lg border border-red-200 bg-white px-3 py-1.8 text-xs font-bold text-red-600 shadow-sm hover:bg-red-50"
                >
                  Delete Order
                </button>
                <button
                  onClick={() => setActiveOrderId(null)}
                  className="rounded-lg bg-neutral-900 px-3 py-1.8 text-xs font-bold text-white shadow-sm hover:bg-neutral-800"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── BULK CONFIRMATION DIALOG ── */}
      {showBulkConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-2xl border border-[#ECECEC] space-y-4 animate-in zoom-in-95 duration-150">
            <div className="text-center">
              <h4 className="text-sm font-black text-[#111111] uppercase tracking-tight">Confirm Bulk Action</h4>
              <p className="mt-2 text-xs text-[#555555] font-semibold leading-relaxed">
                {showBulkConfirm.type === "delete"
                  ? `Are you sure you want to permanently delete these ${selectedIds.size} orders?`
                  : `Change status of ${selectedIds.size} orders to ${showBulkConfirm.status?.toUpperCase()}?`}
              </p>
            </div>
            <div className="flex gap-2.5">
              <button
                onClick={() => setShowBulkConfirm(null)}
                disabled={bulkActionPending}
                className="flex-1 rounded-lg border border-[#ECECEC] bg-white py-2 text-xs font-bold text-[#555555] hover:bg-[#FAFAFA]"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (showBulkConfirm.type === "delete") {
                    handleBulkDelete();
                  } else {
                    handleBulkStatusUpdate(showBulkConfirm.status!);
                  }
                }}
                disabled={bulkActionPending}
                className="flex-1 rounded-lg bg-red-600 py-2 text-xs font-bold text-white shadow-sm hover:bg-red-700 disabled:opacity-50"
              >
                {bulkActionPending ? "Executing..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ── CUSTOM CONFIRMATION DIALOG ── */}
      {confirmDialog && confirmDialog.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-2xl border border-[#ECECEC] space-y-4 animate-in zoom-in-95 duration-150">
            <div className="text-center">
              <h4 className="text-sm font-black text-[#111111] uppercase tracking-tight">{confirmDialog.title}</h4>
              <p className="mt-2 text-xs text-[#555555] font-semibold leading-relaxed">
                {confirmDialog.message}
              </p>
            </div>
            <div className="flex gap-2.5">
              <button
                onClick={() => setConfirmDialog(null)}
                className="flex-1 rounded-lg border border-[#ECECEC] bg-white py-2 text-xs font-bold text-[#555555] hover:bg-[#FAFAFA]"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  confirmDialog.onConfirm();
                  setConfirmDialog(null);
                }}
                className="flex-1 rounded-lg bg-red-600 py-2 text-xs font-bold text-white shadow-sm hover:bg-red-700"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── LOCAL TOAST NOTIFICATION ── */}
      {toast && (
        <div className="fixed bottom-24 right-4 z-50 flex items-center gap-2 rounded-xl bg-neutral-900 border border-neutral-800 text-white px-4 py-3 shadow-lg animate-in slide-in-from-bottom-5 duration-200">
          <span className="text-xs font-bold">{toast.message}</span>
          <button onClick={() => setToast(null)} className="text-[10px] font-black uppercase text-red-400 hover:text-red-500 ml-2">Dismiss</button>
        </div>
      )}
    </div>
  );
}
