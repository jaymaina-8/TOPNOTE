import { NextResponse } from "next/server";

import { examOrderPdfStoragePath, generateExamOrderPdf } from "@/lib/exams/pdf";
import { getExamOrderByIdAdmin, getExamOrderByIdPublic } from "@/lib/queries/exams";
import { getDashboardAuth } from "@/lib/auth/dashboard-access";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import type { ExamOrderWithSession } from "@/lib/exams/types";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

async function loadStoredPdf(order: ExamOrderWithSession): Promise<Uint8Array | null> {
  if (!order.pdf_storage_path) return null;

  const admin = createServiceRoleClient();
  if (!admin) return null;

  const { data, error } = await admin.storage.from("exam-order-pdfs").download(order.pdf_storage_path);
  if (error || !data) return null;

  return new Uint8Array(await data.arrayBuffer());
}

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const auth = await getDashboardAuth();
  const isAdmin = auth.ok;

  const order = isAdmin ? await getExamOrderByIdAdmin(id) : await getExamOrderByIdPublic(id);
  if (!order) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  let pdfBytes = await loadStoredPdf(order);
  if (!pdfBytes) {
    pdfBytes = await generateExamOrderPdf(order);

    const admin = createServiceRoleClient();
    if (admin) {
      const storagePath = order.pdf_storage_path ?? examOrderPdfStoragePath(order.order_number);
      await admin.storage.from("exam-order-pdfs").upload(storagePath, pdfBytes, {
        contentType: "application/pdf",
        upsert: true,
      });
      if (!order.pdf_storage_path) {
        await admin.from("exam_orders").update({ pdf_storage_path: storagePath }).eq("id", order.id);
      }
    }
  }

  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${order.order_number}.pdf"`,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
