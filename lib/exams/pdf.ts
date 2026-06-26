import "server-only";

import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { readFile } from "node:fs/promises";
import path from "node:path";

import type { ExamOrderItem, ExamOrderWithSession } from "@/lib/exams/types";
import { formatKesPrice } from "@/lib/format";
import { PHONE_DISPLAY } from "@/lib/whatsapp";

const BRAND_RED: [number, number, number] = [127, 7, 18];

function formatOrderDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-KE", {
      dateStyle: "long",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

async function loadLogoDataUrl(): Promise<string | null> {
  try {
    const logoPath = path.join(process.cwd(), "public", "logo-topnote.png");
    const buffer = await readFile(logoPath);
    return `data:image/png;base64,${buffer.toString("base64")}`;
  } catch {
    return null;
  }
}

function orderItemsWithQuantity(items: ExamOrderItem[]): ExamOrderItem[] {
  return items.filter((item) => item.quantity > 0);
}

export async function generateExamOrderPdf(order: ExamOrderWithSession): Promise<Uint8Array> {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 48;
  let y = margin;

  const logo = await loadLogoDataUrl();
  if (logo) {
    doc.addImage(logo, "PNG", margin, y, 56, 56);
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(...BRAND_RED);
  doc.text("TOPNOTE PUBLISHERS", margin + (logo ? 68 : 0), y + 18);

  doc.setFontSize(11);
  doc.setTextColor(60, 60, 60);
  doc.text("Examination Centre — Official Order Sheet", margin + (logo ? 68 : 0), y + 36);

  y += logo ? 72 : 48;

  doc.setDrawColor(...BRAND_RED);
  doc.setLineWidth(1.2);
  doc.line(margin, y, pageWidth - margin, y);
  y += 24;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(20, 20, 20);
  doc.text(`Order ${order.order_number}`, margin, y);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  doc.text(formatOrderDate(order.created_at), pageWidth - margin, y, { align: "right" });
  y += 22;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(20, 20, 20);
  doc.text("Exam Session", margin, y);
  doc.setFont("helvetica", "normal");
  doc.text(order.exam_sessions?.name ?? "—", margin + 92, y);
  y += 28;

  const infoRows: [string, string][] = [
    ["School", order.school_name],
    ["Contact Person", order.contact_person],
    ["Phone", order.phone],
    ["County", order.county],
    ["Delivery Location", order.delivery_location],
  ];

  if (order.additional_notes?.trim()) {
    infoRows.push(["Additional Notes", order.additional_notes.trim()]);
  }

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    theme: "plain",
    styles: { fontSize: 10, cellPadding: 4, textColor: [30, 30, 30] },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 120 },
      1: { cellWidth: "auto" },
    },
    body: infoRows,
  });

  y = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y + 80;
  y += 18;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Order Breakdown", margin, y);
  y += 8;

  const lineItems = orderItemsWithQuantity(order.items);

  autoTable(doc, {
    startY: y + 8,
    margin: { left: margin, right: margin },
    head: [["Class", "Unit Price", "Quantity", "Line Total"]],
    body: lineItems.map((item) => [
      item.class_label,
      formatKesPrice(item.unit_price),
      String(item.quantity),
      formatKesPrice(item.line_total),
    ]),
    headStyles: {
      fillColor: BRAND_RED,
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    styles: { fontSize: 10, cellPadding: 6 },
    alternateRowStyles: { fillColor: [248, 248, 248] },
  });

  y = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y + 120;
  y += 24;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(`Total Papers: ${order.total_papers}`, margin, y);
  y += 18;
  doc.setFontSize(14);
  doc.setTextColor(...BRAND_RED);
  doc.text(`Estimated Total: ${formatKesPrice(order.total_amount)}`, margin, y);

  y += 36;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(90, 90, 90);
  doc.text(
    "Thank you for choosing TopNote examinations. Our team will confirm your order shortly.",
    margin,
    y,
    { maxWidth: pageWidth - margin * 2 },
  );
  y += 28;
  doc.text(`Contact: ${PHONE_DISPLAY} | WhatsApp available`, margin, y);

  return new Uint8Array(doc.output("arraybuffer"));
}
