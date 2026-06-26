import { createWhatsAppLink } from "@/lib/whatsapp";
import { formatKesPrice } from "@/lib/format";

type ExamOrderWhatsAppInput = {
  orderNumber: string;
  schoolName: string;
  sessionName: string;
  totalPapers: number;
  totalAmount: number;
};

export function examOrderWhatsAppMessage(input: ExamOrderWhatsAppInput): string {
  return [
    "Hello TopNote Publishers,",
    "",
    "Please find my exam order summary below:",
    "",
    `Order Number: ${input.orderNumber}`,
    `School Name: ${input.schoolName}`,
    `Exam Session: ${input.sessionName}`,
    `Total Students: ${input.totalPapers}`,
    `Total Amount: ${formatKesPrice(input.totalAmount)}`,
  ].join("\n");
}

export function createExamOrderWhatsAppLink(input: ExamOrderWhatsAppInput): string {
  return createWhatsAppLink(examOrderWhatsAppMessage(input));
}
