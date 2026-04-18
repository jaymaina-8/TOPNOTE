import "server-only";

import { createServiceRoleClient } from "@/lib/supabase/admin";
import type { ConversionEventType, Json } from "@/lib/supabase/types";

export type TrackConversionInput = {
  eventType: ConversionEventType;
  sourcePage?: string | null;
  sourceProductId?: string | null;
  metadata?: Json | null;
};

/**
 * Inserts a row into `conversion_events` using the service role (RLS blocks anon).
 * No-ops when the service role client is unavailable (e.g. local dev without key).
 */
export async function trackConversionEvent(input: TrackConversionInput): Promise<void> {
  const admin = createServiceRoleClient();
  if (!admin) return;

  const { error } = await admin.from("conversion_events").insert({
    event_type: input.eventType,
    source_page: input.sourcePage?.trim() || null,
    source_product_id: input.sourceProductId?.trim() || null,
    metadata: input.metadata ?? null,
  });

  if (error) {
    console.error("[trackConversionEvent]", error.message);
  }
}

export async function trackWhatsAppClick(params: {
  sourcePage?: string | null;
  sourceProductId?: string | null;
  metadata?: Json | null;
}): Promise<void> {
  await trackConversionEvent({
    eventType: "whatsapp_click",
    sourcePage: params.sourcePage,
    sourceProductId: params.sourceProductId,
    metadata: params.metadata ?? null,
  });
}

export async function trackPhoneClick(params: {
  sourcePage?: string | null;
  sourceProductId?: string | null;
  metadata?: Json | null;
}): Promise<void> {
  await trackConversionEvent({
    eventType: "phone_click",
    sourcePage: params.sourcePage,
    sourceProductId: params.sourceProductId,
    metadata: params.metadata ?? null,
  });
}

export async function trackInquirySubmit(params: {
  sourcePage?: string | null;
  sourceProductId?: string | null;
  metadata?: Json | null;
}): Promise<void> {
  await trackConversionEvent({
    eventType: "inquiry_submit",
    sourcePage: params.sourcePage,
    sourceProductId: params.sourceProductId,
    metadata: params.metadata ?? null,
  });
}
