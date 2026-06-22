import { createWhatsAppLink } from "@/lib/whatsapp";
import { formatKesPrice } from "@/lib/format";

type ExamOrderWhatsAppInput = {
  orderNumber: string;
  schoolName: string;
  sessionName: string;
  totalAmount: number;
};

export function examOrderWhatsAppMessage(input: ExamOrderWhatsAppInput): string {
  return [
    "Hello TopNote Publishers,",
    "",
    "I would like to place an exam order.",
    "",
    `Order Number: ${input.orderNumber}`,
    `School: ${input.schoolName}`,
    `Exam Session: ${input.sessionName}`,
    `Total: ${formatKesPrice(input.totalAmount)}`,
    "",
    "Please find my order attached.",
  ].join("\n");
}

export function createExamOrderWhatsAppLink(input: ExamOrderWhatsAppInput): string {
  return createWhatsAppLink(examOrderWhatsAppMessage(input));
}
