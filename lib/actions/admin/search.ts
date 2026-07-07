"use server";

import { createServiceRoleClient } from "@/lib/supabase/admin";
import { guardDashboardFormMutation } from "@/lib/auth/dashboard-access";

export type SearchResultItem = {
  id: string;
  title: string;
  subtitle?: string;
  type: "product" | "order" | "category" | "session" | "notification" | "school";
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
    const [productsRes, ordersRes, sessionsRes, categoriesRes, notificationsRes] = await Promise.all([
      admin
        .from("products")
        .select("id, name, slug, price")
        .ilike("name", q)
        .limit(5),
      admin
        .from("exam_orders")
        .select("id, order_number, school_name, phone, status")
        .or(`order_number.ilike.${q},school_name.ilike.${q},phone.ilike.${q},contact_person.ilike.${q}`)
        .limit(15),
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
      admin
        .from("notifications")
        .select("id, title, message, type")
        .or(`title.ilike.${q},message.ilike.${q}`)
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
          href: `/dashboard/orders?search=${encodeURIComponent(o.order_number)}`,
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

    // Notifications
    if (notificationsRes.data) {
      notificationsRes.data.forEach((n) => {
        results.push({
          id: n.id,
          title: n.title,
          subtitle: `Notification (${n.type})`,
          type: "notification",
          href: `/dashboard/notifications`,
        });
      });
    }

    // Distinct School Names mapping
    const uniqueSchools = new Set<string>();
    if (ordersRes.data) {
      ordersRes.data.forEach((o) => {
        if (o.school_name && o.school_name.toLowerCase().includes(query.trim().toLowerCase())) {
          uniqueSchools.add(o.school_name.trim());
        }
      });
    }

    Array.from(uniqueSchools).slice(0, 5).forEach((school) => {
      results.push({
        id: `school-${school}`,
        title: school,
        subtitle: `School orders list`,
        type: "school",
        href: `/dashboard/orders?search=${encodeURIComponent(school)}`,
      });
    });

    return results;
  } catch (err) {
    console.error("[globalSearchAction]", err);
    return [];
  }
}
