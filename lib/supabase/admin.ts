import "server-only";

import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "./types";
import { getSupabaseServiceRoleConfig } from "./env";

/**
 * Server-only client that bypasses RLS (service role). Use only for trusted server code.
 * Returns null when URL or `SUPABASE_SERVICE_ROLE_KEY` is missing.
 */
export function createServiceRoleClient(): SupabaseClient<Database> | null {
  const config = getSupabaseServiceRoleConfig();
  if (!config) return null;

  return createClient<Database>(config.url, config.serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
