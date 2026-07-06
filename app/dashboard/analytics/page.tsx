import { getAnalyticsPageData } from "@/lib/queries/analytics";
import { getExamOrders } from "@/lib/queries/exams";
import { DashboardAlert, DashboardPageHeader } from "@/components/dashboard/DashboardUi";
import { AnalyticsDashboardClient } from "@/components/admin/AnalyticsDashboardClient";

export const dynamic = "force-dynamic";

interface ChartDataPoint {
  label: string;
  revenue: number;
  orders: number;
}

export default async function DashboardAnalyticsPage() {
  const [analyticsRes, ordersRes] = await Promise.all([
    getAnalyticsPageData(),
    getExamOrders(),
  ]);

  if (analyticsRes.ok === false && analyticsRes.reason === "supabase_unconfigured") {
    return (
      <div>
        <DashboardPageHeader title="Analytics" description="Configure Supabase public URL and anon key to load analytics." />
      </div>
    );
  }

  if (analyticsRes.ok === false && analyticsRes.reason === "service_role_unconfigured") {
    return (
      <div>
        <DashboardPageHeader title="Analytics" />
        <DashboardAlert>
          Add <code className="rounded bg-amber-100 px-1">SUPABASE_SERVICE_ROLE_KEY</code> on the server to read conversion
          and inquiry aggregates.
        </DashboardAlert>
      </div>
    );
  }

  if (analyticsRes.ok === false) {
    return (
      <div>
        <DashboardPageHeader title="Analytics" />
        <DashboardAlert tone="red">Could not load analytics. Try again later.</DashboardAlert>
      </div>
    );
  }

  const d = analyticsRes.data;
  const orders = ordersRes.ok ? ordersRes.orders : [];

  const now = new Date();

  // Helper labels
  const getDayLabel = (date: Date) =>
    date.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "Africa/Nairobi" });

  const getWeekLabel = (date: Date) => {
    const formatted = date.toLocaleDateString("en-US", { month: "numeric", day: "numeric", timeZone: "Africa/Nairobi" });
    return `Wk ${formatted}`;
  };

  const getMonthLabel = (date: Date) =>
    date.toLocaleDateString("en-US", { month: "short", timeZone: "Africa/Nairobi" });

  // 1. DAILY (Last 14 days)
  const daily: ChartDataPoint[] = [];
  for (let i = 13; i >= 0; i--) {
    const targetDate = new Date(now);
    targetDate.setDate(targetDate.getDate() - i);
    const label = getDayLabel(targetDate);

    const matches = orders.filter((o) => {
      const od = new Date(o.created_at);
      return (
        od.getDate() === targetDate.getDate() &&
        od.getMonth() === targetDate.getMonth() &&
        od.getFullYear() === targetDate.getFullYear()
      );
    });

    daily.push({
      label,
      revenue: matches.reduce((sum, o) => sum + Number(o.total_amount || 0), 0),
      orders: matches.length,
    });
  }

  // 2. WEEKLY (Last 8 weeks)
  const weekly: ChartDataPoint[] = [];
  for (let i = 7; i >= 0; i--) {
    const targetDate = new Date(now);
    targetDate.setDate(targetDate.getDate() - i * 7);
    
    // Start of the week (Sunday)
    const sunday = new Date(targetDate);
    sunday.setDate(targetDate.getDate() - targetDate.getDay());
    sunday.setHours(0, 0, 0, 0);

    const saturday = new Date(sunday);
    saturday.setDate(sunday.getDate() + 7);

    const label = getWeekLabel(sunday);

    const matches = orders.filter((o) => {
      const od = new Date(o.created_at);
      return od >= sunday && od < saturday;
    });

    weekly.push({
      label,
      revenue: matches.reduce((sum, o) => sum + Number(o.total_amount || 0), 0),
      orders: matches.length,
    });
  }

  // 3. MONTHLY (Last 6 months)
  const monthly: ChartDataPoint[] = [];
  for (let i = 5; i >= 0; i--) {
    const targetDate = new Date(now);
    targetDate.setMonth(targetDate.getMonth() - i);
    const label = getMonthLabel(targetDate);

    const matches = orders.filter((o) => {
      const od = new Date(o.created_at);
      return od.getMonth() === targetDate.getMonth() && od.getFullYear() === targetDate.getFullYear();
    });

    monthly.push({
      label,
      revenue: matches.reduce((sum, o) => sum + Number(o.total_amount || 0), 0),
      orders: matches.length,
    });
  }

  // 3b. YEARLY (Last 3 years)
  const yearly: ChartDataPoint[] = [];
  for (let i = 2; i >= 0; i--) {
    const targetDate = new Date(now);
    targetDate.setFullYear(targetDate.getFullYear() - i);
    const label = targetDate.getFullYear().toString();

    const matches = orders.filter((o) => {
      const od = new Date(o.created_at);
      return od.getFullYear() === targetDate.getFullYear();
    });

    yearly.push({
      label,
      revenue: matches.reduce((sum, o) => sum + Number(o.total_amount || 0), 0),
      orders: matches.length,
    });
  }

  // 4. POPULAR GRADES (Aggregate students by grade from orders items)
  const gradesMap = new Map<string, number>();
  orders.forEach((o) => {
    const items = o.items as any;
    if (Array.isArray(items)) {
      items.forEach((item) => {
        const q = Number(item.quantity || 0);
        if (q > 0) {
          const name = item.class_label || "Other Grade";
          gradesMap.set(name, (gradesMap.get(name) || 0) + q);
        }
      });
    }
  });

  const popularGrades = Array.from(gradesMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Fallback default grades if map is empty (e.g. fresh installation)
  if (popularGrades.length === 0) {
    popularGrades.push(
      { name: "Grade 4", count: 0 },
      { name: "Grade 5", count: 0 },
      { name: "Grade 6", count: 0 },
      { name: "Junior Secondary (JSS)", count: 0 }
    );
  }

  // Map other tables
  const chartsData = { daily, weekly, monthly, yearly };
  const conversionTotals = {
    whatsapp: d.conversionTotals.whatsapp_click,
    phone: d.conversionTotals.phone_click,
    inquiries: d.conversionTotals.inquiry_submit,
  };
  const inquiryStatus = {
    total: d.totalInquiries,
    new: d.inquiryStatusTotals.new,
    contacted: d.inquiryStatusTotals.contacted,
    closed: d.inquiryStatusTotals.closed,
  };

  const topProductsEvents = d.topProductsByEvents.map((r) => ({
    name: r.name,
    slug: r.slug,
    count: r.count,
  }));

  const topProductsInquiries = d.topProductsByInquiries.map((r) => ({
    name: r.name,
    slug: r.slug,
    count: r.count,
  }));

  const sourcePages = d.sourcePageBreakdown.map((r) => ({
    page: r.sourcePage || "/",
    count: r.count,
  }));

  const recentEvents = d.recentEvents.map((ev) => ({
    id: ev.id,
    created_at: ev.created_at,
    event_type: ev.event_type === "whatsapp_click" ? "WhatsApp Conversion" : ev.event_type === "phone_click" ? "Phone Call Click" : "Inquiry Form Submit",
    source_page: ev.source_page,
    productName: ev.product?.name ?? null,
    productSlug: ev.product?.slug ?? null,
  }));

  return (
    <AnalyticsDashboardClient
      conversionTotals={conversionTotals}
      inquiryStatus={inquiryStatus}
      charts={chartsData}
      popularGrades={popularGrades}
      topProductsEvents={topProductsEvents}
      topProductsInquiries={topProductsInquiries}
      sourcePages={sourcePages}
      recentEvents={recentEvents}
    />
  );
}
