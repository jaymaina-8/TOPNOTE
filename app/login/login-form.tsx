"use client";

import { useActionState } from "react";

import { loginAction } from "@/lib/actions/auth/login";
import { loginFormInitialState } from "@/lib/actions/auth/login-form-state";

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, loginFormInitialState);

  return (
    <form action={formAction} className="mt-7 space-y-5">
      <div>
        <label htmlFor="email" className="block text-sm font-bold text-neutral-900">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          required
          placeholder="admin@example.com"
          className="mt-1.5 w-full rounded-lg border border-neutral-200 bg-white px-3 py-3 text-sm text-neutral-900 shadow-sm transition placeholder:text-neutral-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
        />
      </div>
      <div>
        <label htmlFor="password" className="block text-sm font-bold text-neutral-900">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="mt-1.5 w-full rounded-lg border border-neutral-200 bg-white px-3 py-3 text-sm text-neutral-900 shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
        />
      </div>
      {state.error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-900" role="alert">
          {state.error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-neutral-950 px-4 text-sm font-bold text-white transition-colors hover:bg-neutral-800 disabled:opacity-60"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
