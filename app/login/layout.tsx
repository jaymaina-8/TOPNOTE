import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign in | TOPNOTE PUBLISHERS",
  robots: { index: false, follow: false },
};

/**
 * Internal dashboard login only. Users are created in the Supabase Auth dashboard (no public sign-up).
 */
export default function LoginLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
