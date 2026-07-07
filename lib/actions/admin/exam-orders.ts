"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { parseRequiredString, UUID_RE } from "@/lib/admin/validation";
import { guardDashboardVoidMutation, getDashboardAuth } from "@/lib/auth/dashboard-access";
import type { ExamOrderStatus } from "@/lib/exams/types";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { generateExamOrderPdf } from "@/lib/exams/pdf";
import { getPdfStoragePath, uploadExamPdf } from "@/lib/storage/pdf";
import { inngest } from "@/lib/inngest/client";
import type { ExamOrderWithSession } from "@/lib/exams/types";

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

export async function updateExamOrderStatusSingleAction(orderId: string, nextStatus: ExamOrderStatus): Promise<{ success: boolean; error?: string }> {
  const allowed = await guardDashboardVoidMutation();
  if (!allowed) return { success: false, error: "Unauthorized" };

  const admin = createServiceRoleClient();
  if (!admin) return { success: false, error: "Service role not configured" };

  if (!VALID_STATUSES.includes(nextStatus)) return { success: false, error: "Invalid status" };

  // Fetch current status for history
  const { data: order, error: fetchError } = await admin
    .from("exam_orders")
    .select("status")
    .eq("id", orderId)
    .maybeSingle();

  if (fetchError || !order) {
    return { success: false, error: "Order not found" };
  }

  const { error: updateError } = await admin
    .from("exam_orders")
    .update({ status: nextStatus })
    .eq("id", orderId);

  if (updateError) {
    console.error("[updateExamOrderStatusSingleAction]", updateError.message);
    return { success: false, error: "Could not update status" };
  }

  // Record history
  const auth = await getDashboardAuth();
  const adminEmail = auth.ok ? auth.email : "system";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: historyError } = await (admin as any)
    .from("exam_order_status_history")
    .insert({
      order_id: orderId,
      previous_status: order.status,
      new_status: nextStatus,
      changed_by: adminEmail || "system",
    });

  if (historyError) {
    console.error("[updateExamOrderStatusSingleAction] history record failed:", historyError.message);
  }

  revalidatePath("/dashboard/orders");
  return { success: true };
}

export async function duplicateExamOrderAction(orderId: string): Promise<{ success: boolean; error?: string }> {
  const allowed = await guardDashboardVoidMutation();
  if (!allowed) return { success: false, error: "Unauthorized" };

  const admin = createServiceRoleClient();
  if (!admin) return { success: false, error: "Service role not configured" };

  // Fetch source order
  const { data: sourceOrder, error: fetchError } = await admin
    .from("exam_orders")
    .select("*, exam_sessions(id, name, slug)")
    .eq("id", orderId)
    .maybeSingle();

  if (fetchError || !sourceOrder) {
    return { success: false, error: "Source order not found" };
  }

  // Generate new order number
  const { data: orderNumberData, error: orderNumberError } = await admin.rpc("generate_exam_order_number");
  if (orderNumberError || !orderNumberData) {
    console.error("[duplicateExamOrderAction] order number error:", orderNumberError?.message);
    return { success: false, error: "Could not generate order number" };
  }
  const orderNumber = String(orderNumberData);

  // Insert cloned order
  const { data: inserted, error: insertError } = await admin
    .from("exam_orders")
    .insert({
      order_number: orderNumber,
      session_id: sourceOrder.session_id,
      school_name: sourceOrder.school_name,
      contact_person: sourceOrder.contact_person,
      phone: sourceOrder.phone,
      county: sourceOrder.county,
      delivery_location: sourceOrder.delivery_location,
      additional_notes: sourceOrder.additional_notes,
      items: sourceOrder.items,
      total_papers: sourceOrder.total_papers,
      total_amount: sourceOrder.total_amount,
      status: "pending",
    })
    .select("*, exam_sessions(id, name, slug)")
    .single();

  if (insertError || !inserted) {
    console.error("[duplicateExamOrderAction] insert cloned error:", insertError?.message);
    return { success: false, error: "Could not duplicate order in database" };
  }

  const newOrder = inserted as unknown as ExamOrderWithSession;

  // Record initial history
  const auth = await getDashboardAuth();
  const adminEmail = auth.ok ? auth.email : "system";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (admin as any).from("exam_order_status_history").insert({
    order_id: newOrder.id,
    previous_status: null,
    new_status: "pending",
    changed_by: adminEmail || "system",
  });

  // Compile PDF synchronously
  try {
    const pdfBytes = await generateExamOrderPdf(newOrder);
    const storagePath = getPdfStoragePath(new Date(newOrder.created_at));
    const uploadResult = await uploadExamPdf(admin, storagePath, pdfBytes);

    if (uploadResult.ok) {
      await admin
        .from("exam_orders")
        .update({
          pdf_storage_path: storagePath,
          pdf_generated_at: new Date().toISOString(),
          pdf_generation_failed: false,
          pdf_generation_error: null,
        })
        .eq("id", newOrder.id);
    } else {
      throw new Error(uploadResult.error);
    }
  } catch (pdfErr) {
    const errMsg = pdfErr instanceof Error ? pdfErr.message : String(pdfErr);
    console.error("[duplicateExamOrderAction] sync PDF failed, queuing:", errMsg);
    
    await admin
      .from("exam_orders")
      .update({
        pdf_generation_failed: true,
        pdf_generation_error: errMsg,
        pdf_generation_attempts: 1,
        last_pdf_attempt_at: new Date().toISOString(),
      })
      .eq("id", newOrder.id);

    try {
      await inngest.send({
        name: "exam/order.created",
        data: { orderId: newOrder.id },
      });
    } catch (innErr) {
      console.error("[duplicateExamOrderAction] inngest trigger failed:", innErr);
    }
  }

  revalidatePath("/dashboard/orders");
  return { success: true };
}

