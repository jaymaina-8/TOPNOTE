import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { generateExamOrderPdf } from "@/lib/exams/pdf";
import { getPdfStoragePath, uploadExamPdf, createExamPdfSignedUrl, EXAM_ORDER_PDF_BUCKET } from "@/lib/storage/pdf";
import type { ExamOrderWithSession } from "@/lib/exams/types";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function renderFriendlyError(message: string) {
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Download Error | TopNote Publishers</title>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;800&display=swap" rel="stylesheet">
      <style>
        body {
          font-family: 'Outfit', sans-serif;
          background-color: #f9fafb;
          color: #111827;
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100vh;
          margin: 0;
          padding: 20px;
          box-sizing: border-box;
        }
        .card {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 24px;
          padding: 40px;
          max-width: 480px;
          width: 100%;
          text-align: center;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
        }
        .icon-container {
          background-color: #fee2e2;
          color: #dc2626;
          width: 64px;
          height: 64px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 24px;
        }
        h1 {
          font-size: 24px;
          font-weight: 800;
          margin: 0 0 16px;
          color: #111827;
        }
        p {
          font-size: 16px;
          color: #4b5563;
          line-height: 1.6;
          margin: 0 0 24px;
          white-space: pre-line;
        }
        .btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background-color: #111827;
          color: white;
          font-weight: 600;
          font-size: 14px;
          padding: 12px 24px;
          border-radius: 12px;
          text-decoration: none;
          transition: background-color 0.2s;
        }
        .btn:hover {
          background-color: #1f2937;
        }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="icon-container">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
        </div>
        <h1>Download Unavailable</h1>
        <p>${message}</p>
        <a href="/" class="btn">Back to Home</a>
      </div>
    </body>
    </html>
  `;
  return new NextResponse(html, {
    status: 404,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
    },
  });
}

async function checkFileExists(supabase: SupabaseClient<Database>, storagePath: string): Promise<boolean> {
  const parts = storagePath.split("/");
  if (parts.length < 2) return false;
  const filename = parts.pop()!;
  const folder = parts.join("/");
  const { data, error } = await supabase.storage.from(EXAM_ORDER_PDF_BUCKET).list(folder, {
    limit: 1,
    search: filename,
  });
  if (error || !data || data.length === 0) return false;
  return data[0].name === filename;
}

async function ensurePdfStoragePath(admin: SupabaseClient<Database>, order: ExamOrderWithSession): Promise<string | null> {
  if (order.pdf_storage_path) return order.pdf_storage_path;

  try {
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
  } catch (err) {
    console.error("[ensurePdfStoragePath] error generating older order pdf:", err);
    return null;
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token")?.trim();

  const genericErrorMsg = "Your PDF is currently unavailable.\n\nPlease contact TopNote Publishers if you need another copy.";

  if (!token || !UUID_REGEX.test(token)) {
    return renderFriendlyError(genericErrorMsg);
  }

  const admin = createServiceRoleClient();
  if (!admin) {
    return renderFriendlyError(genericErrorMsg);
  }

  const { data: order, error: orderError } = await admin
    .from("exam_orders")
    .select("*, exam_sessions(id, name, slug)")
    .eq("download_token", token)
    .maybeSingle();

  if (orderError || !order) {
    return renderFriendlyError(genericErrorMsg);
  }

  const examOrder = order as unknown as ExamOrderWithSession;
  let storagePath: string | null = null;

  if (examOrder.pdf_storage_path) {
    const exists = await checkFileExists(admin, examOrder.pdf_storage_path);
    if (exists) {
      storagePath = examOrder.pdf_storage_path;
    }
  }

  if (!storagePath) {
    if (examOrder.pdf_generation_failed) {
      return renderFriendlyError("We encountered an issue preparing your PDF. Please contact support or try again later.");
    }
    // With synchronous PDF generation, the PDF should already exist for almost
    // all orders by the time the customer clicks Download. The 30 s window only
    // protects against the instant race condition (order just created, Inngest
    // recovery worker hasn't retried yet).
    const ageSeconds = (Date.now() - new Date(examOrder.created_at).getTime()) / 1000;
    if (ageSeconds < 30) {
      return renderFriendlyError("Your PDF is being prepared. Please try again in a few moments.");
    }

    // Fallback: Generate and upload PDF on-the-fly for older orders that missed background queue
    storagePath = await ensurePdfStoragePath(admin, examOrder);
    if (!storagePath) {
      return renderFriendlyError(genericErrorMsg);
    }
  }

  const signedUrlResult = await createExamPdfSignedUrl(admin, storagePath);
  if (!signedUrlResult.ok) {
    return renderFriendlyError(genericErrorMsg);
  }

  return NextResponse.redirect(signedUrlResult.signedUrl, {
    status: 307,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
