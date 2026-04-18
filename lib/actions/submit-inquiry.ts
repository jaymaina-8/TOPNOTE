"use server";

import { createInquiry } from "@/lib/queries/inquiries";
import { validateInquiryInput } from "@/lib/validation/inquiry";

export type InquiryActionState =
  | { status: "idle" }
  | { status: "error"; error: string }
  | { status: "success"; message: string };

const SUCCESS_MESSAGE =
  "Thank you — we’ve received your message. We’ll get back to you soon.";

export async function submitInquiryAction(
  _prev: InquiryActionState,
  formData: FormData,
): Promise<InquiryActionState> {
  const validated = validateInquiryInput({
    name: formData.get("name")?.toString(),
    phone: formData.get("phone")?.toString(),
    message: formData.get("message")?.toString(),
    sourceProductId: formData.get("source_product_id")?.toString(),
    sourcePage: formData.get("source_page")?.toString(),
    sourceType: formData.get("source_type")?.toString(),
  });

  if (!validated.ok) {
    return { status: "error", error: validated.error };
  }

  const result = await createInquiry(validated.data);
  if (!result.ok) {
    return { status: "error", error: result.error };
  }

  return { status: "success", message: SUCCESS_MESSAGE };
}
