import "server-only";

import { logSecurityEvent } from "./logger";
import { createServiceRoleClient } from "@/lib/supabase/admin";

export type SecurityEventData = {
  eventType: "rate_limit_blocked" | "duplicate_order" | "suspicious_activity" | "validation_failed";
  ip: string;
  path?: string;
  details?: Record<string, any>;
};

/**
 * Persist security event to database in a fire-and-forget, safe manner.
 * If database is unavailable or the schema is not updated, falls back gracefully.
 */
async function saveSecurityEventToDb(data: SecurityEventData): Promise<void> {
  const admin = createServiceRoleClient();
  if (!admin) return;

  try {
    const { error } = await admin.from("security_events").insert({
      event_type: data.eventType,
      ip: data.ip,
      path: data.path || null,
      details: data.details || {},
    });

    if (error) {
      console.warn(
        `[SECURITY] Database logging failed (is migrations applied?): ${error.message}`
      );
    }
  } catch (err: any) {
    console.warn(`[SECURITY] Database logging error: ${err?.message || err}`);
  }
}

/**
 * Hook to track rate limit blocks
 */
export async function trackBlocked(
  ip: string,
  path: string,
  reason: string,
  details?: Record<string, any>
): Promise<void> {
  logSecurityEvent({
    type: "rate_limit_exceeded",
    ip,
    path,
    details: { reason, ...details },
  });

  await saveSecurityEventToDb({
    eventType: "rate_limit_blocked",
    ip,
    path,
    details: { reason, ...details },
  });
}

/**
 * Hook to track duplicate order attempts
 */
export async function trackDuplicateAttempt(
  ip: string,
  path: string,
  details?: Record<string, any>
): Promise<void> {
  logSecurityEvent({
    type: "abuse_detected",
    ip,
    path,
    details: { reason: "duplicate_order_attempt", ...details },
  });

  await saveSecurityEventToDb({
    eventType: "duplicate_order",
    ip,
    path,
    details: details,
  });
}

/**
 * Hook to track general suspicious activity (e.g. extremely rapid clicks, empty payloads)
 */
export async function trackSuspicious(
  ip: string,
  path: string,
  reason: string,
  details?: Record<string, any>
): Promise<void> {
  logSecurityEvent({
    type: "suspicious_request",
    ip,
    path,
    details: { reason, ...details },
  });

  await saveSecurityEventToDb({
    eventType: "suspicious_activity",
    ip,
    path,
    details: { reason, ...details },
  });
}

/**
 * Hook to track input validation failures
 */
export async function trackValidationFailed(
  ip: string,
  path: string,
  reason: string,
  details?: Record<string, any>
): Promise<void> {
  logSecurityEvent({
    type: "validation_failed",
    ip,
    path,
    details: { reason, ...details },
  });

  await saveSecurityEventToDb({
    eventType: "validation_failed",
    ip,
    path,
    details: { reason, ...details },
  });
}
