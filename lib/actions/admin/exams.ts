"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { examFormInitialState, type ExamFormState } from "@/lib/admin/action-form-state";
import { parseRequiredString, SLUG_RE, UUID_RE } from "@/lib/admin/validation";
import { guardDashboardFormMutation, guardDashboardVoidMutation } from "@/lib/auth/dashboard-access";
import { EXAM_CLASS_KEYS } from "@/lib/exams/classes";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import type { ExamSessionStatus } from "@/lib/exams/types";

function slugifyName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parsePrice(formData: FormData, classKey: string): number | null {
  const raw = parseRequiredString(formData, `price_${classKey}`);
  if (raw === null || raw === "") return 0;
  const value = Number.parseFloat(raw);
  if (!Number.isFinite(value) || value < 0) return null;
  return value;
}

export async function createExamSessionAction(
  _prev: ExamFormState,
  formData: FormData,
): Promise<ExamFormState> {
  const denied = await guardDashboardFormMutation();
  if (denied) return denied;

  const admin = createServiceRoleClient();
  if (!admin) return { error: "Service role is not configured on this server." };

  const name = parseRequiredString(formData, "name");
  const slugInput = parseRequiredString(formData, "slug");
  const slug = slugInput || (name ? slugifyName(name) : "");

  if (!name) return { error: "Session name is required." };
  if (!slug) return { error: "Slug is required." };
  if (!SLUG_RE.test(slug)) return { error: "Slug must be lowercase letters, digits, and single hyphens only." };

  const priceRows: { session_id?: string; class_key: (typeof EXAM_CLASS_KEYS)[number]; price: number }[] = [];

  for (const classKey of EXAM_CLASS_KEYS) {
    const price = parsePrice(formData, classKey);
    if (price === null) return { error: `Invalid price for ${classKey}.` };
    priceRows.push({ class_key: classKey, price });
  }

  const { data: session, error: insertError } = await admin
    .from("exam_sessions")
    .insert({ name, slug, status: "draft" })
    .select("id")
    .single();

  if (insertError || !session) {
    if (insertError?.code === "23505") return { error: "A session with that slug already exists." };
    console.error("[createExamSessionAction]", insertError?.message);
    return { error: "Could not create exam session." };
  }

  const rowsWithSession = priceRows.map((row) => ({
    session_id: session.id,
    class_key: row.class_key,
    price: row.price,
  }));

  const { error: pricesError } = await admin.from("exam_session_prices").insert(rowsWithSession);
  if (pricesError) {
    console.error("[createExamSessionAction] prices", pricesError.message);
    await admin.from("exam_sessions").delete().eq("id", session.id);
    return { error: "Could not save session prices." };
  }

  revalidatePath("/dashboard/exams");
  revalidatePath("/exams");
  redirect("/dashboard/exams");
}

export async function updateExamSessionPricesAction(
  _prev: ExamFormState,
  formData: FormData,
): Promise<ExamFormState> {
  const denied = await guardDashboardFormMutation();
  if (denied) return denied;

  const admin = createServiceRoleClient();
  if (!admin) return { error: "Service role is not configured on this server." };

  const sessionId = parseRequiredString(formData, "session_id");
  if (!sessionId || !UUID_RE.test(sessionId)) return { error: "Invalid session." };

  const name = parseRequiredString(formData, "name");
  if (!name) return { error: "Session name is required." };

  const { error: nameError } = await admin.from("exam_sessions").update({ name }).eq("id", sessionId);
  if (nameError) {
    console.error("[updateExamSessionPricesAction] name", nameError.message);
    return { error: "Could not update session name." };
  }

  for (const classKey of EXAM_CLASS_KEYS) {
    const price = parsePrice(formData, classKey);
    if (price === null) return { error: `Invalid price for ${classKey}.` };

    const { error } = await admin
      .from("exam_session_prices")
      .upsert({ session_id: sessionId, class_key: classKey, price }, { onConflict: "session_id,class_key" });

    if (error) {
      console.error("[updateExamSessionPricesAction]", classKey, error.message);
      return { error: "Could not update session prices." };
    }
  }

  revalidatePath("/dashboard/exams");
  revalidatePath("/exams");
  return { error: null, success: true };
}

export async function setExamSessionStatusAction(formData: FormData): Promise<void> {
  const allowed = await guardDashboardVoidMutation();
  if (!allowed) {
    redirect("/dashboard/exams?error=forbidden_status");
  }

  const admin = createServiceRoleClient();
  if (!admin) {
    redirect("/dashboard/exams?error=status");
  }

  const sessionId = parseRequiredString(formData, "session_id");
  const nextStatus = parseRequiredString(formData, "next_status") as ExamSessionStatus | null;

  if (!sessionId || !UUID_RE.test(sessionId)) return;
  if (!nextStatus || !["draft", "active", "archived"].includes(nextStatus)) return;

  const { error } = await admin.from("exam_sessions").update({ status: nextStatus }).eq("id", sessionId);
  if (error) {
    console.error("[setExamSessionStatusAction]", error.message);
    redirect("/dashboard/exams?error=status");
  }

  revalidatePath("/dashboard/exams");
  revalidatePath("/exams");
  redirect("/dashboard/exams");
}

export async function deleteExamSessionAction(formData: FormData): Promise<void> {
  const allowed = await guardDashboardVoidMutation();
  if (!allowed) {
    redirect("/dashboard/exams?error=forbidden_delete");
  }

  const admin = createServiceRoleClient();
  if (!admin) {
    redirect("/dashboard/exams?error=delete");
  }

  const sessionId = parseRequiredString(formData, "session_id");
  if (!sessionId || !UUID_RE.test(sessionId)) return;

  const { count, error: countError } = await admin
    .from("exam_orders")
    .select("id", { count: "exact", head: true })
    .eq("session_id", sessionId);

  if (countError) {
    redirect("/dashboard/exams?error=count");
  }
  if ((count ?? 0) > 0) {
    redirect(`/dashboard/exams?blocked=1&count=${count}`);
  }

  const { error } = await admin.from("exam_sessions").delete().eq("id", sessionId);
  if (error) {
    console.error("[deleteExamSessionAction]", error.message);
    redirect("/dashboard/exams?error=delete");
  }

  revalidatePath("/dashboard/exams");
  revalidatePath("/exams");
  redirect("/dashboard/exams");
}

export async function duplicateExamSessionAction(sessionId: string): Promise<{ success: boolean; error?: string }> {
  const denied = await guardDashboardFormMutation();
  if (denied) return { success: false, error: denied.error };

  const admin = createServiceRoleClient();
  if (!admin) return { success: false, error: "Service role is not configured." };

  const { data: origSession, error: sErr } = await admin
    .from("exam_sessions")
    .select("*, exam_session_prices(*)")
    .eq("id", sessionId)
    .maybeSingle();

  if (sErr || !origSession) return { success: false, error: "Could not find original session." };

  const name = `${origSession.name} (Copy)`;
  const slug = slugifyName(name);

  const { data: newSession, error: insertError } = await admin
    .from("exam_sessions")
    .insert({ name, slug, status: "draft" })
    .select("id")
    .single();

  if (insertError || !newSession) {
    if (insertError?.code === "23505") return { success: false, error: "A session with that slug already exists." };
    console.error("[duplicateExamSessionAction]", insertError?.message);
    return { success: false, error: "Could not duplicate session." };
  }

  const prices = origSession.exam_session_prices ?? [];
  if (prices.length > 0) {
    const newPrices = prices.map((p: any) => ({
      session_id: newSession.id,
      class_key: p.class_key,
      price: p.price,
    }));

    const { error: pricesError } = await admin.from("exam_session_prices").insert(newPrices);
    if (pricesError) {
      console.error("[duplicateExamSessionAction] prices", pricesError.message);
      await admin.from("exam_sessions").delete().eq("id", newSession.id);
      return { success: false, error: "Could not copy pricing details." };
    }
  }

  revalidatePath("/dashboard/exams");
  revalidatePath("/exams");
  return { success: true };
}