import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "./types";
import { getSupabaseEnv } from "./env";

/**
 * Supabase client for Client Components and browser-only code.
 * Uses a singleton via `@supabase/ssr` defaults.
 * Returns `null` when env is not configured (fallback mode). Browser must use `NEXT_PUBLIC_*` only.
 */
export function createClient(): SupabaseClient<Database> | null {
  const { url, anonKey, isConfigured } = getSupabaseEnv({ allowServerOnlyAliases: false });
  if (!isConfigured || !url || !anonKey) {
    return null;
  }
  return createBrowserClient<Database>(url, anonKey);
}
