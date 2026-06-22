"use server";

import { revalidatePath } from "next/cache";

import { examOrderPdfStoragePath, generateExamOrderPdf } from "@/lib/exams/pdf";
import { createExamOrderWhatsAppLink } from "@/lib/exams/whatsapp";
import type { ExamOrderWithSession } from "@/lib/exams/types";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  parseExamOrderPricesFromFormData,
  parseExamOrderQuantitiesFromFormData,
  validateExamOrderInput,
} from "@/lib/validation/exam-order";

export type SubmitExamOrderState =
  | { status: "idle" }
  | { status: "error"; error: string }
  | {
      status: "success";
      orderId: string;
      orderNumber: string;
      pdfUrl: string;
      whatsappUrl: string;
      totalAmount: number;
      totalPapers: number;
    };

export async function submitExamOrderAction(
  _prev: SubmitExamOrderState,
  formData: FormData,
): Promise<SubmitExamOrderState> {
  const validated = validateExamOrderInput({
    sessionId: formData.get("session_id")?.toString() ?? "",
    schoolName: formData.get("school_name")?.toString() ?? "",
    contactPerson: formData.get("contact_person")?.toString() ?? "",
    phone: formData.get("phone")?.toString() ?? "",
    county: formData.get("county")?.toString() ?? "",
    deliveryLocation: formData.get("delivery_location")?.toString() ?? "",
    additionalNotes: formData.get("additional_notes")?.toString() ?? "",
    quantities: parseExamOrderQuantitiesFromFormData(formData),
    prices: parseExamOrderPricesFromFormData(formData),
  });

  if (!validated.ok) {
    return { status: "error", error: validated.error };
  }

  const supabase = await createClient();
  if (!supabase) {
    return { status: "error", error: "Ordering is temporarily unavailable. Please try again later." };
  }

  const { data: activeSession, error: sessionError } = await supabase
    .from("exam_sessions")
    .select("id, name, status")
    .eq("id", validated.data.sessionId)
    .eq("status", "active")
    .maybeSingle();

  if (sessionError || !activeSession) {
    return { status: "error", error: "The selected exam session is no longer active. Refresh and try again." };
  }

  const admin = createServiceRoleClient();
  if (!admin) {
    return { status: "error", error: "Order processing is not configured on this server." };
  }

  const { data: orderNumberData, error: orderNumberError } = await admin.rpc("generate_exam_order_number");
  if (orderNumberError || !orderNumberData) {
    console.error("[submitExamOrderAction] order number", orderNumberError?.message);
    return { status: "error", error: "Could not generate an order number. Please try again." };
  }

  const orderNumber = String(orderNumberData);
  const { data: inserted, error: insertError } = await admin
    .from("exam_orders")
    .insert({
      order_number: orderNumber,
      session_id: validated.data.sessionId,
      school_name: validated.data.schoolName,
      contact_person: validated.data.contactPerson,
      phone: validated.data.phone,
      county: validated.data.county,
      delivery_location: validated.data.deliveryLocation,
      additional_notes: validated.data.additionalNotes,
      items: validated.data.items,
      total_papers: validated.data.totalPapers,
      total_amount: validated.data.totalAmount,
      status: "pending",
    })
    .select("*, exam_sessions(id, name, slug)")
    .single();

  if (insertError || !inserted) {
    console.error("[submitExamOrderAction] insert", insertError?.message);
    return { status: "error", error: "Could not save your order. Please try again." };
  }

  const order = inserted as ExamOrderWithSession;
  const pdfBytes = await generateExamOrderPdf(order);
  const storagePath = examOrderPdfStoragePath(orderNumber);

  const { error: uploadError } = await admin.storage.from("exam-order-pdfs").upload(storagePath, pdfBytes, {
    contentType: "application/pdf",
    upsert: true,
  });

  if (uploadError) {
    console.error("[submitExamOrderAction] pdf upload", uploadError.message);
  } else {
    await admin.from("exam_orders").update({ pdf_storage_path: storagePath }).eq("id", order.id);
  }

  const { data: signedUrlData } = await admin.storage
    .from("exam-order-pdfs")
    .createSignedUrl(storagePath, 60 * 60 * 24 * 7);

  revalidatePath("/dashboard/orders");

  return {
    status: "success",
    orderId: order.id,
    orderNumber,
    pdfUrl: signedUrlData?.signedUrl ?? `/api/exam-orders/${order.id}/pdf`,
    whatsappUrl: createExamOrderWhatsAppLink({
      orderNumber,
      schoolName: validated.data.schoolName,
      sessionName: activeSession.name,
      totalAmount: validated.data.totalAmount,
    }),
    totalAmount: validated.data.totalAmount,
    totalPapers: validated.data.totalPapers,
  };
}
