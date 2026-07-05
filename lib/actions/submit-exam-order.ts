"use server";

import { revalidatePath } from "next/cache";

import { inngest } from "@/lib/inngest/client";
import { generateExamOrderPdf } from "@/lib/exams/pdf";
import { createExamOrderWhatsAppLink } from "@/lib/exams/whatsapp";
import type { ExamOrderItem, ExamOrderWithSession } from "@/lib/exams/types";
import { getPdfStoragePath, uploadExamPdf } from "@/lib/storage/pdf";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  parseExamOrderPricesFromFormData,
  parseExamOrderQuantitiesFromFormData,
  validateExamOrderInput,
} from "@/lib/validation/exam-order";
import { consumeRateLimit, getRateLimitContext, getFriendlyRateLimitMessage } from "@/lib/security/rate-limiter";
import { RATE_LIMITS, ABUSE_SETTINGS } from "@/lib/rate-limit/config";
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
      pdfStoragePath: string | null;
      pdfGenerationFailed: boolean;
    };

export async function submitExamOrderAction(
  _prev: SubmitExamOrderState,
  formData: FormData,
): Promise<SubmitExamOrderState> {
  const ctx = await getRateLimitContext();
  const rateLimitResult = await consumeRateLimit(ctx, RATE_LIMITS.exams);
  if (!rateLimitResult.allowed) {
    await trackBlocked(ctx.ip, "/submit-exam-order", "exam_order_rate_limit_exceeded", {
      sessionId: ctx.sessionId,
      userAgent: ctx.userAgent,
      remainingWaitTime: rateLimitResult.retryAfter,
    });
    return { status: "error", error: getFriendlyRateLimitMessage(rateLimitResult.retryAfter) };
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
    .select("id, phone, items")
    .eq("session_id", validated.data.sessionId)
    .eq("school_name", validated.data.schoolName)
    .gte("created_at", duplicateTimeThreshold);

  let isDuplicate = false;
  if (duplicates && duplicates.length > 0) {
    for (const dup of duplicates) {
      if (dup.phone === validated.data.phone && compareOrderItems(dup.items, validated.data.items)) {
        isDuplicate = true;
        break;
      }
    }
  }

  if (isDuplicate) {
    await trackBlocked(ctx.ip, "/submit-exam-order", "duplicate_order_blocked", {
      school: validated.data.schoolName,
      sessionId: ctx.sessionId,
      userAgent: ctx.userAgent,
    });
    return { status: "error", error: "A duplicate order for this school was recently submitted. Please wait a few minutes." };
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

  // ─── Synchronous PDF Generation ──────────────────────────────────────────
  // Attempt to generate and upload the PDF immediately so the customer can
  // download it as soon as the order confirmation screen appears.
  // If this succeeds we do NOT emit an Inngest event — there is nothing left
  // for the background worker to do.
  // If it fails we record the error, emit the Inngest event for durable retry,
  // and still return a success response so the customer always gets their order
  // number regardless of PDF status.

  let pdfStoragePath: string | null = null;
  let pdfGenerationFailed = false;

  try {
    const pdfBytes = await generateExamOrderPdf(order);
    const storagePath = getPdfStoragePath(new Date(order.created_at));
    const uploadResult = await uploadExamPdf(admin, storagePath, pdfBytes);

    if (!uploadResult.ok) {
      throw new Error(uploadResult.error);
    }

    // ── Success path ────────────────────────────────────────────────────────
    await admin
      .from("exam_orders")
      .update({
        pdf_storage_path: storagePath,
        pdf_generated_at: new Date().toISOString(),
        pdf_generation_failed: false,
        pdf_generation_error: null,
      })
      .eq("id", order.id);

    pdfStoragePath = storagePath;

    // Create admin notification immediately — PDF is ready.
    // Wrapped in its own try/catch so a notification failure never blocks the response.
    try {
      await admin.from("notifications").insert({
        title: "New Exam Order",
        message: `A new exam order (${order.order_number}) was submitted by ${order.school_name}.`,
        type: "exam_order",
        metadata: {
          order_id: order.id,
          order_number: order.order_number,
          school_name: order.school_name,
          total_amount: order.total_amount,
          total_papers: order.total_papers,
        },
        is_read: false,
      });
    } catch (notifErr) {
      console.error("[submitExamOrderAction] failed to create notification", notifErr);
    }
  } catch (pdfErr: unknown) {
    // ── Failure path ────────────────────────────────────────────────────────
    const errMsg = pdfErr instanceof Error ? pdfErr.message : String(pdfErr);
    console.error("[submitExamOrderAction] synchronous PDF generation failed:", errMsg);

    pdfGenerationFailed = true;

    // Record failure state so the dashboard and download endpoint reflect it.
    try {
      await admin
        .from("exam_orders")
        .update({
          pdf_generation_failed: true,
          pdf_generation_error: errMsg,
          pdf_generation_attempts: (order.pdf_generation_attempts || 0) + 1,
          last_pdf_attempt_at: new Date().toISOString(),
        })
        .eq("id", order.id);
    } catch (dbErr) {
      console.error("[submitExamOrderAction] failed to record PDF failure in DB", dbErr);
    }

    // Emit Inngest event so the durable recovery worker picks it up and retries.
    // Do NOT create a notification here — the worker will create it after successful recovery.
    try {
      await inngest.send({
        name: "exam/order.created",
        data: { orderId: order.id },
      });
    } catch (inngestErr) {
      console.error("[submitExamOrderAction] failed to emit Inngest event", inngestErr);
    }
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
    pdfStoragePath,
    pdfGenerationFailed,
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
      items: ExamOrderItem[];
      downloadToken: string;
      whatsappUrl: string;
      pdfStoragePath: string | null;
      pdfGenerationFailed: boolean;
    };

function normalizePhone(p: string): string {
  const digits = p.replace(/\D/g, "");
  return digits.slice(-9);
}

export async function lookupOrderAction(
  _prev: LookupOrderState,
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
    items: examOrder.items as unknown as ExamOrderItem[],
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
      items: examOrder.items as unknown as import("@/lib/exams/types").ExamOrderItem[],
    }),
    pdfStoragePath: examOrder.pdf_storage_path,
    pdfGenerationFailed: examOrder.pdf_generation_failed || false,
  };
}

export async function checkPdfStatusAction(
  orderNumber: string,
  phone: string
): Promise<{ pdfStoragePath: string | null; pdfGenerationFailed: boolean }> {
  const admin = createServiceRoleClient();
  if (!admin) return { pdfStoragePath: null, pdfGenerationFailed: false };

  const { data, error } = await admin
    .from("exam_orders")
    .select("pdf_storage_path, pdf_generation_failed")
    .eq("order_number", orderNumber)
    .eq("phone", phone)
    .maybeSingle();

  if (error || !data) {
    return { pdfStoragePath: null, pdfGenerationFailed: false };
  }

  return {
    pdfStoragePath: data.pdf_storage_path,
    pdfGenerationFailed: data.pdf_generation_failed,
  };
}

function compareOrderItems(itemsA: unknown, itemsB: unknown): boolean {
  if (!Array.isArray(itemsA) || !Array.isArray(itemsB)) return false;
  if (itemsA.length !== itemsB.length) return false;

  const mapA = new Map<string, number>();
  for (const item of itemsA) {
    if (item && typeof item === "object" && "class_key" in item) {
      const classKey = (item as { class_key: unknown }).class_key;
      const quantity = (item as { quantity: unknown }).quantity;
      if (classKey) {
        mapA.set(String(classKey), Number(quantity || 0));
      }
    }
  }

  for (const item of itemsB) {
    if (!item || typeof item !== "object" || !("class_key" in item)) return false;
    const classKey = (item as { class_key: unknown }).class_key;
    const quantity = (item as { quantity: unknown }).quantity;
    if (!classKey) return false;
    const qtyA = mapA.get(String(classKey));
    if (qtyA === undefined || qtyA !== Number(quantity || 0)) {
      return false;
    }
  }

  return true;
}
