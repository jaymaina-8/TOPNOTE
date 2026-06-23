import type { Metadata } from "next";

import { ExamOrderExperience } from "@/components/exams/exam-order-experience";
import { Container } from "@/components/ui/Container";
import { PageIntro } from "@/components/ui/PageIntro";
import { Section } from "@/components/ui/Section";
import { getActiveExamSessionWithStatus } from "@/lib/queries/exams";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Exam Ordering",
  description:
    "Order TopNote examinations for your school, institution, or bookshop. View current prices, enter quantities, and submit your order via WhatsApp.",
};

export default async function ExamsPage() {
  const { session, error } = await getActiveExamSessionWithStatus();

  return (
    <>
      <Section surface="muted" className="pb-10 md:pb-12">
        <Container>
          <PageIntro
            title="TopNote Examination Centre"
            description="Order TopNote examinations for your school, institution, or bookshop."
          />
          {session ? (
            <p className="mx-auto mt-4 max-w-2xl text-center text-sm font-semibold text-primary">
              Active session: {session.name}
            </p>
          ) : null}
        </Container>
      </Section>

      <Section surface="canvas" className="pt-2 pb-16 md:pt-4 md:pb-20">
        <Container>
          {error ? (
            <div className="mx-auto max-w-2xl rounded-3xl border border-red-200 bg-red-50 px-6 py-10 text-center shadow-[var(--shadow-sm)]">
              <h2 className="text-lg font-black text-red-950">Exam ordering is temporarily unavailable</h2>
              <p className="mt-3 text-sm leading-relaxed text-red-900">
                We could not load the active exam session right now. Please refresh the page in a moment or contact
                TopNote Publishers on WhatsApp.
              </p>
            </div>
          ) : !session ? (
            <div className="mx-auto max-w-2xl rounded-3xl border border-amber-200 bg-amber-50 px-6 py-10 text-center shadow-[var(--shadow-sm)]">
              <h2 className="text-lg font-black text-amber-950">Exam ordering is not open yet</h2>
              <p className="mt-3 text-sm leading-relaxed text-amber-900">
                There is no active exam session at the moment. Please contact TopNote Publishers on WhatsApp for
                assistance or check back soon.
              </p>
            </div>
          ) : (
            <ExamOrderExperience session={session} />
          )}
        </Container>
      </Section>
    </>
  );
}
