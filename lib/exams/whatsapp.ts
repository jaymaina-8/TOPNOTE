import { createWhatsAppLink } from "@/lib/whatsapp";
import { formatKesPrice } from "@/lib/format";
import type { ExamOrderItem } from "@/lib/exams/types";

export type ExamOrderWhatsAppInput = {
  orderNumber: string;
  schoolName: string;
  sessionName: string;
  contactPerson: string;
  phone: string;
  county: string;
  deliveryLocation: string;
  totalPapers: number;
  totalAmount: number;
  additionalNotes: string | null;
  items: ExamOrderItem[];
};

export function examOrderWhatsAppMessage(input: ExamOrderWhatsAppInput): string {
  const parts: string[] = [];

  parts.push("Hello TopNote Publishers,");
  parts.push("");
  parts.push("I would like to place an examination order.");
  parts.push("");
  parts.push("*ORDER DETAILS*");
  parts.push("");
  parts.push("Order Number:");
  parts.push(input.orderNumber);
  parts.push("");
  parts.push("Exam Session:");
  parts.push(input.sessionName);
  parts.push("");
  parts.push("School Name:");
  parts.push(input.schoolName);
  parts.push("");
  parts.push("Contact Person:");
  parts.push(input.contactPerson);
  parts.push("");
  parts.push("Phone Number:");
  parts.push(input.phone);
  parts.push("");
  parts.push("County:");
  parts.push(input.county);
  parts.push("");
  parts.push("Delivery Location:");
  parts.push(input.deliveryLocation);
  parts.push("");
  parts.push("Total Students:");
  parts.push(String(input.totalPapers));
  parts.push("");
  parts.push("Total Amount:");
  // Ensure we use Ksh instead of KES as requested
  parts.push(formatKesPrice(input.totalAmount).replace("KES", "Ksh"));
  parts.push("");
  parts.push("---");
  parts.push("");
  parts.push("*EXAM BREAKDOWN*");
  parts.push("");

  for (const item of input.items) {
    if (item.quantity > 0) {
      parts.push(`${item.class_label} — ${item.quantity} Students`);
      parts.push("");
    }
  }

  parts.push("---");
  parts.push("");
  parts.push("Additional Instructions:");
  parts.push("");
  parts.push(input.additionalNotes && input.additionalNotes.trim() !== "" ? input.additionalNotes : "None");
  parts.push("");
  parts.push("---");
  parts.push("");
  parts.push("PAYMENT");
  parts.push("");
  parts.push("I will complete payment using the Paybill details provided on the website.");
  parts.push("");
  parts.push("---");
  parts.push("");
  parts.push("The generated PDF has been downloaded and will be attached to this WhatsApp message.");
  parts.push("");
  parts.push("Thank you.");

  return parts.join("\n");
}

export function createExamOrderWhatsAppLink(input: ExamOrderWhatsAppInput): string {
  return createWhatsAppLink(examOrderWhatsAppMessage(input));
}
