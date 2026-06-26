import { EXAM_CLASS_KEYS, EXAM_CLASSES, getExamClassLabel, isExamClassKey } from "@/lib/exams/classes";
import type { ExamOrderItem } from "@/lib/exams/types";

export type ExamOrderFormInput = {
  sessionId: string;
  schoolName: string;
  contactPerson: string;
  phone: string;
  county: string;
  deliveryLocation: string;
  additionalNotes?: string;
  quantities: Record<string, number>;
  prices: Record<string, number>;
};

export type ValidatedExamOrderInput = {
  sessionId: string;
  schoolName: string;
  contactPerson: string;
  phone: string;
  county: string;
  deliveryLocation: string;
  additionalNotes: string | null;
  items: ExamOrderItem[];
  totalPapers: number;
  totalAmount: number;
};

function parseQuantity(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.max(0, Math.floor(value));
  }
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number.parseInt(value, 10);
    if (Number.isFinite(parsed)) {
      return Math.max(0, parsed);
    }
  }
  return 0;
}

function parseRequiredText(value: unknown, fieldName: string, maxLength: number): string | { error: string } {
  const text = typeof value === "string" ? value.trim() : "";
  if (!text) return { error: `${fieldName} is required.` };
  if (text.length > maxLength) return { error: `${fieldName} is too long.` };
  return text;
}

const PHONE_RE = /^[+\d\s().-]{7,25}$/;

export function validateExamOrderInput(input: ExamOrderFormInput):
  | { ok: true; data: ValidatedExamOrderInput }
  | { ok: false; error: string } {
  const sessionId = parseRequiredText(input.sessionId, "Exam session", 80);
  if (typeof sessionId !== "string") return { ok: false, error: sessionId.error };

  const schoolName = parseRequiredText(input.schoolName, "School name", 200);
  if (typeof schoolName !== "string") return { ok: false, error: schoolName.error };

  const contactPerson = parseRequiredText(input.contactPerson, "Contact person", 200);
  if (typeof contactPerson !== "string") return { ok: false, error: contactPerson.error };

  const phone = parseRequiredText(input.phone, "Phone number", 40);
  if (typeof phone !== "string") return { ok: false, error: phone.error };

  if (!PHONE_RE.test(phone)) {
    return { ok: false, error: "Please enter a valid phone number (7 to 25 characters, e.g. +254700000000)." };
  }

  const county = parseRequiredText(input.county, "County", 120);
  if (typeof county !== "string") return { ok: false, error: county.error };

  const deliveryLocation = parseRequiredText(input.deliveryLocation, "Delivery location", 300);
  if (typeof deliveryLocation !== "string") return { ok: false, error: deliveryLocation.error };

  const additionalNotesRaw = typeof input.additionalNotes === "string" ? input.additionalNotes.trim() : "";
  if (additionalNotesRaw.length > 2000) {
    return { ok: false, error: "Additional notes are too long." };
  }

  const items: ExamOrderItem[] = [];
  let totalPapers = 0;
  let totalAmount = 0;

  for (const classKey of EXAM_CLASS_KEYS) {
    const quantity = parseQuantity(input.quantities[classKey]);
    if (quantity <= 0) continue;

    if (quantity > 5000) {
      return { ok: false, error: `Quantity for ${getExamClassLabel(classKey)} cannot exceed 5,000.` };
    }

    const unitPrice = Number(input.prices[classKey] ?? 0);
    if (!Number.isFinite(unitPrice) || unitPrice < 0) {
      return { ok: false, error: `Invalid price for ${getExamClassLabel(classKey)}.` };
    }

    const lineTotal = Math.round(unitPrice * quantity);
    items.push({
      class_key: classKey,
      class_label: getExamClassLabel(classKey),
      unit_price: unitPrice,
      quantity,
      line_total: lineTotal,
    });
    totalPapers += quantity;
    totalAmount += lineTotal;
  }

  if (items.length === 0) {
    return { ok: false, error: "Enter at least one exam quantity." };
  }

  if (totalPapers > 20000) {
    return { ok: false, error: "Total number of papers in a single order cannot exceed 20,000." };
  }

  if (totalAmount > 2000000) {
    return { ok: false, error: "Total order value cannot exceed KES 2,000,000." };
  }

  return {
    ok: true,
    data: {
      sessionId,
      schoolName,
      contactPerson,
      phone,
      county,
      deliveryLocation,
      additionalNotes: additionalNotesRaw || null,
      items,
      totalPapers,
      totalAmount,
    },
  };
}

export function parseExamOrderQuantitiesFromFormData(formData: FormData): Record<string, number> {
  const quantities: Record<string, number> = {};
  for (const classKey of EXAM_CLASS_KEYS) {
    quantities[classKey] = parseQuantity(formData.get(`qty_${classKey}`));
  }
  return quantities;
}

export function parseExamOrderPricesFromFormData(formData: FormData): Record<string, number> {
  const prices: Record<string, number> = {};
  for (const classKey of EXAM_CLASS_KEYS) {
    const raw = formData.get(`price_${classKey}`);
    const parsed = typeof raw === "string" ? Number.parseFloat(raw) : Number.NaN;
    prices[classKey] = Number.isFinite(parsed) ? parsed : 0;
  }
  return prices;
}

export function parseExamOrderPricesRecord(record: Record<string, number>): Record<string, number> {
  const prices: Record<string, number> = {};
  for (const classKey of EXAM_CLASS_KEYS) {
    const value = record[classKey];
    prices[classKey] = Number.isFinite(value) ? value : 0;
  }
  return prices;
}

export function isValidExamClassKeyList(values: string[]): boolean {
  return values.every((value) => isExamClassKey(value));
}

export { EXAM_CLASSES };
