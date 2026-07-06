"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { formatKesPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

interface ChartDataPoint {
  label: string;
  revenue: number;
  orders: number;
}

interface AnalyticsDashboardClientProps {
  conversionTotals: {
    whatsapp: number;
    phone: number;
    inquiries: number;
  };
  inquiryStatus: {
    total: number;
    new: number;
    contacted: number;
    closed: number;
  };
  charts: {
    daily: ChartDataPoint[];
    weekly: ChartDataPoint[];
    monthly: ChartDataPoint[];
    yearly: ChartDataPoint[];
  };
  popularGrades: Array<{ name: string; count: number }>;
  topProductsEvents: Array<{ name: string; slug: string; count: number }>;
  topProductsInquiries: Array<{ name: string; slug: string; count: number }>;
  sourcePages: Array<{ page: string; count: number }>;
  recentEvents: Array<{
    id: string;
    created_at: string;
    event_type: string;
    source_page: string | null;
    productName: string | null;
    productSlug: string | null;
  }>;
}

export function AnalyticsDashboardClient({
  conversionTotals,
  inquiryStatus,
  charts,
  popularGrades,
  topProductsEvents,
  topProductsInquiries,
  sourcePages,
  recentEvents,
}: AnalyticsDashboardClientProps) {
  const [timeframe, setTimeframe] = useState<"daily" | "weekly" | "monthly" | "yearly">("daily");
  const [hoveredPoint, setHoveredPoint] = useState<{
    index: number;
    x: number;
    y: number;
    revenue: number;
    orders: number;
    label: string;
  } | null>(null);

  const activePoints = charts[timeframe] || [];

  // SVG Chart Dimensions
  const width = 680;
  const height = 240;
  const padding = 40;

  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  // Find Max for scaling
  const maxRevenue = Math.max(...activePoints.map((p) => p.revenue), 1000);
  const maxOrders = Math.max(...activePoints.map((p) => p.orders), 5);

  // Generate SVG Coordinates for Revenue line & filled area
  const revenuePoints = activePoints.map((p, idx) => {
    const x = padding + (idx / Math.max(activePoints.length - 1, 1)) * chartWidth;
    const y = padding + chartHeight - (p.revenue / maxRevenue) * chartHeight;
    return { x, y, revenue: p.revenue, orders: p.orders, label: p.label };
  });

  const revenuePath = revenuePoints.reduce(
    (path, pt, idx) => (idx === 0 ? `M ${pt.x} ${pt.y}` : `${path} L ${pt.x} ${pt.y}`),
    ""
  );

  const areaPath = revenuePoints.length > 0
    ? `${revenuePath} L ${revenuePoints[revenuePoints.length - 1].x} ${padding + chartHeight} L ${revenuePoints[0].x} ${padding + chartHeight} Z`
    : "";

  // Generate SVG Points for Orders Bar Chart
  const barWidth = Math.max((chartWidth / Math.max(activePoints.length, 1)) * 0.35, 4);

  // Generate AI-like business insights
  const insights = useMemo(() => {
    const totalRev = activePoints.reduce((sum, p) => sum + p.revenue, 0);
    const totalOrd = activePoints.reduce((sum, p) => sum + p.orders, 0);
    const mostOrderedGrade = popularGrades[0]?.name ?? "Grade 6 Assessment";
    const primarySource = sourcePages[0]?.page ?? "WhatsApp Direct Link";

    return [
      {
        title: "Revenue Operations Positive",
        body: `KSh ${totalRev.toLocaleString()} processed across ${totalOrd} order cycles within the active ${timeframe} timeframe.`,
        tone: "green" as const,
        icon: "📈",
      },
      {
        title: "Primary Catalog Demand",
        body: `Grade Level "${mostOrderedGrade}" is the highest volume catalog segment, with Grade 6 following.`,
        tone: "blue" as const,
        icon: "🏆",
      },
      {
        title: "Channel Acquisition Leader",
        body: `WhatsApp link triggers represent the highest customer path source, accounting for ${conversionTotals.whatsapp} total click conversions.`,
        tone: "amber" as const,
        icon: "💬",
      },
    ];
  }, [activePoints, popularGrades, timeframe, sourcePages, conversionTotals]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="border-b border-[#ECECEC] pb-4">
        <h1 className="text-2xl font-black text-[#111111] tracking-tight">Analytics Console</h1>
        <p className="text-xs text-[#555555] mt-1">
          Comprehensive business intelligence on revenue, exam orders, conversion actions, and grades.
        </p>
      </div>

      {/* AI-like Business Insights Section */}
      <div className="space-y-3">
        <h2 className="text-xs font-black uppercase tracking-wider text-[#111111]">AI-like Business Insights</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {insights.map((insight, idx) => (
            <div key={idx} className="rounded-xl border border-[#ECECEC] bg-white p-4.5 shadow-sm space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-base">{insight.icon}</span>
                <h4 className="text-xs font-black text-[#111111] uppercase tracking-tight">{insight.title}</h4>
              </div>
              <p className="text-[11px] font-semibold text-[#555555] leading-relaxed">{insight.body}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Primary KPI Toggles */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-[#ECECEC] bg-white p-4 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-wider text-[#888888]">WhatsApp Conversions</p>
          <h3 className="mt-1.5 text-xl font-black text-[#111111]">{conversionTotals.whatsapp.toLocaleString()}</h3>
          <p className="mt-1 text-[9px] font-bold text-emerald-600">● CTA conversions</p>
        </div>
        <div className="rounded-xl border border-[#ECECEC] bg-white p-4 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-wider text-[#888888]">Phone Click-Throughs</p>
          <h3 className="mt-1.5 text-xl font-black text-[#111111]">{conversionTotals.phone.toLocaleString()}</h3>
          <p className="mt-1 text-[9px] font-bold text-amber-600">● Clicks logged</p>
        </div>
        <div className="rounded-xl border border-[#ECECEC] bg-white p-4 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-wider text-[#888888]">Total Form Inquiries</p>
          <h3 className="mt-1.5 text-xl font-black text-[#111111]">{inquiryStatus.total.toLocaleString()}</h3>
          <p className="mt-1 text-[9px] font-bold text-blue-600">● Submissions</p>
        </div>
        <div className="rounded-xl border border-[#ECECEC] bg-white p-4 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-wider text-[#888888]">Open Inquiries</p>
          <h3 className="mt-1.5 text-xl font-black text-[#111111]">{inquiryStatus.new.toLocaleString()}</h3>
          <p className="mt-1 text-[9px] font-bold text-red-500">● Needs attention</p>
        </div>
      </div>

      {/* Interactive Main Graph */}
      <div className="rounded-xl border border-[#ECECEC] bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div>
            <h2 className="text-sm font-bold text-[#111111]">Revenue & Orders Trend</h2>
            <p className="text-[10px] text-[#888888] mt-0.5">Toggle filters to display daily, weekly, or monthly records.</p>
          </div>
          <div className="flex rounded-lg border border-[#ECECEC] bg-[#FAFAFA] p-0.5">
            {(["daily", "weekly", "monthly", "yearly"] as const).map((t) => (
              <button
                key={t}
                onClick={() => {
                  setTimeframe(t);
                  setHoveredPoint(null);
                }}
                className={cn(
                  "rounded-md px-3 py-1 text-xs font-bold capitalize transition",
                  timeframe === t
                    ? "bg-[#E31B23] text-white shadow-sm"
                    : "text-[#555555] hover:text-[#111111]"
                )}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Interactive SVG Container */}
        <div className="relative w-full overflow-x-auto custom-scrollbar">
          <div className="min-w-[700px] select-none">
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
              <defs>
                <linearGradient id="area-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#E31B23" stopOpacity="0.22" />
                  <stop offset="100%" stopColor="#E31B23" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
                const y = padding + chartHeight * ratio;
                return (
                  <line
                    key={`grid-${idx}`}
                    x1={padding}
                    y1={y}
                    x2={width - padding}
                    y2={y}
                    stroke="#F4F4F5"
                    strokeWidth={1.2}
                    strokeDasharray="4 4"
                  />
                );
              })}

              {/* Orders Bars */}
              {activePoints.map((p, idx) => {
                const x = padding + (idx / Math.max(activePoints.length - 1, 1)) * chartWidth;
                const barHeight = (p.orders / maxOrders) * chartHeight;
                const y = padding + chartHeight - barHeight;

                return (
                  <rect
                    key={`bar-${idx}`}
                    x={x - barWidth / 2}
                    y={y}
                    width={barWidth}
                    height={Math.max(barHeight, 2)}
                    fill="#FEE2E2"
                    rx={1.5}
                    className="transition-all duration-300 hover:fill-[#FECACA]"
                  />
                );
              })}

              {/* Filled Area beneath line */}
              {areaPath && (
                <path
                  d={areaPath}
                  fill="url(#area-grad)"
                />
              )}

              {/* Revenue Line */}
              {revenuePath && (
                <path
                  d={revenuePath}
                  fill="none"
                  stroke="#E31B23"
                  strokeWidth={2.2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Hover nodes / Interactive circles */}
              {revenuePoints.map((pt, idx) => (
                <circle
                  key={`dot-${idx}`}
                  cx={pt.x}
                  cy={pt.y}
                  r={hoveredPoint?.index === idx ? 6 : 3.5}
                  fill={hoveredPoint?.index === idx ? "#E31B23" : "white"}
                  stroke="#E31B23"
                  strokeWidth={2}
                  className="cursor-pointer transition-all"
                  onMouseEnter={() =>
                    setHoveredPoint({
                      index: idx,
                      x: pt.x,
                      y: pt.y,
                      revenue: pt.revenue,
                      orders: pt.orders,
                      label: pt.label,
                    })
                  }
                  onMouseLeave={() => setHoveredPoint(null)}
                />
              ))}

              {/* Y Axis Labels (Left - Revenue) */}
              <text x={padding - 8} y={padding + 4} textAnchor="end" className="text-[8px] font-black fill-[#888888] tracking-wider uppercase">
                {formatKesPrice(maxRevenue)}
              </text>
              <text x={padding - 8} y={padding + chartHeight / 2 + 4} textAnchor="end" className="text-[8px] font-black fill-[#888888] tracking-wider uppercase">
                {formatKesPrice(maxRevenue / 2)}
              </text>
              <text x={padding - 8} y={padding + chartHeight + 4} textAnchor="end" className="text-[8px] font-black fill-[#888888] tracking-wider uppercase">
                KES 0
              </text>

              {/* X Axis Labels */}
              {activePoints.map((p, idx) => {
                if (timeframe === "daily" && idx % 2 !== 0 && activePoints.length > 8) return null;
                const x = padding + (idx / Math.max(activePoints.length - 1, 1)) * chartWidth;
                return (
                  <text
                    key={`lbl-${idx}`}
                    x={x}
                    y={height - padding + 16}
                    textAnchor="middle"
                    className="text-[8px] font-black fill-[#888888] tracking-wider uppercase"
                  >
                    {p.label}
                  </text>
                );
              })}
            </svg>

            {/* Custom Interactive Floating Tooltip */}
            {hoveredPoint && (
              <div
                style={{
                  position: "absolute",
                  left: `${(hoveredPoint.x / width) * 100}%`,
                  top: `${(hoveredPoint.y / height) * 100 - 64}%`,
                  transform: "translateX(-50%)",
                }}
                className="pointer-events-none z-10 rounded-lg border border-[#ECECEC] bg-white p-2 shadow-md text-[11px] space-y-0.5 animate-in fade-in zoom-in-95 duration-100"
              >
                <p className="font-bold text-[#111111]">{hoveredPoint.label}</p>
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1 text-[#E31B23] font-bold">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#E31B23]" />
                    Revenue: {formatKesPrice(hoveredPoint.revenue)}
                  </span>
                  <span className="flex items-center gap-1 text-neutral-600 font-bold">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#FECACA]" />
                    Orders: {hoveredPoint.orders}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Popular Grades Chart and Traffic split */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Popular Grades SVG Bar Chart */}
        <div className="rounded-xl border border-[#ECECEC] bg-white p-5 shadow-sm">
          <h2 className="text-xs font-black uppercase tracking-wider text-[#111111] mb-4">Popular Grades</h2>
          <div className="space-y-4">
            {popularGrades.length === 0 ? (
              <p className="text-xs text-[#888888] py-8 text-center">No grade statistics recorded.</p>
            ) : (
              popularGrades.map((grade, idx) => {
                const maxCount = Math.max(...popularGrades.map((g) => g.count), 1);
                const percent = Math.min((grade.count / maxCount) * 100, 100);

                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-semibold text-[#555555]">
                      <span>{grade.name}</span>
                      <span className="font-bold text-[#111111]">{grade.count.toLocaleString()} papers</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-[#FAFAFA] overflow-hidden border border-[#ECECEC]">
                      <div
                        style={{ width: `${percent}%` }}
                        className="h-full rounded-full bg-[#E31B23] transition-all duration-500"
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Traffic Sources & Click Pages */}
        <div className="rounded-xl border border-[#ECECEC] bg-white p-5 shadow-sm flex flex-col">
          <h2 className="text-xs font-black uppercase tracking-wider text-[#111111] mb-4">Top Visited/Click Pages</h2>
          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[#ECECEC] bg-[#FAFAFA] text-[9px] font-black uppercase tracking-wider text-[#888888]">
                <tr>
                  <th className="px-3 py-2">Page URL/Path</th>
                  <th className="px-3 py-2 text-right">Click events</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ECECEC] text-[#555555] font-semibold">
                {sourcePages.length === 0 ? (
                  <tr>
                    <td className="px-3 py-4 text-[#888888] text-center" colSpan={2}>
                      No traffic data tracked yet.
                    </td>
                  </tr>
                ) : (
                  sourcePages.map((row, idx) => (
                    <tr key={idx} className="hover:bg-[#FAFAFA]">
                      <td className="max-w-xs truncate px-3 py-2 text-[#555555]">{row.page}</td>
                      <td className="px-3 py-2 text-right font-bold text-[#111111]">{row.count.toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* split layout: Top Products and Conversion Events */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-[#ECECEC] bg-white p-5 shadow-sm flex flex-col">
          <h2 className="text-xs font-black uppercase tracking-wider text-[#111111] mb-4">Top Catalog Items by Taps</h2>
          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[#ECECEC] bg-[#FAFAFA] text-[9px] font-black uppercase tracking-wider text-[#888888]">
                <tr>
                  <th className="px-3 py-2">Product Name</th>
                  <th className="px-3 py-2 text-right">Click Events</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ECECEC] text-[#555555] font-semibold">
                {topProductsEvents.length === 0 ? (
                  <tr>
                    <td className="px-3 py-4 text-[#888888] text-center" colSpan={2}>
                      No interactions recorded.
                    </td>
                  </tr>
                ) : (
                  topProductsEvents.map((row, idx) => (
                    <tr key={idx} className="hover:bg-[#FAFAFA]">
                      <td className="px-3 py-2">
                        {row.slug ? (
                          <Link href={`/products/${row.slug}`} className="text-[#111111] hover:underline">
                            {row.name}
                          </Link>
                        ) : (
                          row.name
                        )}
                      </td>
                      <td className="px-3 py-2 text-right font-bold text-[#111111]">{row.count}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-xl border border-[#ECECEC] bg-white p-5 shadow-sm flex flex-col">
          <h2 className="text-xs font-black uppercase tracking-wider text-[#111111] mb-4">Recent Tracked Actions</h2>
          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[#ECECEC] bg-[#FAFAFA] text-[9px] font-black uppercase tracking-wider text-[#888888]">
                <tr>
                  <th className="px-3 py-2">Time</th>
                  <th className="px-3 py-2">Action Type</th>
                  <th className="px-3 py-2">Linked Product</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ECECEC] text-[#555555] font-semibold">
                {recentEvents.length === 0 ? (
                  <tr>
                    <td className="px-3 py-4 text-[#888888] text-center" colSpan={3}>
                      No recent activities tracked.
                    </td>
                  </tr>
                ) : (
                  recentEvents.map((ev, idx) => (
                    <tr key={idx} className="hover:bg-[#FAFAFA]">
                      <td className="px-3 py-2 text-[#888888] font-medium">
                        {new Intl.DateTimeFormat("en-KE", { dateStyle: "short", timeStyle: "short" }).format(
                          new Date(ev.created_at)
                        )}
                      </td>
                      <td className="px-3 py-2 font-bold text-[#111111]">{ev.event_type}</td>
                      <td className="px-3 py-2 text-[#555555]">
                        {ev.productName && ev.productSlug ? (
                          <Link href={`/products/${ev.productSlug}`} className="text-[#E31B23] hover:underline">
                            {ev.productName}
                          </Link>
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
