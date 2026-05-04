import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

import type { Database } from "./types";
import { getSupabaseEnv } from "./env";

async function safeSupabaseFetch(...args: Parameters<typeof fetch>): Promise<Response> {
  try {
    return await fetch(...args);
  } catch {
    return Response.json(
      { message: "Supabase is unavailable" },
      { status: 503, statusText: "Service Unavailable" },
    );
  }
}

/**
 * Supabase client for Server Components, Server Actions, and Route Handlers.
 * Cookie handling supports future Auth; safe to ignore `setAll` errors in RSC.
 * Returns `null` when env is not configured (fallback mode).
 */
export async function createClient(): Promise<SupabaseClient<Database> | null> {
  const { url, anonKey, isConfigured } = getSupabaseEnv({ allowServerOnlyAliases: true });
  if (!isConfigured || !url || !anonKey) {
    return null;
  }

  const cookieStore = await cookies();

  return createServerClient<Database>(url, anonKey, {
    global: {
      fetch: safeSupabaseFetch,
    },
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet, headers) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Called from a Server Component where cookies cannot be set — expected until middleware handles refresh.
        }
        // Supabase passes no-store cache headers with auth cookies; apply these on the Response in middleware when you add Auth.
        void headers;
      },
    },
  });
}
