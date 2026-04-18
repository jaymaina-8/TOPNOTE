/**
 * Dashboard allowlist (server-only env): `DASHBOARD_ALLOWED_EMAILS=admin@topnote.com`
 * Comma-separated, trimmed, case-insensitive exact-email match.
 *
 * This deployment is intentionally restricted to known internal operator accounts.
 * If unset or empty, no email is allowed (fail closed — set `DASHBOARD_ALLOWED_EMAILS` in each environment).
 */
export function parseDashboardAllowlist(): string[] | null {
  const raw = process.env.DASHBOARD_ALLOWED_EMAILS;
  if (raw === undefined || raw === null) return null;
  const parts = String(raw)
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return parts.length ? parts : null;
}

export function isEmailAllowedForDashboard(email: string | undefined): boolean {
  const allow = parseDashboardAllowlist();
  if (!allow || allow.length === 0) return false;
  if (!email) return false;
  return allow.includes(email.trim().toLowerCase());
}
