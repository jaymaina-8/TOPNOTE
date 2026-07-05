import { inngest } from "./client";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { generateExamOrderPdf } from "@/lib/exams/pdf";
import { getPdfStoragePath, uploadExamPdf } from "@/lib/storage/pdf";
import type { ExamOrderWithSession } from "@/lib/exams/types";

export const generateExamOrderPdfFunction = inngest.createFunction(
  {
    id: "generate-exam-order-pdf",
    name: "Generate Exam Order PDF",
    // Recovery worker: only fires when submitExamOrderAction emits this event
    // after a synchronous PDF generation failure.
    triggers: [{ event: "exam/order.created" }],
    // Automatic retries policy (maximum 3 attempts)
    retries: 3,
  },
  async ({ event, step }) => {
    const { orderId } = event.data;

    // 1. Load order from the database
    const order = await step.run("load-order", async () => {
      const admin = createServiceRoleClient();
      if (!admin) throw new Error("Database admin client is unconfigured");

      const { data, error } = await admin
        .from("exam_orders")
        .select("*, exam_sessions(id, name, slug)")
        .eq("id", orderId)
        .maybeSingle();

      if (error) {
        throw new Error(`DB load error: ${error.message}`);
      }
      return data;
    });

    if (!order) {
      console.warn(`[Inngest] Order ${orderId} does not exist. Exiting.`);
      return { success: false, reason: "order_not_found" };
    }

    // 2. Idempotency check — exit immediately if the synchronous path already
    //    succeeded (or a previous Inngest attempt completed). This prevents
    //    duplicate uploads and duplicate notifications.
    if (order.pdf_storage_path) {
      console.log(`[Inngest] PDF already exists for order ${order.order_number}. Exiting.`);
      return { success: true, reason: "already_exists" };
    }

    // 3. Generate PDF and upload.
    //    Re-throw on failure so Inngest applies automatic backoff + retry.
    let storagePath: string;
    try {
      storagePath = await step.run("generate-and-upload-pdf", async () => {
        const admin = createServiceRoleClient();
        if (!admin) throw new Error("Database admin client is unconfigured");

        const typedOrder = order as unknown as ExamOrderWithSession;
        const pdfBytes = await generateExamOrderPdf(typedOrder);
        const path = getPdfStoragePath(new Date(order.created_at));

        const uploadResult = await uploadExamPdf(admin, path, pdfBytes);
        if (!uploadResult.ok) {
          throw new Error(uploadResult.error);
        }
        return path;
      });
    } catch (pdfErr: unknown) {
      const msg = pdfErr instanceof Error ? pdfErr.message : String(pdfErr);

      // Record error state in database so the dashboard reflects it.
      await step.run("record-pdf-failure", async () => {
        const admin = createServiceRoleClient();
        if (!admin) return;

        await admin
          .from("exam_orders")
          .update({
            pdf_generation_failed: true,
            pdf_generation_error: msg,
            pdf_generation_attempts: (order.pdf_generation_attempts || 0) + 1,
            last_pdf_attempt_at: new Date().toISOString(),
          })
          .eq("id", orderId);
      });

      console.error(`[Inngest] PDF generation failed: ${msg}`);
      throw pdfErr; // Re-throw → Inngest retries with exponential backoff
    }

    // 4. Update database with success state
    await step.run("record-pdf-success", async () => {
      const admin = createServiceRoleClient();
      if (!admin) throw new Error("Database admin client is unconfigured");

      const { error } = await admin
        .from("exam_orders")
        .update({
          pdf_storage_path: storagePath,
          pdf_generated_at: new Date().toISOString(),
          pdf_generation_failed: false,
          pdf_generation_error: null,
        })
        .eq("id", orderId);

      if (error) {
        throw new Error(`Failed to record PDF success: ${error.message}`);
      }
    });

    // 5. Create admin notification — only if one has not already been created
    //    for this order (idempotency guard against duplicate notifications if
    //    the synchronous path succeeded and already inserted one).
    await step.run("create-notification", async () => {
      const admin = createServiceRoleClient();
      if (!admin) throw new Error("Database admin client is unconfigured");

      // Check for an existing notification for this order before inserting.
      const { data: existing } = await admin
        .from("notifications")
        .select("id")
        .eq("type", "exam_order")
        .filter("metadata->>order_id", "eq", orderId)
        .maybeSingle();

      if (existing) {
        console.log(`[Inngest] Notification already exists for order ${order.order_number}. Skipping.`);
        return;
      }

      const { error } = await admin.from("notifications").insert({
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

      if (error) {
        throw new Error(`Failed to create admin notification: ${error.message}`);
      }
    });

    console.log(`[Inngest] Successfully recovered PDF for order ${order.order_number}`);
    return { success: true, orderNumber: order.order_number };
  }
);
