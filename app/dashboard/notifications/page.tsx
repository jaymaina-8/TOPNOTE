import type { Metadata } from "next";
import { NotificationsPageClient } from "@/components/admin/notifications/NotificationsPageClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Notifications | TOPNOTE Dashboard",
  description: "Stay updated with exam orders, inquiries, payments and system events.",
  robots: { index: false, follow: false },
};

export default function NotificationsPage() {
  return <NotificationsPageClient />;
}
