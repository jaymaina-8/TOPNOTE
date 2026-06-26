import { NextResponse } from "next/server";

import { generateExamOrderPdf } from "@/lib/exams/pdf";
import { getExamOrderByIdAdmin } from "@/lib/queries/exams";
import { createExamPdfSignedUrl, getPdfStoragePath, uploadExamPdf } from "@/lib/storage/pdf";
import { getDashboardAuth } from "@/lib/auth/dashboard-access";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import type { ExamOrderWithSession } from "@/lib/exams/types";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ id: string }>;
};

async function ensurePdfStoragePath(order: ExamOrderWithSession): Promise<string | null> {
  if (order.pdf_storage_path) return order.pdf_storage_path;

  const admin = createServiceRoleClient();
  if (!admin) return null;

  const pdfBytes = await generateExamOrderPdf(order);
  const storagePath = getPdfStoragePath(new Date(order.created_at));
  const uploadResult = await uploadExamPdf(admin, storagePath, pdfBytes);
  if (!uploadResult.ok) return null;

  const { error: updateError } = await admin
    .from("exam_orders")
    .update({ pdf_storage_path: storagePath })
    .eq("id", order.id);

  if (updateError) return null;

  return storagePath;
}

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const auth = await getDashboardAuth();
  if (!auth.ok) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const order = await getExamOrderByIdAdmin(id);
  if (!order) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  const storagePath = await ensurePdfStoragePath(order);
  if (!storagePath) {
    return NextResponse.json({ error: "Could not prepare PDF download." }, { status: 500 });
  }

  const admin = createServiceRoleClient();
  if (!admin) {
    return NextResponse.json({ error: "PDF service is unavailable." }, { status: 500 });
  }

  const signedUrlResult = await createExamPdfSignedUrl(admin, storagePath);
  if (!signedUrlResult.ok) {
    return NextResponse.json({ error: "Could not create download link." }, { status: 500 });
  }

  return NextResponse.redirect(signedUrlResult.signedUrl, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
