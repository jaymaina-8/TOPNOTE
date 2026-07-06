"use server";

import { createServiceRoleClient } from "@/lib/supabase/admin";
import { guardDashboardFormMutation } from "@/lib/auth/dashboard-access";

export type SearchResultItem = {
  id: string;
  title: string;
  subtitle?: string;
  type: "product" | "order" | "category" | "session";
  href: string;
};

export async function globalSearchAction(query: string): Promise<SearchResultItem[]> {
  // Check authorization
  const denied = await guardDashboardFormMutation();
  if (denied) return [];

  const admin = createServiceRoleClient();
  if (!admin || !query || query.trim().length < 2) return [];

  const q = `%${query.trim()}%`;

  try {
    const [productsRes, ordersRes, sessionsRes, categoriesRes] = await Promise.all([
      admin
        .from("products")
        .select("id, name, slug, price")
        .ilike("name", q)
        .limit(5),
      admin
        .from("exam_orders")
        .select("id, order_number, school_name, phone, status")
        .or(`order_number.ilike.${q},school_name.ilike.${q},phone.ilike.${q},contact_person.ilike.${q}`)
        .limit(5),
      admin
        .from("exam_sessions")
        .select("id, name, slug")
        .ilike("name", q)
        .limit(5),
      admin
        .from("categories")
        .select("id, name, slug, type")
        .ilike("name", q)
        .limit(5),
    ]);

    const results: SearchResultItem[] = [];

    // Products
    if (productsRes.data) {
      productsRes.data.forEach((p) => {
        results.push({
          id: p.id,
          title: p.name,
          subtitle: `KES ${p.price}`,
          type: "product",
          href: `/dashboard/products`,
        });
      });
    }

    // Orders
    if (ordersRes.data) {
      ordersRes.data.forEach((o) => {
        results.push({
          id: o.id,
          title: o.order_number,
          subtitle: `${o.school_name} (${o.status})`,
          type: "order",
          href: `/dashboard/orders`,
        });
      });
    }

    // Sessions
    if (sessionsRes.data) {
      sessionsRes.data.forEach((s) => {
        results.push({
          id: s.id,
          title: s.name,
          subtitle: `Exam Session`,
          type: "session",
          href: `/dashboard/exams`,
        });
      });
    }

    // Categories
    if (categoriesRes.data) {
      categoriesRes.data.forEach((c) => {
        results.push({
          id: c.id,
          title: c.name,
          subtitle: `Category (${c.type})`,
          type: "category",
          href: `/dashboard/categories`,
        });
      });
    }

    return results;
  } catch (err) {
    console.error("[globalSearchAction]", err);
    return [];
  }
}
