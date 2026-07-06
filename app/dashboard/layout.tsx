import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AccessDenied } from "@/components/dashboard/AccessDenied";
import { NotificationProvider } from "@/components/admin/NotificationProvider";
import { DashboardLayoutClient } from "@/components/admin/DashboardLayoutClient";
import { getDashboardAuth } from "@/lib/auth/dashboard-access";

export const metadata: Metadata = {
  title: "Dashboard | TOPNOTE PUBLISHERS",
  robots: { index: false, follow: false },
};

/**
 * Internal dashboard chrome. Allowlist and full auth checks run here; middleware only refreshes the session
 * and redirects unauthenticated users away from `/dashboard/*`.
 */
export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const auth = await getDashboardAuth();

  if (auth.ok === false && auth.reason === "unauthenticated") {
    redirect("/login");
  }

  if (auth.ok === false && auth.reason === "forbidden") {
    return (
      <div className="min-h-screen bg-neutral-100 text-neutral-900">
        <AccessDenied signedInEmail={auth.email} />
      </div>
    );
  }

  return (
    <NotificationProvider>
      <DashboardLayoutClient userEmail={auth.email}>
        {children}
      </DashboardLayoutClient>
    </NotificationProvider>
  );
}

