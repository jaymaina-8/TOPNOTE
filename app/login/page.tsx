import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { LOGO_SRC } from "@/lib/site";

import { LoginForm } from "./login-form";
import Image from "next/image";

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
    <div className="flex min-h-screen items-center justify-center bg-[#f6f7f9] px-4 py-10 text-neutral-900">
      <div className="w-full max-w-[58rem] overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.08)]">
        <div className="grid lg:grid-cols-[0.92fr_1.08fr]">
          <section className="border-b border-neutral-200 bg-neutral-950 p-6 text-white lg:border-b-0 lg:border-r lg:p-8">
            <div className="flex items-center gap-3">
              <span className="grid h-12 w-12 place-items-center rounded-xl bg-white">
                <Image src={LOGO_SRC} alt="" width={72} height={72} className="h-9 w-9 object-contain" priority />
              </span>
              <div>
                <p className="text-sm font-black leading-tight">TOPNOTE PUBLISHERS</p>
                <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/55">Internal</p>
              </div>
            </div>

            <div className="mt-12 max-w-sm lg:mt-20">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Dashboard access</p>
              <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Manage the catalog with confidence.</h1>
              <p className="mt-4 text-sm leading-relaxed text-white/68">
                Sign in to update products, review inquiries, and track conversion activity for TOPNOTE operations.
              </p>
            </div>

            <div className="mt-8 grid gap-2 text-sm text-white/72">
              <p className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">Server-side admin writes only</p>
              <p className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">No public account creation</p>
            </div>
          </section>

          <section className="p-6 sm:p-8 lg:p-10">
            <div className="mx-auto max-w-sm">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Secure sign in</p>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-neutral-950">Welcome back</h2>
              <p className="mt-2 text-sm leading-relaxed text-neutral-600">Use the email and password for your internal account.</p>
              <LoginForm />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
