/**
 * Allowlist for `/api/track-and-redirect` targets (open redirect prevention).
 */
export function isAllowedRedirectTarget(raw: string): boolean {
  const trimmed = raw.trim();
  if (!trimmed) return false;
  try {
    if (trimmed.toLowerCase().startsWith("tel:")) {
      const rest = trimmed.slice(4).replace(/[\s\-()]/g, "");
      return /^\+?\d{6,15}$/.test(rest);
    }
    const u = new URL(trimmed);
    if (u.protocol !== "https:") return false;
    const host = u.hostname.toLowerCase();
    return host === "wa.me" || host === "api.whatsapp.com";
  } catch {
    return false;
  }
}
