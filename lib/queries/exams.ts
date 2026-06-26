import "server-only";

import { EXAM_CLASSES } from "@/lib/exams/classes";
import type {
  ExamOrderWithSession,
  ExamSessionPriceRow,
  ExamSessionRow,
  ExamSessionWithPrices,
} from "@/lib/exams/types";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";


function mapSessionPrices(prices: ExamSessionPriceRow[] | null | undefined): ExamSessionPriceRow[] {
  return (prices ?? []).slice().sort((a, b) => {
    const aIndex = EXAM_CLASSES.findIndex((item) => item.key === a.class_key);
    const bIndex = EXAM_CLASSES.findIndex((item) => item.key === b.class_key);
    return aIndex - bIndex;
  });
}

function mapSessionWithPrices(
  session: ExamSessionRow,
  prices: ExamSessionPriceRow[] | null | undefined,
): ExamSessionWithPrices {
  return {
    ...session,
    prices: mapSessionPrices(prices),
  };
}

export async function getActiveExamSession(): Promise<ExamSessionWithPrices | null> {
  const result = await getActiveExamSessionWithStatus();
  return result.session;
}

export type ActiveExamSessionResult = {
  session: ExamSessionWithPrices | null;
  error: string | null;
};

export async function getActiveExamSessionWithStatus(): Promise<ActiveExamSessionResult> {
  const supabase = await createClient();
  if (!supabase) {
    const message = "Supabase client is not configured for server-side queries.";
    console.error("[getActiveExamSession]", message);
    return { session: null, error: message };
  }

  const { data, error } = await supabase
    .from("exam_sessions")
    .select("*, exam_session_prices(*)")
    .eq("status", "active")
    .maybeSingle();

  console.log("[getActiveExamSession] Active session found?", !!data);
  if (error) {
    console.error("[getActiveExamSession] Any Supabase errors:", error);
    return { session: null, error: error.message };
  }

  if (!data) {
    console.log("[getActiveExamSession] No active exam session found.");
    return { session: null, error: null };
  }

  console.log("[getActiveExamSession] Session ID:", data.id);
  const pricingCount = data.exam_session_prices?.length ?? 0;
  console.log("[getActiveExamSession] Number of pricing records:", pricingCount);

  const { exam_session_prices, ...session } = data as ExamSessionRow & {
    exam_session_prices: ExamSessionPriceRow[] | null;
  };

  return {
    session: mapSessionWithPrices(session, exam_session_prices),
    error: null,
  };
}

export async function listExamSessionsAdmin(): Promise<ExamSessionWithPrices[]> {
  const admin = createServiceRoleClient();
  if (!admin) return [];

  const { data, error } = await admin
    .from("exam_sessions")
    .select("*, exam_session_prices(*)")
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  return data.map((row) => {
    const { exam_session_prices, ...session } = row as ExamSessionRow & {
      exam_session_prices: ExamSessionPriceRow[] | null;
    };
    return mapSessionWithPrices(session, exam_session_prices);
  });
}

export async function getExamSessionByIdAdmin(id: string): Promise<ExamSessionWithPrices | null> {
  const admin = createServiceRoleClient();
  if (!admin) return null;

  const { data, error } = await admin
    .from("exam_sessions")
    .select("*, exam_session_prices(*)")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;

  const { exam_session_prices, ...session } = data as ExamSessionRow & {
    exam_session_prices: ExamSessionPriceRow[] | null;
  };

  return mapSessionWithPrices(session, exam_session_prices);
}

export type ExamOrdersResult =
  | { ok: true; orders: ExamOrderWithSession[] }
  | { ok: false; reason: "supabase_unconfigured" | "service_role_unconfigured" | "query_failed" };

export async function getExamOrders(): Promise<ExamOrdersResult> {
  const admin = createServiceRoleClient();
  if (!admin) {
    return { ok: false, reason: "service_role_unconfigured" };
  }

  const { data, error } = await admin
    .from("exam_orders")
    .select("*, exam_sessions(id, name, slug)")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[getExamOrders]", error.message);
    return { ok: false, reason: "query_failed" };
  }

  return { ok: true, orders: (data ?? []) as ExamOrderWithSession[] };
}

export async function getExamOrderByIdAdmin(id: string): Promise<ExamOrderWithSession | null> {
  const admin = createServiceRoleClient();
  if (!admin) return null;

  const { data, error } = await admin
    .from("exam_orders")
    .select("*, exam_sessions(id, name, slug)")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;
  return data as ExamOrderWithSession;
}
