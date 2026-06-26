import "server-only";

export type SecurityEventType =
  | "rate_limit_exceeded"
  | "auth_failed"
  | "suspicious_request"
  | "abuse_detected"
  | "validation_failed"
  | "error";

export type SecurityLogPayload = {
  type: SecurityEventType;
  ip: string;
  path?: string;
  details?: Record<string, any>;
};

/**
 * Clean up values to prevent logging credentials, secrets, or service keys.
 */
function sanitizeDetails(details?: Record<string, any>): Record<string, any> | undefined {
  if (!details) return undefined;
  const cleaned = { ...details };
  const sensitiveKeys = [
    "password",
    "secret",
    "token",
    "key",
    "service_role",
    "auth",
    "cookie",
    "authorization",
  ];

  for (const k of Object.keys(cleaned)) {
    const lowerKey = k.toLowerCase();
    if (sensitiveKeys.some((s) => lowerKey.includes(s))) {
      cleaned[k] = "[REDACTED_SENSITIVE_KEY]";
    }
  }
  return cleaned;
}

/**
 * Structured security logging following Cloud Logging standards.
 * Security logs are formatted as JSON lines prefixed by [SECURITY].
 */
export function logSecurityEvent(payload: SecurityLogPayload) {
  const timestamp = new Date().toISOString();
  const severity = payload.type === "error" ? "ERROR" : "WARNING";

  const logPayload = {
    timestamp,
    severity,
    type: payload.type,
    ip: payload.ip || "unknown",
    path: payload.path || "unknown",
    details: sanitizeDetails(payload.details),
  };

  console.warn(`[SECURITY] ${JSON.stringify(logPayload)}`);
}
