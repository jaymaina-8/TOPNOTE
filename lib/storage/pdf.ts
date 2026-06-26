import "server-only";

import { randomUUID } from "node:crypto";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/types";

export const EXAM_ORDER_PDF_BUCKET = "exam-order-pdfs";
export const PDF_URL_EXPIRY_SECONDS = 15 * 60;

export function getPdfStoragePath(date = new Date()): string {
  const year = String(date.getUTCFullYear());
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${year}/${month}/${randomUUID()}.pdf`;
}

export async function uploadExamPdf(
  supabase: SupabaseClient<Database>,
  storagePath: string,
  pdfBytes: Uint8Array,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { error } = await supabase.storage.from(EXAM_ORDER_PDF_BUCKET).upload(storagePath, pdfBytes, {
    contentType: "application/pdf",
    upsert: true,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true };
}

export async function createExamPdfSignedUrl(
  supabase: SupabaseClient<Database>,
  storagePath: string,
): Promise<{ ok: true; signedUrl: string } | { ok: false; error: string }> {
  const { data, error } = await supabase.storage
    .from(EXAM_ORDER_PDF_BUCKET)
    .createSignedUrl(storagePath, PDF_URL_EXPIRY_SECONDS);

  if (error || !data?.signedUrl) {
    return { ok: false, error: error?.message ?? "Could not create a temporary PDF URL." };
  }

  return { ok: true, signedUrl: data.signedUrl };
}

export async function deleteExamPdf(
  supabase: SupabaseClient<Database>,
  storagePath: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { error } = await supabase.storage.from(EXAM_ORDER_PDF_BUCKET).remove([storagePath]);
  if (error) {
    return { ok: false, error: error.message };
  }
  return { ok: true };
}
