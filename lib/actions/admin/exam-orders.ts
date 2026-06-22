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
