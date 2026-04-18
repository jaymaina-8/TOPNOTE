import { unauthorized } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import { isEmailAllowedForDashboard } from "./allowlist";

export const DASHBOARD_ACTION_FORBIDDEN = "You do not have access to perform this action.";

export type DashboardAuthResult =
  | { ok: true; userId: string; email: string | undefined }
  | { ok: false; reason: "unauthenticated" }
  | { ok: false; reason: "forbidden"; email?: string };

/**
 * Resolve dashboard auth for server components, layouts, and server actions.
 * Does not redirect — callers decide how to handle `reason`.
 */
export async function getDashboardAuth(): Promise<DashboardAuthResult> {
  const supabase = await createClient();
  if (!supabase) {
    return { ok: false, reason: "unauthenticated" };
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { ok: false, reason: "unauthenticated" };
  }

  const email = user.email ?? undefined;
  if (!isEmailAllowedForDashboard(email)) {
    return { ok: false, reason: "forbidden", email };
  }

  return { ok: true, userId: user.id, email };
}

/** Alias for server actions — same as getDashboardAuth. */
export async function assertDashboardMutation(): Promise<DashboardAuthResult> {
  return getDashboardAuth();
}

/**
 * Unauthenticated server actions should call `unauthorized()` (not redirect to /login).
 */
export function unauthorizedIfNotAuthenticated(auth: DashboardAuthResult): void {
  if (auth.ok === false && auth.reason === "unauthenticated") {
    unauthorized();
  }
}

/**
 * For server actions that return `{ error: string | null }`. Unauthenticated callers trigger `unauthorized()`.
 */
export async function guardDashboardFormMutation(): Promise<{ error: string } | null> {
  const auth = await assertDashboardMutation();
  unauthorizedIfNotAuthenticated(auth);
  if (auth.ok === false && auth.reason === "forbidden") {
    return { error: DASHBOARD_ACTION_FORBIDDEN };
  }
  return null;
}

/**
 * For void server actions (e.g. delete). Unauthenticated triggers `unauthorized()`.
 */
export async function guardDashboardVoidMutation(): Promise<boolean> {
  const auth = await assertDashboardMutation();
  unauthorizedIfNotAuthenticated(auth);
  if (auth.ok === false && auth.reason === "forbidden") {
    return false;
  }
  return true;
}
