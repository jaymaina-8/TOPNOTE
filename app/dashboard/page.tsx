import { getDashboardOverviewData } from "@/lib/queries/analytics";
import { getExamOrders } from "@/lib/queries/exams";
import { getAllProducts } from "@/lib/queries/products";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { OverviewDashboardClient } from "@/components/admin/OverviewDashboardClient";

export const dynamic = "force-dynamic";

function formatWhen(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-KE", { dateStyle: "short", timeStyle: "short" }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function isTodayKenya(iso: string): boolean {
  try {
    const orderDate = new Date(iso);
    const today = new Date();
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: "Africa/Nairobi",
      year: "numeric",
      month: "numeric",
      day: "numeric",
    });
    return formatter.format(orderDate) === formatter.format(today);
  } catch {
    return false;
  }
}

function isYesterdayKenya(iso: string): boolean {
  try {
    const orderDate = new Date(iso);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: "Africa/Nairobi",
      year: "numeric",
      month: "numeric",
      day: "numeric",
    });
    return formatter.format(orderDate) === formatter.format(yesterday);
  } catch {
    return false;
  }
}

export default async function DashboardHomePage() {
  const admin = createServiceRoleClient();

  // Run initial calculations
  const [overview, ordersRes, products] = await Promise.all([
    getDashboardOverviewData(),
    getExamOrders(),
    getAllProducts(),
  ]);

  // Fetch unread notifications count, active sessions, and missing price items
  let unreadNotificationsCount = 0;
  let activeSessions = 0;
  let productsMissingPrice = 0;
  let todayWhatsapp = 0;
  let yesterdayWhatsapp = 0;
  let todayPhone = 0;
  let yesterdayPhone = 0;
  let todayInquiries = 0;
  let yesterdayInquiries = 0;

  if (admin) {
    const [notifCountRes, activeSessionsRes, missingPriceRes] = await Promise.all([
      admin.from("notifications").select("id", { count: "exact", head: true }).eq("is_read", false),
      admin.from("exam_sessions").select("id", { count: "exact", head: true }).eq("status", "active"),
      admin.from("products").select("id", { count: "exact", head: true }).eq("price", 0),
    ]);

    unreadNotificationsCount = notifCountRes.count ?? 0;
    activeSessions = activeSessionsRes.count ?? 0;
    productsMissingPrice = missingPriceRes.count ?? 0;

    // Queries for today/yesterday events & inquiries
    const todayStr = new Date().toISOString().split("T")[0];
    const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split("T")[0];

    const [{ data: todayEvs }, { data: yesterdayEvs }, { count: tInq }, { count: yInq }] = await Promise.all([
      admin.from("conversion_events").select("event_type").gte("created_at", todayStr + "T00:00:00Z"),
      admin.from("conversion_events").select("event_type").gte("created_at", yesterdayStr + "T00:00:00Z").lt("created_at", todayStr + "T00:00:00Z"),
      admin.from("inquiries").select("id", { count: "exact", head: true }).gte("created_at", todayStr + "T00:00:00Z"),
      admin.from("inquiries").select("id", { count: "exact", head: true }).gte("created_at", yesterdayStr + "T00:00:00Z").lt("created_at", todayStr + "T00:00:00Z"),
    ]);

    if (todayEvs) {
      todayWhatsapp = todayEvs.filter((e) => e.event_type === "whatsapp_click").length;
      todayPhone = todayEvs.filter((e) => e.event_type === "phone_click").length;
    }
    if (yesterdayEvs) {
      yesterdayWhatsapp = yesterdayEvs.filter((e) => e.event_type === "whatsapp_click").length;
      yesterdayPhone = yesterdayEvs.filter((e) => e.event_type === "phone_click").length;
    }
    todayInquiries = tInq ?? 0;
    yesterdayInquiries = yInq ?? 0;
  }

  // Fallbacks if data fails
  const orders = ordersRes.ok ? ordersRes.orders : [];
  const okOverview = overview.ok ? overview : { summary: { openInquiries: 0, totalInquiries: 0, conversionTotals: { whatsapp_click: 0, phone_click: 0, inquiry_submit: 0 } }, recentInquiries: [], recentEvents: [] };

  // Calculate stats
  const todayOrdersList = orders.filter((o) => isTodayKenya(o.created_at));
  const todayOrders = todayOrdersList.length;
  const todayRevenue = todayOrdersList.reduce((sum, o) => sum + Number(o.total_amount || 0), 0);

  const yesterdayOrdersList = orders.filter((o) => isYesterdayKenya(o.created_at));
  const yesterdayOrders = yesterdayOrdersList.length;
  const yesterdayRevenue = yesterdayOrdersList.reduce((sum, o) => sum + Number(o.total_amount || 0), 0);

  const pendingOrders = orders.filter((o) => o.status === "pending").length;
  const completedOrders = orders.filter((o) => o.status === "delivered" || o.status === "confirmed").length;
  const pdfFailures = orders.filter((o) => o.pdf_generation_failed).length;
  const pdfQueue = orders.filter((o) => !o.pdf_storage_path && !o.pdf_generation_failed && o.status !== "cancelled").length;

  const stats = {
    todayOrders,
    yesterdayOrders,
    todayRevenue,
    yesterdayRevenue,
    pendingOrders,
    completedOrders,
    pdfFailures,
    pdfQueue,
    unreadNotifications: unreadNotificationsCount,
    whatsappClicks: okOverview.summary.conversionTotals.whatsapp_click || 0,
    phoneClicks: okOverview.summary.conversionTotals.phone_click || 0,
    openInquiries: okOverview.summary.openInquiries || 0,
    totalProducts: products.length,
    todayWhatsapp,
    yesterdayWhatsapp,
    todayPhone,
    yesterdayPhone,
    todayInquiries,
    yesterdayInquiries,
    activeSessions,
    productsMissingPrice,
  };

  // Compile unified recent activity timeline
  const activities: any[] = [];

  // Map orders
  orders.slice(0, 6).forEach((order) => {
    activities.push({
      id: `order-${order.id}`,
      time: formatWhen(order.created_at),
      timestamp: new Date(order.created_at).getTime(),
      type: "order",
      title: `Order ${order.order_number}`,
      description: `${order.school_name} placed an exam order. Value: KES ${Number(order.total_amount).toLocaleString()}`,
      tone: order.status === "cancelled" ? "neutral" : order.pdf_generation_failed ? "red" : "blue",
    });
  });

  // Map inquiries
  okOverview.recentInquiries.slice(0, 6).forEach((inq) => {
    activities.push({
      id: `inq-${inq.id}`,
      time: formatWhen(inq.created_at),
      timestamp: new Date(inq.created_at).getTime(),
      type: "inquiry",
      title: `Inquiry from ${inq.name ?? "Customer"}`,
      description: `Inquiry: "${inq.message?.substring(0, 80)}${inq.message && inq.message.length > 80 ? '...' : ''}"`,
      tone: inq.status === "closed" ? "neutral" : inq.status === "contacted" ? "amber" : "red",
    });
  });

  // Map events
  okOverview.recentEvents.slice(0, 6).forEach((ev) => {
    const label = ev.event_type === "whatsapp_click" ? "WhatsApp Click" : ev.event_type === "phone_click" ? "Phone Click" : "Inquiry Submit";
    activities.push({
      id: `event-${ev.id}`,
      time: formatWhen(ev.created_at),
      timestamp: new Date(ev.created_at).getTime(),
      type: "event",
      title: label,
      description: `Tracked visitor click on page: ${ev.source_page ?? 'General'}.${ev.product ? ` Product: ${ev.product.name}` : ''}`,
      tone: ev.event_type === "whatsapp_click" ? "green" : "amber",
    });
  });

  // Sort unified activities by timestamp descending
  const recentActivity = activities.sort((a, b) => b.timestamp - a.timestamp).slice(0, 12);
  const recentOrders = orders.slice(0, 10);

  return <OverviewDashboardClient stats={stats} recentActivity={recentActivity} recentOrders={recentOrders} />;
}
