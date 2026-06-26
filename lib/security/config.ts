export type RateLimitPolicy = {
  key: string;
  limit: number;
  windowSeconds: number;
};

export const RATE_LIMIT_POLICIES = {
  examOrderSubmit: { key: "exam-order-submit", limit: 5, windowSeconds: 15 * 60 },
  contactSubmit: { key: "contact-submit", limit: 5, windowSeconds: 60 * 60 },
  inquirySubmit: { key: "inquiry-submit", limit: 5, windowSeconds: 60 * 60 },
  analyticsTrack: { key: "analytics-track", limit: 60, windowSeconds: 60 },
  search: { key: "search", limit: 30, windowSeconds: 60 },
  whatsappGenerate: { key: "whatsapp-generate", limit: 10, windowSeconds: 60 * 60 },
  pdfGenerate: { key: "pdf-generate", limit: 10, windowSeconds: 60 * 60 },
  loginAttempt: { key: "login-attempt", limit: 5, windowSeconds: 15 * 60 },
  dashboardApi: { key: "dashboard-api", limit: 240, windowSeconds: 60 },
  globalPageLoad: { key: "global-page-load", limit: 150, windowSeconds: 60 },
} as const satisfies Record<string, RateLimitPolicy>;


export const ABUSE_SETTINGS = {
  duplicateOrderWindowSeconds: 2 * 60,
  suspiciousRapidRepeatSeconds: 15,
  suspiciousDuplicateThreshold: 3,
} as const;
