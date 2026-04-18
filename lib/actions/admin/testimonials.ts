"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { parseOptionalString, parseRequiredString, UUID_RE } from "@/lib/admin/validation";
import type { TestimonialFormState } from "@/lib/admin/action-form-state";
import { guardDashboardFormMutation, guardDashboardVoidMutation } from "@/lib/auth/dashboard-access";
import { createServiceRoleClient } from "@/lib/supabase/admin";

export async function createTestimonialAction(
  _prev: TestimonialFormState,
  formData: FormData,
): Promise<TestimonialFormState> {
  const denied = await guardDashboardFormMutation();
  if (denied) return denied;
  const admin = createServiceRoleClient();
  if (!admin) return { error: "Service role is not configured on this server." };

  const name = parseRequiredString(formData, "name");
  const role = parseOptionalString(formData, "role");
  const content = parseRequiredString(formData, "content");

  if (!name) return { error: "Name is required." };
  if (!content) return { error: "Content is required." };

  const { error } = await admin.from("testimonials").insert({ name, role, content });

  if (error) {
    console.error("[createTestimonialAction]", error.message);
    return { error: "Could not create testimonial." };
  }

  revalidatePath("/dashboard/testimonials");
  revalidatePath("/");
  redirect("/dashboard/testimonials");
}

export async function deleteTestimonialAction(formData: FormData): Promise<void> {
  const allowed = await guardDashboardVoidMutation();
  if (!allowed) return;
  const admin = createServiceRoleClient();
  if (!admin) {
    redirect("/dashboard/testimonials?error=delete");
  }

  const id = parseRequiredString(formData, "id");
  if (!id || !UUID_RE.test(id)) return;

  const { error } = await admin.from("testimonials").delete().eq("id", id);
  if (error) {
    console.error("[deleteTestimonialAction]", error.message);
    return;
  }

  revalidatePath("/dashboard/testimonials");
  revalidatePath("/");
  redirect("/dashboard/testimonials");
}
