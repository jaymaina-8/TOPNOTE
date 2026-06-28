export type ExamOrderDraft = {
  schoolName: string;
  contactPerson: string;
  phoneNumber: string;
  county: string;
  deliveryLocation: string;
  additionalNotes: string;
  quantities: Record<string, number>;
};

export type GeneratedExamOrder = {
  orderNumber: string;
  schoolName: string;
  sessionName: string;
  totalPapers: number;
  totalAmount: number;
  downloadToken: string;
};

const DRAFT_KEY = "topnote:exam-order:draft";
const GENERATED_ORDER_KEY = "topnote:exam-order:generated";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function saveDraft(draft: ExamOrderDraft): void {
  if (!isBrowser()) return;
  window.localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
}

export function loadDraft(): ExamOrderDraft | null {
  if (!isBrowser()) return null;
  return safeParse<ExamOrderDraft>(window.localStorage.getItem(DRAFT_KEY));
}

export function clearDraft(): void {
  if (!isBrowser()) return;
  window.localStorage.removeItem(DRAFT_KEY);
}

export function saveGeneratedOrder(order: GeneratedExamOrder): void {
  if (!isBrowser()) return;
  window.localStorage.setItem(GENERATED_ORDER_KEY, JSON.stringify(order));
}

export function loadGeneratedOrder(): GeneratedExamOrder | null {
  if (!isBrowser()) return null;
  return safeParse<GeneratedExamOrder>(window.localStorage.getItem(GENERATED_ORDER_KEY));
}

export function clearGeneratedOrder(): void {
  if (!isBrowser()) return;
  window.localStorage.removeItem(GENERATED_ORDER_KEY);
}

export function downloadExamPdf(downloadToken: string): void {
  if (typeof window === "undefined") return;
  window.open(`/api/orders/download?token=${downloadToken}`, "_blank");
}
