import { DeleteWithConfirm } from "@/components/admin/DeleteWithConfirm";
import { TestimonialForm } from "@/components/admin/TestimonialForm";
import { DashboardAlert, DashboardEmptyState, DashboardPageHeader, DashboardPanel } from "@/components/dashboard/DashboardUi";
import { deleteTestimonialAction } from "@/lib/actions/admin/testimonials";
import { listTestimonialsAdmin } from "@/lib/admin/testimonials-data";
import { createServiceRoleClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function DashboardTestimonialsPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const admin = createServiceRoleClient();
  const testimonials = admin ? await listTestimonialsAdmin() : [];

  return (
    <div>
      <DashboardPageHeader
        title="Testimonials"
        description="Manage the customer quotes shown on the home page. Keep entries concise, specific, and accurate."
      />

      {sp.error === "delete" ? (
        <DashboardAlert tone="red">Could not delete that testimonial. Check the service role key and try again.</DashboardAlert>
      ) : null}

      {!admin ? (
        <DashboardAlert>
          Add <code className="rounded bg-amber-100 px-1">SUPABASE_SERVICE_ROLE_KEY</code> to manage testimonials.
        </DashboardAlert>
      ) : null}

      {admin ? (
        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.18fr)]">
          <DashboardPanel className="p-6">
            <h2 className="text-lg font-black text-neutral-950">Add testimonial</h2>
            <p className="mt-1 text-sm leading-relaxed text-neutral-600">Add a name, optional role, and the quote text.</p>
            <div className="mt-6">
              <TestimonialForm />
            </div>
          </DashboardPanel>

          <section>
            <h2 className="text-lg font-black text-neutral-950">Existing testimonials</h2>
            <p className="mt-1 text-sm text-neutral-600">{testimonials.length} entries configured</p>
            {testimonials.length === 0 ? (
              <div className="mt-4">
                <DashboardEmptyState title="No testimonials yet" description="Add a quote to populate the public home page." />
              </div>
            ) : (
              <ul className="mt-4 space-y-3">
                {testimonials.map((t) => (
                  <li key={t.id} className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-bold text-neutral-950">{t.name}</p>
                        {t.role ? <p className="text-xs font-semibold text-neutral-500">{t.role}</p> : null}
                      </div>
                      <DeleteWithConfirm
                        action={deleteTestimonialAction}
                        id={t.id}
                        confirmMessage={`Remove testimonial from "${t.name}"?`}
                      >
                        <button
                          type="submit"
                          className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-bold text-red-700 hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </DeleteWithConfirm>
                    </div>
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-neutral-700">{t.content}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      ) : null}
    </div>
  );
}
