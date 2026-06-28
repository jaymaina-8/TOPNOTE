"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { generateExamOrderPdf } from "@/lib/exams/pdf";
import { createExamOrderWhatsAppLink } from "@/lib/exams/whatsapp";
import type { ExamOrderWithSession } from "@/lib/exams/types";
import { getPdfStoragePath, uploadExamPdf, createExamPdfSignedUrl } from "@/lib/storage/pdf";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  parseExamOrderPricesFromFormData,
  parseExamOrderQuantitiesFromFormData,
  validateExamOrderInput,
} from "@/lib/validation/exam-order";
import { consumeRateLimit } from "@/lib/security/rate-limiter";
import { RATE_LIMIT_POLICIES, ABUSE_SETTINGS } from "@/lib/security/config";
import { trackBlocked } from "@/lib/security/monitoring";

export type SubmitExamOrderState =
  | { status: "idle" }
  | { status: "error"; error: string }
  | {
      status: "success";
      orderId: string;
      orderNumber: string;
      downloadToken: string;
      whatsappUrl: string;
      sessionName: string;
      schoolName: string;
      totalAmount: number;
      totalPapers: number;
    };

export async function submitExamOrderAction(
  _prev: SubmitExamOrderState,
  formData: FormData,
): Promise<SubmitExamOrderState> {
  const reqHeaders = await headers();
  const rawIp = reqHeaders.get("x-forwarded-for")?.split(",")[0] ||
                reqHeaders.get("x-real-ip") ||
                "127.0.0.1";
  const ip = rawIp.trim();

  const rateLimitResult = await consumeRateLimit(ip, RATE_LIMIT_POLICIES.examOrderSubmit);
  if (!rateLimitResult.allowed) {
    await trackBlocked(ip, "/submit-exam-order", "exam_order_rate_limit_exceeded");
    return { status: "error", error: `You are submitting orders too quickly. Please try again in ${rateLimitResult.retryAfter} seconds.` };
  }

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

  const duplicateTimeThreshold = new Date(Date.now() - ABUSE_SETTINGS.duplicateOrderWindowSeconds * 1000).toISOString();
  const { data: duplicates } = await admin
    .from("exam_orders")
    .select("id")
    .eq("session_id", validated.data.sessionId)
    .eq("school_name", validated.data.schoolName)
    .gte("created_at", duplicateTimeThreshold)
    .limit(1);

  if (duplicates && duplicates.length > 0) {
    await trackBlocked(ip, "/submit-exam-order", "duplicate_order_blocked", { school: validated.data.schoolName });
    return { status: "error", error: "An order for this school was recently submitted. Please wait a few minutes." };
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

  const order = inserted as unknown as ExamOrderWithSession;

  // Create notification record for the dashboard
  const { error: notificationError } = await admin
    .from("notifications")
    .insert({
      title: "New Exam Order",
      message: `A new exam order (${orderNumber}) was submitted by ${validated.data.schoolName}.`,
      type: "exam_order",
      metadata: {
        order_id: order.id,
        order_number: orderNumber,
        school_name: validated.data.schoolName,
        total_amount: validated.data.totalAmount,
        total_papers: validated.data.totalPapers,
      },
      is_read: false,
    });

  if (notificationError) {
    console.error("[submitExamOrderAction] notification insert error", notificationError.message);
  }

  const pdfBytes = await generateExamOrderPdf(order);
  const storagePath = getPdfStoragePath();

  const uploadResult = await uploadExamPdf(admin, storagePath, pdfBytes);
  if (!uploadResult.ok) {
    console.error("[submitExamOrderAction] pdf upload", uploadResult.error);
  } else {
    await admin.from("exam_orders").update({ pdf_storage_path: storagePath }).eq("id", order.id);
  }

  revalidatePath("/dashboard/orders");

  return {
    status: "success",
    orderId: order.id,
    orderNumber,
    downloadToken: order.download_token,
    whatsappUrl: createExamOrderWhatsAppLink({
      orderNumber,
      schoolName: validated.data.schoolName,
      sessionName: activeSession.name,
      contactPerson: validated.data.contactPerson,
      phone: validated.data.phone,
      county: validated.data.county,
      deliveryLocation: validated.data.deliveryLocation,
      totalPapers: validated.data.totalPapers,
      totalAmount: validated.data.totalAmount,
      additionalNotes: validated.data.additionalNotes,
      items: validated.data.items,
    }),
    sessionName: activeSession.name,
    schoolName: validated.data.schoolName,
    totalAmount: validated.data.totalAmount,
    totalPapers: validated.data.totalPapers,
  };
}

export async function getExamOrderByTokenAction(token: string): Promise<{
  whatsappUrl: string;
} | null> {
  const admin = createServiceRoleClient();
  if (!admin) return null;

  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!UUID_REGEX.test(token)) return null;

  const { data: order, error } = await admin
    .from("exam_orders")
    .select("*, exam_sessions(id, name, slug)")
    .eq("download_token", token)
    .maybeSingle();

  if (error || !order) return null;

  const examOrder = order as unknown as ExamOrderWithSession;

  return {
    whatsappUrl: createExamOrderWhatsAppLink({
      orderNumber: examOrder.order_number,
      schoolName: examOrder.school_name,
      sessionName: examOrder.exam_sessions?.name ?? "",
      contactPerson: examOrder.contact_person,
      phone: examOrder.phone,
      county: examOrder.county,
      deliveryLocation: examOrder.delivery_location,
      totalPapers: examOrder.total_papers,
      totalAmount: Number(examOrder.total_amount),
      additionalNotes: examOrder.additional_notes,
      items: examOrder.items,
    }),
  };
}

export type LookupOrderState =
  | { status: "idle" }
  | { status: "error"; error: string }
  | {
      status: "success";
      orderNumber: string;
      schoolName: string;
      sessionName: string;
      contactPerson: string;
      phone: string;
      county: string;
      deliveryLocation: string;
      totalPapers: number;
      totalAmount: number;
      statusLabel: string;
      items: any[];
      downloadToken: string;
      whatsappUrl: string;
    };

function normalizePhone(p: string): string {
  const digits = p.replace(/\D/g, "");
  return digits.slice(-9);
}

export async function lookupOrderAction(
  _prev: any,
  formData: FormData,
): Promise<LookupOrderState> {
  const orderNumber = formData.get("order_number")?.toString().trim();
  const phone = formData.get("phone")?.toString().trim();

  const genericError = "Order not found or details do not match.";

  if (!orderNumber || !phone) {
    return { status: "error", error: "Please enter both order number and phone number." };
  }

  const admin = createServiceRoleClient();
  if (!admin) {
    return { status: "error", error: "Order service is temporarily unavailable." };
  }

  const { data: order, error } = await admin
    .from("exam_orders")
    .select("*, exam_sessions(id, name, slug)")
    .eq("order_number", orderNumber)
    .maybeSingle();

  if (error || !order) {
    return { status: "error", error: genericError };
  }

  const examOrder = order as unknown as ExamOrderWithSession;

  if (normalizePhone(examOrder.phone) !== normalizePhone(phone)) {
    return { status: "error", error: genericError };
  }

  let downloadToken = examOrder.download_token;
  if (!downloadToken) {
    const generatedToken = crypto.randomUUID();
    const { data: updated, error: updateError } = await admin
      .from("exam_orders")
      .update({ download_token: generatedToken })
      .eq("id", examOrder.id)
      .select("download_token")
      .single();

    if (!updateError && updated) {
      downloadToken = updated.download_token;
    } else {
      return { status: "error", error: "Could not retrieve order download access." };
    }
  }

  const sessionName = examOrder.exam_sessions?.name ?? "";

  return {
    status: "success",
    orderNumber: examOrder.order_number,
    schoolName: examOrder.school_name,
    sessionName,
    contactPerson: examOrder.contact_person,
    phone: examOrder.phone,
    county: examOrder.county,
    deliveryLocation: examOrder.delivery_location,
    totalPapers: examOrder.total_papers,
    totalAmount: Number(examOrder.total_amount),
    statusLabel: examOrder.status,
    items: examOrder.items as any[],
    downloadToken,
    whatsappUrl: createExamOrderWhatsAppLink({
      orderNumber: examOrder.order_number,
      schoolName: examOrder.school_name,
      sessionName,
      contactPerson: examOrder.contact_person,
      phone: examOrder.phone,
      county: examOrder.county,
      deliveryLocation: examOrder.delivery_location,
      totalPapers: examOrder.total_papers,
      totalAmount: Number(examOrder.total_amount),
      additionalNotes: examOrder.additional_notes,
      items: examOrder.items as any[],
    }),
  };
}
