export type ParseSupabaseEnvOptions = {
  /** Server-only: allow `SUPABASE_URL` / `SUPABASE_ANON_KEY` if `NEXT_PUBLIC_*` are unset. */
  allowServerOnlyAliases?: boolean;
};

let hasWarned = false;

function readEnvTrimmed(key: string): string | undefined {
  const raw = process.env[key];
  if (raw === undefined || raw === null) return undefined;
  const s = String(raw).trim();
  return s.length ? s : undefined;
}

/**
 * Supabase URL and anon key from `process.env` (trimmed; empty strings treated as missing).
 * Next.js inlines `NEXT_PUBLIC_*` at build time; server fallbacks are optional when allowed.
 */
export function getSupabaseEnv(options?: ParseSupabaseEnvOptions): {
  url: string | null;
  anonKey: string | null;
  isConfigured: boolean;
} {
  const allowServer = options?.allowServerOnlyAliases === true;

  // Statically reference NEXT_PUBLIC_* variables so that the Next.js compiler
  // can replace them with their literal values in client-side bundles.
  const nextPublicUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const nextPublicAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const urlRaw =
    (nextPublicUrl ? String(nextPublicUrl).trim() : undefined) ||
    readEnvTrimmed("NEXT_PUBLIC_SUPABASE_URL") ||
    (allowServer ? readEnvTrimmed("SUPABASE_URL") : undefined);
  const anonKeyRaw =
    (nextPublicAnonKey ? String(nextPublicAnonKey).trim() : undefined) ||
    readEnvTrimmed("NEXT_PUBLIC_SUPABASE_ANON_KEY") ||
    (allowServer ? readEnvTrimmed("SUPABASE_ANON_KEY") : undefined);

  const normalizedUrl = urlRaw ?? null;
  const normalizedAnonKey = anonKeyRaw ?? null;
  const isConfigured = Boolean(normalizedUrl && normalizedAnonKey);

  if (!isConfigured && !hasWarned) {
    hasWarned = true;
    console.warn(
      "[Supabase] Missing environment variables. Running in fallback mode.",
    );
  }

  if (!isConfigured) {
    return { url: null, anonKey: null, isConfigured: false };
  }

  return {
    url: normalizedUrl,
    anonKey: normalizedAnonKey,
    isConfigured: true,
  };
}

/**
 * Supabase URL and anon key (trimmed). Empty strings count as missing.
 */
export function parseSupabaseEnv(options?: ParseSupabaseEnvOptions): { url: string; anonKey: string } | null {
  const { url, anonKey, isConfigured } = getSupabaseEnv(options);
  if (!isConfigured || !url || !anonKey) return null;
  return { url, anonKey };
}

/**
 * Server-only: Supabase URL + service role key for privileged reads (e.g. internal inquiry list).
 * Never expose `SUPABASE_SERVICE_ROLE_KEY` to the client.
 */
export function getSupabaseServiceRoleConfig(): { url: string; serviceRoleKey: string } | null {
  const urlRaw =
    readEnvTrimmed("NEXT_PUBLIC_SUPABASE_URL") ||
    readEnvTrimmed("SUPABASE_URL");
  const serviceRoleKey = readEnvTrimmed("SUPABASE_SERVICE_ROLE_KEY");
  if (!urlRaw || !serviceRoleKey) return null;
  return { url: urlRaw, serviceRoleKey };
}
