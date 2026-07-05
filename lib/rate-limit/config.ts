export type RateLimitPolicy = {
  key: string;
  limit: number;
  windowSeconds: number;
};

export const RATE_LIMITS = {
  public: { key: "global-page-load", limit: 500, windowSeconds: 60 },
  search: { key: "search", limit: 300, windowSeconds: 60 },
  contact: { key: "contact-submit", limit: 20, windowSeconds: 60 * 60 },
  inquiry: { key: "inquiry-submit", limit: 20, windowSeconds: 60 * 60 },
  exams: { key: "exam-order-submit", limit: 20, windowSeconds: 15 * 60 },
  login: { key: "login-attempt", limit: 5, windowSeconds: 15 * 60 },
  analytics: { key: "analytics-track", limit: 300, windowSeconds: 60 },
  dashboard: { key: "dashboard-api", limit: 300, windowSeconds: 60 },
  whatsapp: { key: "whatsapp-generate", limit: 300, windowSeconds: 60 },
  pdf: { key: "pdf-generate", limit: 300, windowSeconds: 60 },
} as const satisfies Record<string, RateLimitPolicy>;

export const RATE_LIMIT_POLICIES = {
  examOrderSubmit: RATE_LIMITS.exams,
  contactSubmit: RATE_LIMITS.contact,
  inquirySubmit: RATE_LIMITS.inquiry,
  analyticsTrack: RATE_LIMITS.analytics,
  search: RATE_LIMITS.search,
  whatsappGenerate: RATE_LIMITS.whatsapp,
  pdfGenerate: RATE_LIMITS.pdf,
  loginAttempt: RATE_LIMITS.login,
  dashboardApi: RATE_LIMITS.dashboard,
  globalPageLoad: RATE_LIMITS.public,
} as const;

export const ABUSE_SETTINGS = {
  duplicateOrderWindowSeconds: 2 * 60,
  suspiciousRapidRepeatSeconds: 15,
  suspiciousDuplicateThreshold: 3,
} as const;
