/** Shared with `login.ts` (server action) and `login-form.tsx` (client). Not a server-actions module. */
export type LoginFormState = { error: string | null };

export const loginFormInitialState: LoginFormState = { error: null };
