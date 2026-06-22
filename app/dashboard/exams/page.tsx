import Link from "next/link";

import { DeleteWithConfirm } from "@/components/admin/DeleteWithConfirm";
import { ExamSessionCreateForm } from "@/components/admin/ExamSessionCreateForm";
import { ExamSessionEditForm } from "@/components/admin/ExamSessionEditForm";
import {
  DashboardAlert,
  DashboardEmptyState,
  DashboardPageHeader,
  DashboardPanel,
} from "@/components/dashboard/DashboardUi";
import { deleteExamSessionAction, setExamSessionStatusAction } from "@/lib/actions/admin/exams";
import { listExamSessionsAdmin } from "@/lib/queries/exams";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import type { ExamSessionStatus } from "@/lib/exams/types";
import { getExamClassLabel } from "@/lib/exams/classes";
import { formatKesPrice } from "@/lib/format";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ blocked?: string; count?: string; error?: string }>;
};

function statusBadgeClass(status: ExamSessionStatus): string {
  switch (status) {
    case "active":
      return "border-emerald-200 bg-emerald-50 text-emerald-900";
    case "archived":
      return "border-neutral-200 bg-neutral-100 text-neutral-700";
    default:
      return "border-amber-200 bg-amber-50 text-amber-900";
  }
}

export default async function DashboardExamsPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const admin = createServiceRoleClient();
  const sessions = admin ? await listExamSessionsAdmin() : [];

  return (
    <div>
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

      {admin ? (
        <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,0.92fr)_minmax(0,1.18fr)]">
          <DashboardPanel className="p-6">
            <h2 className="text-lg font-black text-neutral-950">New exam session</h2>
            <p className="mt-1 text-sm leading-relaxed text-neutral-600">
              Create a session with prices for all classes. Activate it when ready for public ordering.
            </p>
            <div className="mt-6">
              <ExamSessionCreateForm />
            </div>
          </DashboardPanel>

          <section className="space-y-4">
            <div>
              <h2 className="text-lg font-black text-neutral-950">Exam sessions</h2>
              <p className="mt-1 text-sm text-neutral-600">{sessions.length} session(s) configured</p>
            </div>

            {sessions.length === 0 ? (
              <DashboardEmptyState
                title="No exam sessions yet"
                description="Create a session and activate it to enable the public exam ordering page."
              />
            ) : (
              <ul className="space-y-4">
                {sessions.map((session) => (
                  <li key={session.id}>
                    <DashboardPanel className="overflow-hidden">
                      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-neutral-100 px-4 py-4">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-base font-black text-neutral-950">{session.name}</h3>
                            <span
                              className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-bold ${statusBadgeClass(session.status)}`}
                            >
                              {session.status}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-neutral-500">
                            <code className="rounded bg-neutral-100 px-1.5 py-0.5 font-semibold">{session.slug}</code>
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {session.status !== "active" ? (
                            <form action={setExamSessionStatusAction}>
                              <input type="hidden" name="session_id" value={session.id} />
                              <input type="hidden" name="next_status" value="active" />
                              <button
                                type="submit"
                                className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-800 hover:bg-emerald-100"
                              >
                                Activate
                              </button>
                            </form>
                          ) : null}
                          {session.status !== "archived" ? (
                            <form action={setExamSessionStatusAction}>
                              <input type="hidden" name="session_id" value={session.id} />
                              <input type="hidden" name="next_status" value="archived" />
                              <button
                                type="submit"
                                className="rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-bold text-neutral-700 hover:bg-neutral-50"
                              >
                                Archive
                              </button>
                            </form>
                          ) : null}
                          <DeleteWithConfirm
                            action={deleteExamSessionAction}
                            id={session.id}
                            idFieldName="session_id"
                            confirmMessage={`Delete session "${session.name}"?`}
                          >
                            <button
                              type="submit"
                              className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-bold text-red-700 hover:bg-red-50"
                            >
                              Delete
                            </button>
                          </DeleteWithConfirm>
                        </div>
                      </div>

                      <div className="grid gap-4 px-4 py-4 lg:grid-cols-2">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-[0.12em] text-neutral-500">Current prices</p>
                          <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                            {session.prices.map((row) => (
                              <li key={row.id} className="flex items-center justify-between gap-2">
                                <span className="text-neutral-700">{getExamClassLabel(row.class_key)}</span>
                                <span className="font-bold text-neutral-950">{formatKesPrice(Number(row.price))}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <p className="text-xs font-bold uppercase tracking-[0.12em] text-neutral-500">Edit session</p>
                          <div className="mt-3">
                            <ExamSessionEditForm session={session} />
                          </div>
                        </div>
                      </div>
                    </DashboardPanel>
                  </li>
                ))}
              </ul>
            )}

            <p className="text-sm text-neutral-600">
              Public ordering page:{" "}
              <Link href="/exams" className="font-bold text-primary underline-offset-2 hover:underline">
                /exams
              </Link>
            </p>
          </section>
        </div>
      ) : null}
    </div>
  );
}
