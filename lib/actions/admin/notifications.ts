"use server";

import { revalidatePath } from "next/cache";
import { guardDashboardVoidMutation } from "@/lib/auth/dashboard-access";
import { createServiceRoleClient } from "@/lib/supabase/admin";

export async function markNotificationAsReadAction(id: string): Promise<{ success: boolean; error?: string }> {
  const allowed = await guardDashboardVoidMutation();
  if (!allowed) return { success: false, error: "Unauthorized" };

  const admin = createServiceRoleClient();
  if (!admin) return { success: false, error: "Database client error" };

  const { error } = await admin
    .from("notifications")
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    console.error("[markNotificationAsReadAction] error:", error.message);
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard");
  return { success: true };
}

export async function markAllNotificationsAsReadAction(ids: string[]): Promise<{ success: boolean; error?: string }> {
  const allowed = await guardDashboardVoidMutation();
  if (!allowed) return { success: false, error: "Unauthorized" };

  if (ids.length === 0) return { success: true };

  const admin = createServiceRoleClient();
  if (!admin) return { success: false, error: "Database client error" };

  const { error } = await admin
    .from("notifications")
    .update({ is_read: true, read_at: new Date().toISOString() })
    .in("id", ids);

  if (error) {
    console.error("[markAllNotificationsAsReadAction] error:", error.message);
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteNotificationAction(id: string): Promise<{ success: boolean; error?: string }> {
  const allowed = await guardDashboardVoidMutation();
  if (!allowed) return { success: false, error: "Unauthorized" };

  const admin = createServiceRoleClient();
  if (!admin) return { success: false, error: "Database client error" };

  const { error } = await admin
    .from("notifications")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("[deleteNotificationAction] error:", error.message);
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteAllReadNotificationsAction(ids: string[]): Promise<{ success: boolean; error?: string }> {
  const allowed = await guardDashboardVoidMutation();
  if (!allowed) return { success: false, error: "Unauthorized" };

  if (ids.length === 0) return { success: true };

  const admin = createServiceRoleClient();
  if (!admin) return { success: false, error: "Database client error" };

  const { error } = await admin
    .from("notifications")
    .delete()
    .in("id", ids);

  if (error) {
    console.error("[deleteAllReadNotificationsAction] error:", error.message);
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard");
  return { success: true };
}

export async function createAdminNotificationAction({
  title,
  message,
  type,
}: {
  title: string;
  message: string;
  type: "system" | "warning";
}): Promise<{ success: boolean; error?: string }> {
  const allowed = await guardDashboardVoidMutation();
  if (!allowed) return { success: false, error: "Unauthorized" };

  const admin = createServiceRoleClient();
  if (!admin) return { success: false, error: "Database client error" };

  const { error } = await admin.from("notifications").insert({
    title,
    message,
    type,
    is_read: false,
  });

  if (error) {
    console.error("[createAdminNotificationAction] error:", error.message);
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard");
  return { success: true };
}
