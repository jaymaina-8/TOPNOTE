import { signOutAction } from "@/lib/auth/sign-out";

type Props = {
  /** Helps verify the session email matches `DASHBOARD_ALLOWED_EMAILS` on the server. */
  signedInEmail?: string | null;
};

export function AccessDenied({ signedInEmail }: Props) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-16 text-center">
      <h1 className="text-xl font-semibold text-neutral-900">You do not have access</h1>
      <p className="mt-2 max-w-md text-sm text-neutral-600">
        Your account is signed in but is not authorized to use this dashboard. If you need access, ask an administrator
        to add your email to the allowed list.
      </p>
      {signedInEmail ? (
        <p className="mt-3 max-w-md rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-left text-xs text-neutral-700">
          <span className="font-medium text-neutral-800">Signed in as:</span> {signedInEmail}
          <span className="mt-1 block text-neutral-600">
            This address must match an entry in the server allowlist (case-insensitive). Check your Supabase user email
            matches exactly, then restart the dev server after changing <code className="rounded bg-neutral-200 px-1">.env.local</code>.
          </span>
        </p>
      ) : null}
      <form action={signOutAction} className="mt-6">
        <button
          type="submit"
          className="rounded-md border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-900 shadow-sm hover:bg-neutral-50"
        >
          Sign out
        </button>
      </form>
    </div>
  );
}
