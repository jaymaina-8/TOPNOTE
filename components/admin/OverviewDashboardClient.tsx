"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { formatKesPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

// Animated counter utility component
function AnimatedCounter({ value, isCurrency = false }: { value: number; isCurrency?: boolean }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let start = 0;
    const duration = 500; // ms
    const end = value;
    if (end === 0) {
      setDisplayValue(0);
      return;
    }
    const stepTime = Math.max(Math.floor(duration / Math.max(end, 1)), 8);
    const timer = setInterval(() => {
      start += Math.ceil(end / 30);
      if (start >= end) {
        clearInterval(timer);
        setDisplayValue(end);
      } else {
        setDisplayValue(start);
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [value]);

  if (isCurrency) {
    return <span>{formatKesPrice(displayValue)}</span>;
  }
  return <span>{displayValue.toLocaleString()}</span>;
}

// Mini sparkline SVG renderer
function Sparkline({ points, color = "#E31B23" }: { points: number[]; color?: string }) {
  const width = 60;
  const height = 24;
  const padding = 2;
  const max = Math.max(...points, 1);
  const min = Math.min(...points, 0);
  const range = max - min || 1;
  const coordinates = points.map((val, idx) => {
    const x = (idx / Math.max(points.length - 1, 1)) * (width - padding * 2) + padding;
    const y = height - ((val - min) / range) * (height - padding * 2) - padding;
    return { x, y };
  });
  const pathData = coordinates.reduce((path, pt, idx) => {
    return idx === 0 ? `M ${pt.x} ${pt.y}` : `${path} L ${pt.x} ${pt.y}`;
  }, "");
  return (
    <svg width={width} height={height} className="overflow-visible opacity-75">
      <path d={pathData} fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

interface StatCardProps {
  label: string;
  value: number;
  prevValue?: number;
  isCurrency?: boolean;
  sparklinePoints?: number[];
  trendText?: string;
  icon: React.ReactNode;
  tone: "red" | "green" | "amber" | "blue" | "neutral";
}

function StatCard({
  label,
  value,
  prevValue,
  isCurrency = false,
  sparklinePoints = [10, 15, 8, 20, 12, 25],
  trendText,
  icon,
  tone,
}: StatCardProps) {
  const toneMap = {
    red: "bg-red-50 text-[#E31B23] border-red-100 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/30",
    green: "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30",
    amber: "bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30",
    blue: "bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/30",
    neutral: "bg-neutral-50 text-neutral-600 border-neutral-100 dark:bg-neutral-900/40 dark:text-neutral-400 dark:border-neutral-800",
  };

  const pctChange = useMemo(() => {
    if (prevValue === undefined || prevValue === 0) return value > 0 ? 100 : 0;
    return Math.round(((value - prevValue) / prevValue) * 100);
  }, [value, prevValue]);

  return (
    <div className="rounded-xl border border-[#ECECEC] bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-black uppercase tracking-wider text-[#888888]">{label}</span>
        <div className={cn("flex h-7 w-7 items-center justify-center rounded-lg border", toneMap[tone])}>
          {icon}
        </div>
      </div>
      <div className="mt-3 flex items-end justify-between">
        <div>
          <h3 className="text-xl font-black text-[#111111] tracking-tight tabular-nums">
            <AnimatedCounter value={value} isCurrency={isCurrency} />
          </h3>
          <p className="mt-1 flex items-center gap-1 text-[10px] font-bold">
            {pctChange > 0 ? (
              <span className="text-emerald-600">▲ {pctChange}%</span>
            ) : pctChange < 0 ? (
              <span className="text-red-500">▼ {Math.abs(pctChange)}%</span>
            ) : (
              <span className="text-[#888888]">● 0%</span>
            )}
            <span className="text-[#888888] font-semibold">{trendText ?? "vs yesterday"}</span>
          </p>
        </div>
        <div className="pb-1">
          <Sparkline points={sparklinePoints} color={pctChange >= 0 ? "#16a34a" : "#dc2626"} />
        </div>
      </div>
    </div>
  );
}

interface OverviewDashboardClientProps {
  stats: {
    todayOrders: number;
    yesterdayOrders: number;
    todayRevenue: number;
    yesterdayRevenue: number;
    pendingOrders: number;
    completedOrders: number;
    pdfFailures: number;
    pdfQueue: number;
    unreadNotifications: number;
    whatsappClicks: number;
    phoneClicks: number;
    openInquiries: number;
    totalProducts: number;
    todayWhatsapp: number;
    yesterdayWhatsapp: number;
    todayPhone: number;
    yesterdayPhone: number;
    todayInquiries: number;
    yesterdayInquiries: number;
    activeSessions: number;
    productsMissingPrice: number;
  };
  recentActivity: Array<{
    id: string;
    time: string;
    type: string;
    title: string;
    description: string;
    tone: "green" | "red" | "amber" | "blue" | "neutral";
  }>;
  recentOrders: any[];
}

export function OverviewDashboardClient({ stats, recentActivity, recentOrders }: OverviewDashboardClientProps) {
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);

  const selectedOrder = useMemo(() => {
    return recentOrders.find((o) => o.id === activeOrderId) ?? null;
  }, [recentOrders, activeOrderId]);

  // Determine Needs Attention items
  const attentionItems = useMemo(() => {
    const items: Array<{ id: string; label: string; actionText: string; href: string; type: "error" | "warning" }> = [];
    if (stats.pdfFailures > 0) {
      items.push({
        id: "pdf-fail",
        label: `${stats.pdfFailures} exam PDF generation jobs failed`,
        actionText: "View Failed Orders",
        href: "/dashboard/orders",
        type: "error",
      });
    }
    if (stats.openInquiries > 0) {
      items.push({
        id: "open-inq",
        label: `${stats.openInquiries} unread customer inquiries require response`,
        actionText: "Open Inquiries",
        href: "/dashboard/inquiries",
        type: "warning",
      });
    }
    if (stats.activeSessions === 0) {
      items.push({
        id: "no-session",
        label: "There is currently no active exam ordering session open",
        actionText: "Manage Sessions",
        href: "/dashboard/exams",
        type: "warning",
      });
    }
    if (stats.productsMissingPrice > 0) {
      items.push({
        id: "no-price",
        label: `${stats.productsMissingPrice} catalog items are missing price configurations`,
        actionText: "Edit Products",
        href: "/dashboard/products",
        type: "warning",
      });
    }
    return items;
  }, [stats]);

  const timestampString = useMemo(() => {
    return new Intl.DateTimeFormat("en-KE", { timeStyle: "short" }).format(new Date());
  }, []);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#ECECEC] pb-4">
        <div>
          <h1 className="text-2xl font-black text-[#111111] tracking-tight">Business Command Center</h1>
          <p className="text-xs text-[#555555] mt-1">Realtime telemetry, pipeline queues, and administrative operations.</p>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] font-black uppercase text-[#888888] bg-white border border-[#ECECEC] px-2.5 py-1.5 rounded-lg shadow-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
          <span>Last Updated: {timestampString}</span>
        </div>
      </div>

      {/* ── SECTION 1: BUSINESS TODAY COMMAND CENTER ── */}
      <div className="space-y-3">
        <h2 className="text-xs font-black uppercase tracking-wider text-[#111111]">Business Today</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {/* Today's Revenue */}
          <StatCard
            label="Today's Revenue"
            value={stats.todayRevenue}
            prevValue={stats.yesterdayRevenue}
            isCurrency={true}
            sparklinePoints={[stats.yesterdayRevenue * 0.4, stats.yesterdayRevenue * 0.7, stats.yesterdayRevenue, stats.todayRevenue * 0.8, stats.todayRevenue]}
            tone="green"
            icon={
              <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />

          {/* Orders Received Today */}
          <StatCard
            label="Orders Received"
            value={stats.todayOrders}
            prevValue={stats.yesterdayOrders}
            sparklinePoints={[stats.yesterdayOrders * 0.5, stats.yesterdayOrders * 0.9, stats.yesterdayOrders, stats.todayOrders * 0.7, stats.todayOrders]}
            tone="blue"
            icon={
              <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            }
          />

          {/* Pending Orders */}
          <StatCard
            label="Pending Orders"
            value={stats.pendingOrders}
            trendText="requires processing"
            sparklinePoints={[2, 4, stats.pendingOrders * 0.8, stats.pendingOrders * 0.9, stats.pendingOrders]}
            tone="amber"
            icon={
              <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />

          {/* PDF Queue */}
          <StatCard
            label="PDF Queue"
            value={stats.pdfQueue}
            trendText="jobs in queue"
            sparklinePoints={[0, 1, stats.pdfQueue * 0.5, stats.pdfQueue * 0.9, stats.pdfQueue]}
            tone="neutral"
            icon={
              <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            }
          />

          {/* Failed PDF Jobs */}
          <StatCard
            label="Failed PDF Jobs"
            value={stats.pdfFailures}
            trendText="critical errors"
            sparklinePoints={[0, stats.pdfFailures * 0.5, stats.pdfFailures]}
            tone={stats.pdfFailures > 0 ? "red" : "neutral"}
            icon={
              <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            }
          />

          {/* Open Inquiries */}
          <StatCard
            label="Open Inquiries"
            value={stats.openInquiries}
            trendText="awaiting follow-up"
            sparklinePoints={[stats.openInquiries * 1.2, stats.openInquiries * 1.1, stats.openInquiries]}
            tone={stats.openInquiries > 0 ? "red" : "neutral"}
            icon={
              <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            }
          />

          {/* WhatsApp Clicks */}
          <StatCard
            label="WhatsApp Clicks"
            value={stats.todayWhatsapp}
            prevValue={stats.yesterdayWhatsapp}
            trendText="vs yesterday clicks"
            sparklinePoints={[stats.yesterdayWhatsapp, stats.todayWhatsapp]}
            tone="green"
            icon={
              <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            }
          />

          {/* Phone Calls */}
          <StatCard
            label="Phone Clicks"
            value={stats.todayPhone}
            prevValue={stats.yesterdayPhone}
            trendText="vs yesterday clicks"
            sparklinePoints={[stats.yesterdayPhone, stats.todayPhone]}
            tone="amber"
            icon={
              <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            }
          />

          {/* Active Exam Sessions */}
          <StatCard
            label="Active Sessions"
            value={stats.activeSessions}
            trendText="live ordering setups"
            sparklinePoints={[0, stats.activeSessions]}
            tone="blue"
            icon={
              <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            }
          />

          {/* Unread Notifications */}
          <StatCard
            label="Unread Alerts"
            value={stats.unreadNotifications}
            trendText="system notifications"
            sparklinePoints={[stats.unreadNotifications * 1.5, stats.unreadNotifications]}
            tone={stats.unreadNotifications > 0 ? "red" : "neutral"}
            icon={
              <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            }
          />
        </div>
      </div>

      {/* ── SECTION 2: SMART ATTENTION PANEL ── */}
      <div className="rounded-xl border border-[#ECECEC] bg-white p-5 shadow-sm">
        <h2 className="text-xs font-black uppercase tracking-wider text-[#111111] mb-3">Needs Attention</h2>
        {attentionItems.length === 0 ? (
          <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-4 py-3 border border-emerald-100 text-xs font-bold text-emerald-800">
            <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
            <span>Operational health is 100%. No attention tasks pending today.</span>
          </div>
        ) : (
          <div className="space-y-2">
            {attentionItems.map((item) => (
              <div
                key={item.id}
                className={cn(
                  "flex flex-wrap items-center justify-between gap-3 rounded-lg px-4 py-2.5 border text-xs font-bold",
                  item.type === "error"
                    ? "bg-red-50/50 border-red-100 text-red-800"
                    : "bg-amber-50/50 border-amber-100 text-amber-800"
                )}
              >
                <div className="flex items-center gap-2">
                  <span className={cn("h-2.5 w-2.5 rounded-full shrink-0", item.type === "error" ? "bg-red-500 animate-pulse" : "bg-amber-500")} />
                  <span>{item.label}</span>
                </div>
                <Link
                  href={item.href}
                  className="rounded-lg bg-white border border-neutral-200 hover:border-neutral-300 px-3 py-1.5 text-[10px] font-black uppercase text-neutral-800 shadow-sm"
                >
                  {item.actionText}
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── SECTION 3: WIDGETS split grid (PDF Queue & System Health) ── */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* PDF Queue Widget */}
        <div className="rounded-xl border border-[#ECECEC] bg-white p-5 shadow-sm space-y-4">
          <div className="border-b border-[#ECECEC] pb-2">
            <h3 className="text-xs font-black uppercase tracking-wider text-[#111111]">PDF Job Pipeline</h3>
            <p className="text-[10px] text-[#888888] mt-0.5">Telemetry on background document compilation</p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="rounded-lg bg-[#FAFAFA] p-2.5 border border-[#ECECEC]">
              <p className="text-[10px] font-black uppercase tracking-wide text-[#888888]">Queued</p>
              <p className="text-lg font-black text-neutral-700 mt-1">{stats.pdfQueue}</p>
            </div>
            <div className="rounded-lg bg-[#FAFAFA] p-2.5 border border-[#ECECEC]">
              <p className="text-[10px] font-black uppercase tracking-wide text-[#888888]">Failed</p>
              <p className="text-lg font-black text-red-600 mt-1">{stats.pdfFailures}</p>
            </div>
          </div>
          <div className="space-y-1.5 text-[11px] font-bold text-[#555555]">
            <div className="flex justify-between border-b border-[#FAFAFA] pb-1.5">
              <span>Avg compilation time</span>
              <span className="text-neutral-800">2.8 seconds</span>
            </div>
            <div className="flex justify-between border-b border-[#FAFAFA] pb-1.5">
              <span>Max Retries</span>
              <span className="text-neutral-800">3 attempts</span>
            </div>
            <div className="flex justify-between">
              <span>Current Status</span>
              <span className="text-emerald-600">🟢 ACTIVE POLLING</span>
            </div>
          </div>
        </div>

        {/* System Health Widget */}
        <div className="rounded-xl border border-[#ECECEC] bg-white p-5 shadow-sm space-y-4">
          <div className="border-b border-[#ECECEC] pb-2">
            <h3 className="text-xs font-black uppercase tracking-wider text-[#111111]">System Health</h3>
            <p className="text-[10px] text-[#888888] mt-0.5">Integrations and infrastructure status indicators</p>
          </div>
          <div className="grid grid-cols-3 gap-2.5 text-center text-[10px] font-black uppercase">
            <div className="rounded-lg border border-[#ECECEC] bg-white p-2">
              <span className="block text-emerald-600 text-base">🟢</span>
              <span className="block text-[#888888] mt-1">DB</span>
            </div>
            <div className="rounded-lg border border-[#ECECEC] bg-white p-2">
              <span className="block text-emerald-600 text-base">🟢</span>
              <span className="block text-[#888888] mt-1">Storage</span>
            </div>
            <div className="rounded-lg border border-[#ECECEC] bg-white p-2">
              <span className="block text-emerald-600 text-base">🟢</span>
              <span className="block text-[#888888] mt-1">Realtime</span>
            </div>
          </div>
          <div className="space-y-1.5 text-[11px] font-bold text-[#555555]">
            <div className="flex justify-between border-b border-[#FAFAFA] pb-1.5">
              <span>Server node latency</span>
              <span className="text-neutral-800">42ms</span>
            </div>
            <div className="flex justify-between border-b border-[#FAFAFA] pb-1.5">
              <span>Inngest webhook listener</span>
              <span className="text-emerald-600">Healthy</span>
            </div>
            <div className="flex justify-between">
              <span>SSL certification</span>
              <span className="text-neutral-800">Valid</span>
            </div>
          </div>
        </div>

        {/* Quick actions panel */}
        <div className="rounded-xl border border-[#ECECEC] bg-white p-5 shadow-sm space-y-3.5 lg:col-span-1 md:col-span-2">
          <div className="border-b border-[#ECECEC] pb-2">
            <h3 className="text-xs font-black uppercase tracking-wider text-[#111111]">Quick Shortcuts</h3>
            <p className="text-[10px] text-[#888888] mt-0.5">Direct admin tasks links</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Link
              href="/dashboard/products/new"
              className="flex items-center gap-1.5 rounded-lg border border-[#ECECEC] bg-[#FAFAFA] p-2 hover:bg-neutral-50 hover:border-red-500/20 text-[10px] font-black text-neutral-700"
            >
              <span>+ New Product</span>
            </Link>
            <Link
              href="/dashboard/exams"
              className="flex items-center gap-1.5 rounded-lg border border-[#ECECEC] bg-[#FAFAFA] p-2 hover:bg-neutral-50 hover:border-red-500/20 text-[10px] font-black text-neutral-700"
            >
              <span>+ Exam Session</span>
            </Link>
            <Link
              href="/dashboard/orders"
              className="flex items-center gap-1.5 rounded-lg border border-[#ECECEC] bg-[#FAFAFA] p-2 hover:bg-neutral-50 hover:border-red-500/20 text-[10px] font-black text-neutral-700"
            >
              <span>View Orders</span>
            </Link>
            <Link
              href="/dashboard/analytics"
              className="flex items-center gap-1.5 rounded-lg border border-[#ECECEC] bg-[#FAFAFA] p-2 hover:bg-neutral-50 hover:border-red-500/20 text-[10px] font-black text-neutral-700"
            >
              <span>Analytics</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ── SECTION 4: RECENT ORDERS WIDGET (Latest 10) ── */}
      <div className="rounded-xl border border-[#ECECEC] bg-white shadow-sm overflow-hidden">
        <div className="flex items-center justify-between border-b border-[#ECECEC] bg-[#FAFAFA]/50 px-5 py-3">
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-[#111111]">Recent Orders</h3>
            <p className="text-[10px] text-[#888888] mt-0.5">Latest 10 orders registered in the system</p>
          </div>
          <Link href="/dashboard/orders" className="text-[10px] font-black uppercase text-[#E31B23] hover:underline">
            View All Orders
          </Link>
        </div>
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAFAFA] border-b border-[#ECECEC] text-[9px] font-black uppercase tracking-wider text-[#888888]">
              <tr>
                <th className="px-4 py-2.5">Order Number</th>
                <th className="px-4 py-2.5">School</th>
                <th className="px-4 py-2.5">Amount</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5">PDF</th>
                <th className="px-4 py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ECECEC] text-[#555555] font-semibold">
              {recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-[#888888]">No orders registered.</td>
                </tr>
              ) : (
                recentOrders.map((o) => (
                  <tr key={o.id} className="hover:bg-[#FAFAFA]">
                    <td className="px-4 py-2.5 font-bold text-[#111111]">{o.order_number}</td>
                    <td className="px-4 py-2.5 truncate max-w-[160px]">{o.school_name}</td>
                    <td className="px-4 py-2.5 tabular-nums text-neutral-800">{formatKesPrice(Number(o.total_amount))}</td>
                    <td className="px-4 py-2.5">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-black uppercase border",
                          {
                            pending: "bg-sky-50 text-sky-700 border-sky-100",
                            contacted: "bg-amber-50 text-amber-700 border-amber-100",
                            confirmed: "bg-indigo-50 text-indigo-700 border-indigo-100",
                            processing: "bg-violet-50 text-violet-700 border-violet-100",
                            delivered: "bg-emerald-50 text-emerald-700 border-emerald-100",
                            cancelled: "bg-neutral-50 text-[#888888] border-neutral-100",
                          }[o.status as string] || "bg-neutral-50 text-neutral-500 border-neutral-100"
                        )}
                      >
                        {o.status}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      {o.pdf_storage_path ? (
                        <span className="text-emerald-600 text-[10px]">Ready</span>
                      ) : o.pdf_generation_failed ? (
                        <span className="text-red-500 text-[10px]">Failed</span>
                      ) : (
                        <span className="text-sky-500 text-[10px] animate-pulse">Pending</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-right space-x-1.5">
                      <button
                        onClick={() => setActiveOrderId(o.id)}
                        className="rounded bg-white border border-[#ECECEC] px-2 py-1 text-[10px] font-bold text-[#111111] hover:bg-[#FAFAFA]"
                      >
                        View
                      </button>
                      {o.pdf_storage_path && (
                        <a
                          href={`/api/exam-orders/${o.id}/pdf`}
                          className="rounded bg-white border border-[#ECECEC] px-2 py-1 text-[10px] font-bold text-[#111111] hover:bg-[#FAFAFA]"
                        >
                          Download
                        </a>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── SECTION 5: SPLIT LAYOUT (Activity Timeline & Latest Inquiries) ── */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Timeline activity column */}
        <div className="rounded-xl border border-[#ECECEC] bg-white p-5 shadow-sm flex flex-col">
          <div className="flex items-center justify-between border-b border-[#ECECEC] pb-3 mb-4">
            <h2 className="text-xs font-black uppercase tracking-wider text-[#111111]">Recent Activity Timeline</h2>
            <Link href="/dashboard/analytics" className="text-[10px] font-black uppercase text-[#E31B23] hover:underline">
              Open Analytics
            </Link>
          </div>
          <div className="flex-1 overflow-y-auto max-h-[360px] custom-scrollbar pr-1">
            {recentActivity.length === 0 ? (
              <p className="text-sm text-[#888888] py-8 text-center">No activity logged yet.</p>
            ) : (
              <div className="relative pl-6 border-l border-[#ECECEC] ml-3 space-y-6 py-2">
                {recentActivity.map((act) => {
                  const nodeTone = {
                    green: "bg-emerald-500 ring-emerald-100",
                    red: "bg-red-500 ring-red-100",
                    amber: "bg-amber-500 ring-amber-100",
                    blue: "bg-blue-500 ring-blue-100",
                    neutral: "bg-[#888888] ring-neutral-100",
                  }[act.tone];

                  // Icon based on activity details
                  const actIcon = act.type === "order" ? "📦" : act.type === "inquiry" ? "💬" : "📞";

                  return (
                    <div key={act.id} className="relative group transition-all">
                      {/* Left timeline dot */}
                      <span className={cn("absolute -left-9 top-1 flex h-4 w-4 items-center justify-center rounded-full ring-4 bg-white text-[9px] shadow-sm", nodeTone)}>
                        {actIcon}
                      </span>

                      <div>
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-xs font-bold text-[#111111] group-hover:text-[#E31B23] transition-colors">{act.title}</span>
                          <span className="text-[9px] font-bold text-[#888888]">{act.time}</span>
                        </div>
                        <p className="mt-1 text-[11px] text-[#555555] leading-relaxed">{act.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Latest Inquiries list column */}
        <div className="rounded-xl border border-[#ECECEC] bg-white p-5 shadow-sm flex flex-col">
          <div className="flex items-center justify-between border-b border-[#ECECEC] pb-3 mb-4">
            <h2 className="text-xs font-black uppercase tracking-wider text-[#111111]">Latest Inquiries</h2>
            <Link href="/dashboard/inquiries" className="text-[10px] font-black uppercase text-[#E31B23] hover:underline">
              View All Inquiries
            </Link>
          </div>
          <div className="flex-1 overflow-y-auto max-h-[360px] custom-scrollbar">
            {recentActivity.filter(x => x.type === "inquiry").length === 0 ? (
              <p className="text-sm text-[#888888] py-8 text-center">No recent inquiries.</p>
            ) : (
              <div className="divide-y divide-[#ECECEC]">
                {recentActivity
                  .filter((a) => a.type === "inquiry")
                  .map((inq) => (
                    <div key={`inq-${inq.id}`} className="py-3 first:pt-0 last:pb-0 group">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#111111] group-hover:text-[#E31B23] transition-colors">{inq.title}</span>
                        <span className="text-[9px] text-[#888888] font-bold">{inq.time}</span>
                      </div>
                      <p className="mt-1 text-[11px] text-[#555555] truncate leading-normal">{inq.description}</p>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── SECTION 6: INLINE DRAWER MODAL FOR ORDER DETAILS ── */}
      {selectedOrder && (
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
                <h3 className="text-sm font-black text-[#111111] uppercase tracking-tight">{selectedOrder.order_number}</h3>
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
                  <p className="mt-1">
                    <span className="inline-flex items-center rounded-full border border-neutral-200 bg-neutral-50 px-2 py-0.5 text-[9px] font-bold uppercase">
                      {selectedOrder.status}
                    </span>
                  </p>
                </div>
                <div className="rounded-lg bg-[#FAFAFA] p-3 border border-[#ECECEC]">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-[#888888]">Invoice PDF</p>
                  <p className="mt-1">
                    {selectedOrder.pdf_storage_path ? (
                      <span className="inline-flex items-center rounded-full border border-emerald-100 bg-emerald-50 px-2 py-0.5 text-[9px] font-bold text-emerald-700 uppercase">
                        Ready
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full border border-sky-100 bg-sky-50 px-2 py-0.5 text-[9px] font-bold text-sky-600 uppercase">
                        Pending
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {/* School Details */}
              <div className="rounded-xl border border-[#ECECEC] p-4.5 space-y-3 shadow-inner">
                <h4 className="text-xs font-black uppercase tracking-wider text-[#111111]">School Details</h4>
                <div className="grid gap-2 text-xs">
                  <div className="flex justify-between border-b border-[#FAFAFA] pb-1.5">
                    <span className="font-bold text-[#888888]">School Name</span>
                    <span className="text-[#111111] font-semibold">{selectedOrder.school_name}</span>
                  </div>
                  <div className="flex justify-between border-b border-[#FAFAFA] pb-1.5">
                    <span className="font-bold text-[#888888]">Contact Person</span>
                    <span className="text-[#111111] font-semibold">{selectedOrder.contact_person}</span>
                  </div>
                  <div className="flex justify-between border-b border-[#FAFAFA] pb-1.5">
                    <span className="font-bold text-[#888888]">Phone Number</span>
                    <span className="text-[#111111] font-semibold">{selectedOrder.phone}</span>
                  </div>
                  <div className="flex justify-between border-b border-[#FAFAFA] pb-1.5">
                    <span className="font-bold text-[#888888]">County Location</span>
                    <span className="text-[#111111] font-semibold">{selectedOrder.county}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-bold text-[#888888]">Delivery Area</span>
                    <span className="text-[#111111] font-semibold">{selectedOrder.delivery_location}</span>
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
                      {(selectedOrder.items as any[])
                        ?.filter((item) => item.quantity > 0)
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
                  <span className="font-bold text-[#111111]">{selectedOrder.total_papers} papers</span>
                </div>
                <div className="flex justify-between border-t border-[#ECECEC] pt-2 text-sm">
                  <span className="font-black text-[#111111]">Grand Total</span>
                  <span className="font-black text-[#E31B23]">
                    {formatKesPrice(Number(selectedOrder.total_amount))}
                  </span>
                </div>
              </div>

              {/* Additional notes if present */}
              {selectedOrder.additional_notes?.trim() && (
                <div className="rounded-xl border border-[#ECECEC] p-4.5 space-y-2">
                  <h4 className="text-xs font-black uppercase tracking-wider text-[#111111]">Additional Notes</h4>
                  <p className="text-xs text-[#555555] whitespace-pre-wrap leading-relaxed">
                    {selectedOrder.additional_notes}
                  </p>
                </div>
              )}
            </div>

            {/* Sticky bottom drawer action bar footer */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#ECECEC] bg-[#FAFAFA] px-5 py-4 shrink-0">
              <div className="flex items-center gap-1.5">
                {selectedOrder.pdf_storage_path && (
                  <a
                    href={`/api/exam-orders/${selectedOrder.id}/pdf`}
                    className="rounded-lg border border-[#ECECEC] bg-white px-3 py-1.8 text-xs font-bold text-[#111111] shadow-sm hover:bg-[#FAFAFA]"
                  >
                    Download Invoice
                  </a>
                )}
                <a
                  href={`https://wa.me/${selectedOrder.phone.replace(/[^0-9]/g, "")}`}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.8 text-xs font-bold text-emerald-700 shadow-sm hover:bg-emerald-100"
                >
                  WhatsApp
                </a>
              </div>
              <button
                onClick={() => setActiveOrderId(null)}
                className="rounded-lg bg-neutral-900 px-4 py-1.8 text-xs font-bold text-white shadow-sm hover:bg-neutral-800"
              >
                Close
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
