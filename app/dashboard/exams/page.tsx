import { DashboardAlert, DashboardPageHeader } from "@/components/dashboard/DashboardUi";
import { ExamsPageClient } from "@/components/admin/ExamsPageClient";
import { listExamSessionsAdmin } from "@/lib/queries/exams";
import { createServiceRoleClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ blocked?: string; count?: string; error?: string }>;
};

export default async function DashboardExamsPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const admin = createServiceRoleClient();
  const sessions = admin ? await listExamSessionsAdmin() : [];

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Exams"
        description="Manage exam sessions and per-class pricing. Only one session can be active at a time — activating a session archives the previous active one."
      />

      {!admin ? (
        <DashboardAlert>
          Add <code className="rounded bg-amber-100 px-1">SUPABASE_SERVICE_ROLE_KEY</code> to manage exam sessions.
        </DashboardAlert>
      ) : null}

      {sp.blocked === "1" && sp.count ? (
        <DashboardAlert>
          Cannot delete: {sp.count} order(s) reference this session. Archive it instead.
        </DashboardAlert>
      ) : null}
      {sp.error === "forbidden_status" ? (
        <DashboardAlert tone="red">
          You do not have permission to change exam session status. Your signed-in email must be listed in
          <code className="ml-1 rounded bg-red-100 px-1">DASHBOARD_ALLOWED_EMAILS</code>.
        </DashboardAlert>
      ) : null}
      {sp.error === "forbidden_delete" ? (
        <DashboardAlert tone="red">
          You do not have permission to delete exam sessions. Your signed-in email must be listed in
          <code className="ml-1 rounded bg-red-100 px-1">DASHBOARD_ALLOWED_EMAILS</code>.
        </DashboardAlert>
      ) : null}
      {sp.error === "delete" ? <DashboardAlert tone="red">Could not delete that session. Try again.</DashboardAlert> : null}
      {sp.error === "status" ? <DashboardAlert tone="red">Could not update session status. Try again.</DashboardAlert> : null}
      {sp.error === "count" ? <DashboardAlert tone="red">Could not verify related orders. Try again.</DashboardAlert> : null}

      {admin && (
        <ExamsPageClient sessions={sessions} />
      )}
    </div>
  );
}
