import { createServerClient } from "@supabase/ssr";
import type { User } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

import type { Database } from "./types";
import { getSupabaseEnv } from "./env";

export type UpdateSessionResult = {
  response: NextResponse;
  user: User | null;
};

/**
 * Refresh Supabase Auth cookies on the middleware response. Call `getUser()` so the session is validated.
 * Edge-safe: uses only public URL + anon key.
 */
export async function updateSession(request: NextRequest): Promise<UpdateSessionResult> {
  const { url, anonKey, isConfigured } = getSupabaseEnv({ allowServerOnlyAliases: true });
  if (!isConfigured || !url || !anonKey) {
    return { response: NextResponse.next({ request }), user: null };
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { response, user: user ?? null };
}
