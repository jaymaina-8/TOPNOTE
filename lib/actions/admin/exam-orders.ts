"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { parseRequiredString, UUID_RE } from "@/lib/admin/validation";
import { guardDashboardVoidMutation } from "@/lib/auth/dashboard-access";
import type { ExamOrderStatus } from "@/lib/exams/types";
import { createServiceRoleClient } from "@/lib/supabase/admin";

const VALID_STATUSES: ExamOrderStatus[] = [
  "pending",
  "contacted",
  "confirmed",
  "processing",
  "delivered",
  "cancelled",
];

export async function updateExamOrderStatusAction(formData: FormData): Promise<void> {
  const allowed = await guardDashboardVoidMutation();
  if (!allowed) return;

  const admin = createServiceRoleClient();
  if (!admin) {
    redirect("/dashboard/orders?error=status");
  }

  const orderId = parseRequiredString(formData, "order_id");
  const nextStatus = parseRequiredString(formData, "next_status") as ExamOrderStatus | null;

  if (!orderId || !UUID_RE.test(orderId)) return;
  if (!nextStatus || !VALID_STATUSES.includes(nextStatus)) return;

  const { error } = await admin.from("exam_orders").update({ status: nextStatus }).eq("id", orderId);
  if (error) {
    console.error("[updateExamOrderStatusAction]", error.message);
    redirect("/dashboard/orders?error=status");
  }

  revalidatePath("/dashboard/orders");
  redirect("/dashboard/orders");
}

export async function deleteExamOrderAction(formData: FormData): Promise<void> {
  const allowed = await guardDashboardVoidMutation();
  if (!allowed) return;

  const admin = createServiceRoleClient();
  if (!admin) {
    redirect("/dashboard/orders?error=delete");
  }

  const orderId = parseRequiredString(formData, "order_id");
  if (!orderId || !UUID_RE.test(orderId)) return;

  const { data: order } = await admin
    .from("exam_orders")
    .select("pdf_storage_path")
    .eq("id", orderId)
    .maybeSingle();

  if (order?.pdf_storage_path) {
    await admin.storage.from("exam-order-pdfs").remove([order.pdf_storage_path]);
  }

  const { error } = await admin.from("exam_orders").delete().eq("id", orderId);
  if (error) {
    console.error("[deleteExamOrderAction]", error.message);
    redirect("/dashboard/orders?error=delete");
  }

  revalidatePath("/dashboard/orders");
  redirect("/dashboard/orders");
}

export async function bulkUpdateExamOrderStatusAction(orderIds: string[], nextStatus: ExamOrderStatus): Promise<{ success: boolean; error?: string }> {
  const allowed = await guardDashboardVoidMutation();
  if (!allowed) return { success: false, error: "Unauthorized" };

  const admin = createServiceRoleClient();
  if (!admin) return { success: false, error: "Service role not configured" };

  if (!orderIds.length) return { success: false, error: "No orders selected" };
  if (!VALID_STATUSES.includes(nextStatus)) return { success: false, error: "Invalid status" };

  const { error } = await admin
    .from("exam_orders")
    .update({ status: nextStatus })
    .in("id", orderIds);

  if (error) {
    console.error("[bulkUpdateExamOrderStatusAction]", error.message);
    return { success: false, error: "Could not update orders status" };
  }

  revalidatePath("/dashboard/orders");
  return { success: true };
}

export async function bulkDeleteExamOrdersAction(orderIds: string[]): Promise<{ success: boolean; error?: string }> {
  const allowed = await guardDashboardVoidMutation();
  if (!allowed) return { success: false, error: "Unauthorized" };

  const admin = createServiceRoleClient();
  if (!admin) return { success: false, error: "Service role not configured" };

  if (!orderIds.length) return { success: false, error: "No orders selected" };

  // Fetch all storage paths first to remove PDFs
  const { data: orders } = await admin
    .from("exam_orders")
    .select("pdf_storage_path")
    .in("id", orderIds);

  const pdfPaths = (orders ?? [])
    .map((o) => o.pdf_storage_path)
    .filter((path): path is string => !!path);

  if (pdfPaths.length) {
    await admin.storage.from("exam-order-pdfs").remove(pdfPaths);
  }

  const { error } = await admin
    .from("exam_orders")
    .delete()
    .in("id", orderIds);

  if (error) {
    console.error("[bulkDeleteExamOrdersAction]", error.message);
    return { success: false, error: "Could not delete orders" };
  }

  revalidatePath("/dashboard/orders");
  return { success: true };
}

