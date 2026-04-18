import Link from "next/link";

/**
 * Rendered when `unauthorized()` runs (e.g. server actions without a valid Supabase session).
 */
export default function Unauthorized() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-100 px-4 text-center">
      <h1 className="text-xl font-semibold text-neutral-900">Unauthorized</h1>
      <p className="mt-2 max-w-md text-sm text-neutral-600">
        This action requires an active dashboard session. Sign in again to continue.
      </p>
      <Link
        href="/login"
        className="mt-6 text-sm font-medium text-neutral-800 underline-offset-2 hover:underline"
      >
        Sign in
      </Link>
    </div>
  );
}
