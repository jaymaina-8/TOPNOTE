"use server";

import { revalidatePath } from "next/cache";

import { guardDashboardVoidMutation } from "@/lib/auth/dashboard-access";
import { advanceInquiryStatus } from "@/lib/queries/inquiries";
import type { InquiryStatus } from "@/lib/supabase/types";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function updateInquiryStatusAction(formData: FormData) {
  const allowed = await guardDashboardVoidMutation();
  if (!allowed) return;
  const id = formData.get("inquiry_id")?.toString().trim() ?? "";
  const next = formData.get("next_status")?.toString().trim() ?? "";
  if (!UUID_RE.test(id)) return;
  if (next !== "contacted" && next !== "closed") return;
  await advanceInquiryStatus(id, next as InquiryStatus);
  revalidatePath("/dashboard/inquiries");
}
