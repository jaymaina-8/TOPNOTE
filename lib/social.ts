/**
 * Footer social links.
 *
 * Override in `.env.local` (recommended for real profile URLs):
 * - `NEXT_PUBLIC_SOCIAL_FACEBOOK_URL`
 * - `NEXT_PUBLIC_SOCIAL_INSTAGRAM_URL`
 * - `NEXT_PUBLIC_SOCIAL_X_URL`
 * - `NEXT_PUBLIC_SOCIAL_LINKEDIN_URL`
 *
 * If unset, each icon uses `PLATFORM_DEFAULTS` so the row always shows; replace with your pages when ready.
 */
export type FooterSocialEntry = {
  id: "facebook" | "instagram" | "x" | "linkedin";
  label: string;
  href: string;
};

/** Shown when env / MANUAL are empty — swap for your profile URLs via env or MANUAL. */
const PLATFORM_DEFAULTS: Record<FooterSocialEntry["id"], string> = {
  facebook: "https://www.facebook.com/",
  instagram: "https://www.instagram.com/",
  x: "https://x.com/",
  linkedin: "https://www.linkedin.com/",
};

const MANUAL: Partial<Record<FooterSocialEntry["id"], string>> = {
  // facebook: "https://www.facebook.com/yourpage",
  // instagram: "https://www.instagram.com/yourprofile",
  // x: "https://x.com/yourprofile",
  // linkedin: "https://www.linkedin.com/company/yourcompany",
};

const ENV_KEYS: Record<FooterSocialEntry["id"], string> = {
  facebook: "NEXT_PUBLIC_SOCIAL_FACEBOOK_URL",
  instagram: "NEXT_PUBLIC_SOCIAL_INSTAGRAM_URL",
  x: "NEXT_PUBLIC_SOCIAL_X_URL",
  linkedin: "NEXT_PUBLIC_SOCIAL_LINKEDIN_URL",
};

function envOrEmpty(key: string): string {
  return process.env[key]?.trim() ?? "";
}

function hrefFor(id: FooterSocialEntry["id"]): string {
  const fromEnv = envOrEmpty(ENV_KEYS[id]);
  const fromManual = MANUAL[id]?.trim();
  if (fromEnv) return fromEnv;
  if (fromManual) return fromManual;
  return PLATFORM_DEFAULTS[id];
}

const ENTRIES: readonly Omit<FooterSocialEntry, "href">[] = [
  { id: "facebook", label: "Facebook" },
  { id: "instagram", label: "Instagram" },
  { id: "x", label: "X (Twitter)" },
  { id: "linkedin", label: "LinkedIn" },
];

/** All four footer social links (env / MANUAL override platform defaults). */
export function getFooterSocialLinks(): FooterSocialEntry[] {
  return ENTRIES.map((entry) => ({
    ...entry,
    href: hrefFor(entry.id),
  }));
}
