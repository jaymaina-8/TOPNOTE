import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SettingsPageClient } from "@/components/admin/SettingsPageClient";
import { getDashboardAuth } from "@/lib/auth/dashboard-access";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Settings | TOPNOTE Dashboard",
  description: "Configure your internal dashboard preferences.",
  robots: { index: false, follow: false },
};

export default async function DashboardSettingsPage() {
  const auth = await getDashboardAuth();

  if (auth.ok === false && auth.reason === "unauthenticated") {
    redirect("/login");
  }

  return <SettingsPageClient userEmail={auth.email} />;
}
