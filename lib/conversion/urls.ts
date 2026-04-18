import type { ConversionEventType } from "@/lib/supabase/types";

export type TrackAndRedirectParams = {
  event: Extract<ConversionEventType, "whatsapp_click" | "phone_click">;
  /** Full destination URL (e.g. `https://wa.me/...` or `tel:+254...`). */
  to: string;
  sourcePage?: string | null;
  sourceProductId?: string | null;
};

/**
 * Builds a same-origin URL that records a conversion event then redirects to `to`.
 */
export function buildTrackAndRedirectUrl(params: TrackAndRedirectParams): string {
  const search = new URLSearchParams();
  search.set("event", params.event);
  search.set("to", params.to);
  if (params.sourcePage?.trim()) {
    search.set("source_page", params.sourcePage.trim());
  }
  if (params.sourceProductId?.trim()) {
    search.set("source_product_id", params.sourceProductId.trim());
  }
  return `/api/track-and-redirect?${search.toString()}`;
}
