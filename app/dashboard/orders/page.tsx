import { DashboardAlert, DashboardPageHeader } from "@/components/dashboard/DashboardUi";
import { OrdersGridClient } from "@/components/admin/OrdersGridClient";
import { getExamOrders, listExamSessionsAdmin } from "@/lib/queries/exams";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function DashboardOrdersPage({ searchParams }: PageProps) {
  const sp = await searchParams;

  // Parallel fetch orders and sessions
  const [ordersRes, sessionsRes] = await Promise.all([
    getExamOrders(),
    listExamSessionsAdmin(),
  ]);

  const orders = ordersRes.ok ? ordersRes.orders : [];
  const sessions = (sessionsRes ?? []).map((s) => ({
    id: s.id,
    name: s.name,
  }));

  return (
    <div className="space-y-6">
      {sp.error === "status" ? (
        <DashboardAlert tone="red">Could not update order status. Try again.</DashboardAlert>
      ) : null}
      {sp.error === "delete" ? (
        <DashboardAlert tone="red">Could not delete that order. Try again.</DashboardAlert>
      ) : null}

      {ordersRes.ok === false && ordersRes.reason === "service_role_unconfigured" ? (
        <DashboardAlert>
          Add <code className="rounded bg-amber-100 px-1">SUPABASE_SERVICE_ROLE_KEY</code> to manage exam orders.
        </DashboardAlert>
      ) : null}

      {ordersRes.ok === false && ordersRes.reason === "query_failed" ? (
        <DashboardAlert tone="red">
          Could not load orders. Run the exam ordering migration if tables are missing.
        </DashboardAlert>
      ) : null}

      {ordersRes.ok && (
        <OrdersGridClient initialOrders={orders} sessions={sessions} />
      )}
    </div>
  );
}
