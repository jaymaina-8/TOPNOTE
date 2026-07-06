"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import type { ExamSessionWithPrices, ExamSessionStatus } from "@/lib/exams/types";
import { formatKesPrice } from "@/lib/format";
import { getExamClassLabel } from "@/lib/exams/classes";
import { ExamSessionCreateForm } from "@/components/admin/ExamSessionCreateForm";
import { ExamSessionEditForm } from "@/components/admin/ExamSessionEditForm";
import { DeleteWithConfirm } from "@/components/admin/DeleteWithConfirm";
import {
  setExamSessionStatusAction,
  deleteExamSessionAction,
  duplicateExamSessionAction,
} from "@/lib/actions/admin/exams";

interface ExamsPageClientProps {
  sessions: ExamSessionWithPrices[];
}

export function ExamsPageClient({ sessions }: ExamsPageClientProps) {
  const router = useRouter();
  const [editingSession, setEditingSession] = useState<ExamSessionWithPrices | null>(null);
  const [duplicatePending, setDuplicatePending] = useState(false);

  const statusBadge = (s: ExamSessionStatus) => {
    const classes = {
      active: "bg-emerald-50 text-emerald-700 border-emerald-100",
      archived: "bg-neutral-50 text-neutral-600 border-neutral-100",
      draft: "bg-amber-50 text-amber-700 border-amber-100",
    }[s];

    return (
      <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase", classes)}>
        {s}
      </span>
    );
  };

  const handleDuplicate = async (id: string) => {
    setDuplicatePending(true);
    const res = await duplicateExamSessionAction(id);
    setDuplicatePending(false);
    if (res.success) {
      router.refresh();
    } else {
      alert(res.error ?? "Failed to duplicate session.");
    }
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,0.92fr)_minmax(0,1.18fr)]">
      {/* Creation form (left) */}
      <div className="rounded-xl border border-[#ECECEC] bg-white p-6 shadow-sm self-start space-y-4">
        <div>
          <h2 className="text-base font-bold text-[#111111]">New Exam Session</h2>
          <p className="text-xs text-[#888888] mt-0.5">
            Create a new session with class pricing. Activate it when ready for public ordering.
          </p>
        </div>
        <ExamSessionCreateForm />
      </div>

      {/* Listing Cards (right) */}
      <div className="space-y-4">
        <div>
          <h2 className="text-base font-bold text-[#111111]">Existing Exam Sessions</h2>
          <p className="text-xs text-[#888888] mt-0.5">{sessions.length} session(s) configured.</p>
        </div>

        {sessions.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#ECECEC] bg-white py-14 text-center">
            <h3 className="text-sm font-bold text-[#111111]">No exam sessions yet</h3>
            <p className="text-xs text-[#888888] mt-1">Create a session above and activate it to start accepting public orders.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2">
            {sessions.map((session) => (
              <div key={session.id} className="rounded-xl border border-[#ECECEC] bg-white p-5 shadow-sm flex flex-col justify-between space-y-4 hover:shadow-md transition">
                {/* Header info */}
                <div className="space-y-2">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <h3 className="text-sm font-bold text-[#111111]">{session.name}</h3>
                    {statusBadge(session.status)}
                  </div>
                  <p className="text-[10px] text-[#888888] font-mono leading-none">{session.slug}</p>
                </div>

                {/* Class pricing overview */}
                <div className="rounded-lg bg-[#FAFAFA] border border-[#ECECEC] p-3">
                  <p className="text-[9px] font-black uppercase tracking-wider text-[#888888] border-b border-[#ECECEC] pb-1.5 mb-2">Class Pricing</p>
                  <ul className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs text-[#555555]">
                    {session.prices.map((priceRow) => (
                      <li key={priceRow.id} className="flex justify-between">
                        <span className="font-semibold text-neutral-500">{getExamClassLabel(priceRow.class_key)}</span>
                        <span className="font-bold text-[#111111] tabular-nums">{formatKesPrice(Number(priceRow.price))}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Card Actions Footer */}
                <div className="flex flex-wrap items-center gap-1.5 border-t border-[#FAFAFA] pt-3.5 mt-auto">
                  {/* Status mutations */}
                  {session.status !== "active" && (
                    <form action={setExamSessionStatusAction}>
                      <input type="hidden" name="session_id" value={session.id} />
                      <input type="hidden" name="next_status" value="active" />
                      <button
                        type="submit"
                        className="rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.2 text-xs font-bold text-emerald-700 hover:bg-emerald-100"
                      >
                        Activate
                      </button>
                    </form>
                  )}

                  {session.status !== "archived" && (
                    <form action={setExamSessionStatusAction}>
                      <input type="hidden" name="session_id" value={session.id} />
                      <input type="hidden" name="next_status" value="archived" />
                      <button
                        type="submit"
                        className="rounded-lg border border-[#ECECEC] bg-white px-2.5 py-1.2 text-xs font-bold text-[#555555] hover:bg-[#FAFAFA]"
                      >
                        Archive
                      </button>
                    </form>
                  )}

                  {/* Duplicate */}
                  <button
                    onClick={() => handleDuplicate(session.id)}
                    disabled={duplicatePending}
                    className="rounded-lg border border-[#ECECEC] bg-white px-2.5 py-1.2 text-xs font-bold text-[#111111] hover:bg-[#FAFAFA] disabled:opacity-50"
                  >
                    Duplicate
                  </button>

                  {/* Edit triggering side drawer */}
                  <button
                    onClick={() => setEditingSession(session)}
                    className="rounded-lg border border-[#ECECEC] bg-white px-2.5 py-1.2 text-xs font-bold text-[#111111] hover:bg-[#FAFAFA]"
                  >
                    Edit Prices
                  </button>

                  {/* Deletion action */}
                  <DeleteWithConfirm
                    action={deleteExamSessionAction}
                    id={session.id}
                    idFieldName="session_id"
                    confirmMessage={`Delete exam session "${session.name}"?`}
                  >
                    <button
                      type="submit"
                      className="rounded-lg border border-red-200 bg-white px-2.5 py-1.2 text-xs font-bold text-red-600 hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </DeleteWithConfirm>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* EDIT DRAWER WINDOW */}
      {editingSession && (
        <>
          {/* Lock screen click closer */}
          <div
            onClick={() => setEditingSession(null)}
            className="fixed inset-0 z-40 bg-black/35 backdrop-blur-[1px] transition-opacity"
          />

          {/* edit drawer body */}
          <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white shadow-2xl border-l border-[#ECECEC] flex flex-col animate-in slide-in-from-right duration-250 overflow-hidden">
            <div className="flex h-14 items-center justify-between border-b border-[#ECECEC] px-5 bg-[#FAFAFA]/50 shrink-0">
              <div>
                <h3 className="text-sm font-black text-[#111111] uppercase tracking-tight">Edit Session Prices</h3>
                <p className="text-[10px] font-bold text-[#888888] mt-0.5">{editingSession.name}</p>
              </div>
              <button
                onClick={() => setEditingSession(null)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-[#888888] hover:bg-neutral-100 hover:text-[#111111] focus:outline-none"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
              <ExamSessionEditForm session={editingSession} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
