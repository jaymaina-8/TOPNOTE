import "server-only";

import { createServiceRoleClient } from "@/lib/supabase/admin";
import { getSupabaseEnv } from "@/lib/supabase/env";
import type { InquiryStatus } from "@/lib/supabase/types";

import { getRecentInquiries } from "./inquiries";
import type { InquiryWithProduct } from "./inquiries";

const DELETED_PRODUCT_LABEL = "(deleted product)";

export type AnalyticsFailureReason =
  | "supabase_unconfigured"
  | "service_role_unconfigured"
  | "query_failed";

export type ConversionTotals = {
  whatsapp_click: number;
  phone_click: number;
  inquiry_submit: number;
};

export type InquiryStatusTotals = Record<InquiryStatus, number>;

export type TopProductRow = {
  productId: string;
  name: string;
  slug: string;
  count: number;
};

export type SourcePageRow = {
  sourcePage: string;
  count: number;
};

export type RecentConversionEventRow = {
  id: string;
  event_type: string;
  source_page: string | null;
  source_product_id: string | null;
  created_at: string;
  product: { name: string; slug: string } | null;
};

export type AnalyticsPageData = {
  conversionTotals: ConversionTotals;
  inquiryStatusTotals: InquiryStatusTotals;
  totalInquiries: number;
  topProductsByEvents: TopProductRow[];
  topProductsByInquiries: TopProductRow[];
  sourcePageBreakdown: SourcePageRow[];
  recentEvents: RecentConversionEventRow[];
};

export type AnalyticsPageResult =
  | { ok: true; data: AnalyticsPageData }
  | { ok: false; reason: AnalyticsFailureReason };

function adminOrFailure():
  | { ok: true; admin: NonNullable<ReturnType<typeof createServiceRoleClient>> }
  | { ok: false; reason: AnalyticsFailureReason } {
  const admin = createServiceRoleClient();
  if (!admin) {
    const { isConfigured } = getSupabaseEnv({ allowServerOnlyAliases: true });
    if (!isConfigured) return { ok: false, reason: "supabase_unconfigured" };
    return { ok: false, reason: "service_role_unconfigured" };
  }
  return { ok: true, admin };
}

function toSafeCount(value: unknown): number {
  if (typeof value === "bigint") return Number(value);
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

async function countByEventType(
  admin: NonNullable<ReturnType<typeof createServiceRoleClient>>,
  eventType: string,
): Promise<number> {
  const { count, error } = await admin
    .from("conversion_events")
    .select("*", { count: "exact", head: true })
    .eq("event_type", eventType);
  if (error) {
    console.error("[countByEventType]", error.message);
    return 0;
  }
  return count ?? 0;
}

async function countInquiriesByStatus(
  admin: NonNullable<ReturnType<typeof createServiceRoleClient>>,
  status: InquiryStatus,
): Promise<number> {
  const { count, error } = await admin
    .from("inquiries")
    .select("*", { count: "exact", head: true })
    .eq("status", status);
  if (error) {
    console.error("[countInquiriesByStatus]", error.message);
    return 0;
  }
  return count ?? 0;
}

async function fetchProductsByIds(
  admin: NonNullable<ReturnType<typeof createServiceRoleClient>>,
  ids: string[],
): Promise<Map<string, { name: string; slug: string }>> {
  const map = new Map<string, { name: string; slug: string }>();
  if (ids.length === 0) return map;
  const { data, error } = await admin.from("products").select("id, name, slug").in("id", ids);
  if (error || !data) return map;
  for (const row of data) {
    map.set(row.id, { name: row.name, slug: row.slug });
  }
  return map;
}

/**
 * Merge exact top-N aggregates with product rows only for those IDs (deterministic; no Map key ordering).
 */
async function topProductsFromEventCounts(
  admin: NonNullable<ReturnType<typeof createServiceRoleClient>>,
  rows: { source_product_id: string; event_count: unknown }[],
): Promise<TopProductRow[]> {
  if (rows.length === 0) return [];
  const ids = rows.map((r) => r.source_product_id);
  const names = await fetchProductsByIds(admin, ids);
  return rows.map((r) => {
    const productId = r.source_product_id;
    const count = toSafeCount(r.event_count);
    const p = names.get(productId);
    return {
      productId,
      count,
      name: p?.name ?? DELETED_PRODUCT_LABEL,
      slug: p?.slug ?? "",
    };
  });
}

async function topProductsFromInquiryCounts(
  admin: NonNullable<ReturnType<typeof createServiceRoleClient>>,
  rows: { source_product_id: string; inquiry_count: unknown }[],
): Promise<TopProductRow[]> {
  if (rows.length === 0) return [];
  const ids = rows.map((r) => r.source_product_id);
  const names = await fetchProductsByIds(admin, ids);
  return rows.map((r) => {
    const productId = r.source_product_id;
    const count = toSafeCount(r.inquiry_count);
    const p = names.get(productId);
    return {
      productId,
      count,
      name: p?.name ?? DELETED_PRODUCT_LABEL,
      slug: p?.slug ?? "",
    };
  });
}

function mapRecentConversionRow(row: {
  id: string;
  event_type: string;
  source_page: string | null;
  source_product_id: string | null;
  created_at: string;
  products: unknown;
}): RecentConversionEventRow {
  const rel = row.products as { name: string; slug: string } | null;
  const hasProductId = Boolean(row.source_product_id);
  const product =
    rel && rel.name
      ? { name: rel.name, slug: rel.slug }
      : hasProductId
        ? { name: DELETED_PRODUCT_LABEL, slug: "" }
        : null;
  return {
    id: row.id,
    event_type: row.event_type,
    source_page: row.source_page,
    source_product_id: row.source_product_id,
    created_at: row.created_at,
    product,
  };
}

/**
 * Full analytics payload for `/dashboard/analytics` (server-rendered).
 * Aggregates use Postgres GROUP BY via RPC (see `supabase/migrations/*_analytics_dashboard_aggregates.sql`).
 */
export async function getAnalyticsPageData(): Promise<AnalyticsPageResult> {
  const gate = adminOrFailure();
  if (!gate.ok) return gate;
  const { admin } = gate;

  const [
    whatsapp_click,
    phone_click,
    inquiry_submit,
    newCount,
    contactedCount,
    closedCount,
    totalInquiriesRes,
    topEvRpc,
    topInqRpc,
    pageRpc,
  ] = await Promise.all([
    countByEventType(admin, "whatsapp_click"),
    countByEventType(admin, "phone_click"),
    countByEventType(admin, "inquiry_submit"),
    countInquiriesByStatus(admin, "new"),
    countInquiriesByStatus(admin, "contacted"),
    countInquiriesByStatus(admin, "closed"),
    admin.from("inquiries").select("*", { count: "exact", head: true }),
    admin.rpc("dashboard_top_products_by_events", { limit_n: 10 }),
    admin.rpc("dashboard_top_products_by_inquiries", { limit_n: 10 }),
    admin.rpc("dashboard_source_page_breakdown", { limit_n: 20 }),
  ]);

  if (totalInquiriesRes.error) {
    console.error("[getAnalyticsPageData] total inquiries", totalInquiriesRes.error.message);
    return { ok: false, reason: "query_failed" };
  }

  if (topEvRpc.error) {
    console.error("[getAnalyticsPageData] top products by events", topEvRpc.error.message);
    return { ok: false, reason: "query_failed" };
  }
  if (topInqRpc.error) {
    console.error("[getAnalyticsPageData] top products by inquiries", topInqRpc.error.message);
    return { ok: false, reason: "query_failed" };
  }
  if (pageRpc.error) {
    console.error("[getAnalyticsPageData] source page breakdown", pageRpc.error.message);
    return { ok: false, reason: "query_failed" };
  }

  const totalInquiries = totalInquiriesRes.count ?? 0;

  const topProductsByEvents = await topProductsFromEventCounts(admin, topEvRpc.data ?? []);
  const topProductsByInquiries = await topProductsFromInquiryCounts(admin, topInqRpc.data ?? []);

  const sourcePageBreakdown: SourcePageRow[] = (pageRpc.data ?? []).map((r) => ({
    sourcePage: r.source_page,
    count: toSafeCount(r.event_count),
  }));

  const { data: recent, error: recentErr } = await admin
    .from("conversion_events")
    .select("id, event_type, source_page, source_product_id, created_at, products(name, slug)")
    .order("created_at", { ascending: false })
    .limit(25);

  if (recentErr) {
    console.error("[getAnalyticsPageData] recent", recentErr.message);
    return { ok: false, reason: "query_failed" };
  }

  const recentEvents: RecentConversionEventRow[] = (recent ?? []).map((row) =>
    mapRecentConversionRow(row),
  );

  const data: AnalyticsPageData = {
    conversionTotals: { whatsapp_click, phone_click, inquiry_submit },
    inquiryStatusTotals: {
      new: newCount,
      contacted: contactedCount,
      closed: closedCount,
    },
    totalInquiries,
    topProductsByEvents,
    topProductsByInquiries,
    sourcePageBreakdown,
    recentEvents,
  };

  return { ok: true, data };
}

export type DashboardOverviewData = {
  conversionTotals: ConversionTotals;
  inquiryStatusTotals: InquiryStatusTotals;
  totalInquiries: number;
  openInquiries: number;
};

export type DashboardOverviewResult =
  | {
      ok: true;
      summary: DashboardOverviewData;
      recentInquiries: InquiryWithProduct[];
      recentEvents: RecentConversionEventRow[];
    }
  | { ok: false; reason: AnalyticsFailureReason };

/**
 * Summary + small recent lists for `/dashboard` overview.
 */
export async function getDashboardOverviewData(): Promise<DashboardOverviewResult> {
  const gate = adminOrFailure();
  if (!gate.ok) return gate;
  const { admin } = gate;

  const [whatsapp_click, phone_click, inquiry_submit, newCount, contactedCount, closedCount, totalInquiriesRes] =
    await Promise.all([
      countByEventType(admin, "whatsapp_click"),
      countByEventType(admin, "phone_click"),
      countByEventType(admin, "inquiry_submit"),
      countInquiriesByStatus(admin, "new"),
      countInquiriesByStatus(admin, "contacted"),
      countInquiriesByStatus(admin, "closed"),
      admin.from("inquiries").select("*", { count: "exact", head: true }),
    ]);

  if (totalInquiriesRes.error) {
    console.error("[getDashboardOverviewData]", totalInquiriesRes.error.message);
    return { ok: false, reason: "query_failed" };
  }

  const { data: recentEv, error: reErr } = await admin
    .from("conversion_events")
    .select("id, event_type, source_page, source_product_id, created_at, products(name, slug)")
    .order("created_at", { ascending: false })
    .limit(8);

  if (reErr) {
    console.error("[getDashboardOverviewData] recent events", reErr.message);
    return { ok: false, reason: "query_failed" };
  }

  const recentEvents: RecentConversionEventRow[] = (recentEv ?? []).map((row) => mapRecentConversionRow(row));

  const recentInq = await getRecentInquiries(8);
  if (recentInq.ok === false) {
    return { ok: false, reason: recentInq.reason };
  }

  const summary: DashboardOverviewData = {
    conversionTotals: { whatsapp_click, phone_click, inquiry_submit },
    inquiryStatusTotals: {
      new: newCount,
      contacted: contactedCount,
      closed: closedCount,
    },
    totalInquiries: totalInquiriesRes.count ?? 0,
    openInquiries: newCount,
  };

  return {
    ok: true,
    summary,
    recentInquiries: recentInq.inquiries,
    recentEvents,
  };
}
