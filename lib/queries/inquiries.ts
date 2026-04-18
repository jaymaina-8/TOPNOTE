import { createServiceRoleClient } from "@/lib/supabase/admin";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import type { InquiryRow, InquiryStatus } from "@/lib/supabase/types";
import type { ValidatedInquiryPayload } from "@/lib/validation/inquiry";

import { trackInquirySubmit } from "@/lib/conversion/track";

export type InquiryWithProduct = InquiryRow & {
  products: { name: string; slug: string } | null;
};

export type CreateInquiryResult =
  | { ok: true }
  | { ok: false; error: string };

/**
 * Insert a public inquiry using the anon server client (RLS allows insert).
 */
export async function createInquiry(payload: ValidatedInquiryPayload): Promise<CreateInquiryResult> {
  const supabase = await createClient();
  if (!supabase) {
    return {
      ok: false,
      error: "We can't take inquiries right now. Please try WhatsApp or call us.",
    };
  }

  const { error } = await supabase.from("inquiries").insert({
    name: payload.name,
    phone: payload.phone,
    message: payload.message,
    source_product_id: payload.sourceProductId,
    source_page: payload.sourcePage,
    source_type: payload.sourceType,
  });

  if (error) {
    console.error("[createInquiry]", error.message);
    return {
      ok: false,
      error: "We couldn't send your message. Please try again in a moment.",
    };
  }

  let productName: string | undefined;
  if (payload.sourceProductId) {
    const { data: productRow } = await supabase
      .from("products")
      .select("name")
      .eq("id", payload.sourceProductId)
      .maybeSingle();
    productName = productRow?.name ?? undefined;
  }

  await trackInquirySubmit({
    sourcePage: payload.sourcePage,
    sourceProductId: payload.sourceProductId,
    metadata: {
      source_type: payload.sourceType,
      ...(productName ? { product_name: productName } : {}),
    },
  });

  return { ok: true };
}

export type GetInquiriesResult =
  | { ok: true; inquiries: InquiryWithProduct[] }
  | {
      ok: false;
      reason: "supabase_unconfigured" | "service_role_unconfigured" | "query_failed";
    };

/**
 * List inquiries newest first. Requires `SUPABASE_SERVICE_ROLE_KEY` on the server
 * because RLS does not grant public SELECT on `inquiries`.
 */
export async function getInquiries(): Promise<GetInquiriesResult> {
  const admin = createServiceRoleClient();
  if (!admin) {
    const { isConfigured } = getSupabaseEnv({ allowServerOnlyAliases: true });
    if (!isConfigured) {
      return { ok: false, reason: "supabase_unconfigured" };
    }
    return { ok: false, reason: "service_role_unconfigured" };
  }

  const { data, error } = await admin
    .from("inquiries")
    .select("*, products(name, slug)")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[getInquiries]", error.message);
    return { ok: false, reason: "query_failed" };
  }

  return { ok: true, inquiries: (data as InquiryWithProduct[]) ?? [] };
}

/**
 * Newest inquiries with limit (e.g. dashboard overview).
 */
export async function getRecentInquiries(limit: number): Promise<GetInquiriesResult> {
  const admin = createServiceRoleClient();
  if (!admin) {
    const { isConfigured } = getSupabaseEnv({ allowServerOnlyAliases: true });
    if (!isConfigured) {
      return { ok: false, reason: "supabase_unconfigured" };
    }
    return { ok: false, reason: "service_role_unconfigured" };
  }

  const { data, error } = await admin
    .from("inquiries")
    .select("*, products(name, slug)")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[getRecentInquiries]", error.message);
    return { ok: false, reason: "query_failed" };
  }

  return { ok: true, inquiries: (data as InquiryWithProduct[]) ?? [] };
}

export type AdvanceInquiryStatusResult =
  | { ok: true }
  | { ok: false; error: string };

/**
 * Forward-only workflow: `new` -> `contacted` -> `closed`. Requires service role.
 */
export async function advanceInquiryStatus(
  id: string,
  nextStatus: InquiryStatus,
): Promise<AdvanceInquiryStatusResult> {
  const admin = createServiceRoleClient();
  if (!admin) {
    return { ok: false, error: "Service role is not configured on this server." };
  }

  const { data: row, error: fetchErr } = await admin
    .from("inquiries")
    .select("status")
    .eq("id", id)
    .maybeSingle();

  if (fetchErr || !row) {
    return { ok: false, error: "Could not find that inquiry." };
  }

  const current = row.status as InquiryStatus;
  const valid =
    (current === "new" && nextStatus === "contacted") ||
    (current === "contacted" && nextStatus === "closed");

  if (!valid) {
    return { ok: false, error: "That status change is not allowed." };
  }

  const { error } = await admin.from("inquiries").update({ status: nextStatus }).eq("id", id);

  if (error) {
    console.error("[advanceInquiryStatus]", error.message);
    return { ok: false, error: "Could not update inquiry." };
  }

  return { ok: true };
}
