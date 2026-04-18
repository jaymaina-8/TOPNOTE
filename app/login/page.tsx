import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import { LoginForm } from "./login-form";

export default async function LoginPage() {
  const supabase = await createClient();
  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      redirect("/dashboard");
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-100 px-4 text-neutral-900">
      <div className="w-full max-w-sm rounded-xl border border-neutral-300 bg-white p-5 shadow-sm">
        <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">TOPNOTE PUBLISHERS</p>
        <h1 className="mt-1 text-xl font-semibold tracking-tight">Internal sign in</h1>
        <p className="mt-2 text-sm text-neutral-600">Use the email and password for your account.</p>
        <LoginForm />
      </div>
    </div>
  );
}
