import { DeleteWithConfirm } from "@/components/admin/DeleteWithConfirm";
import { TestimonialForm } from "@/components/admin/TestimonialForm";
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
      <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Testimonials</h1>
      <p className="mt-1 text-sm text-neutral-600">Shown on the home page. Keep quotes concise and accurate.</p>

      {sp.error === "delete" ? (
        <div className="mt-6 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-950" role="alert">
          Could not delete that testimonial. Check the service role key and try again.
        </div>
      ) : null}

      {!admin ? (
        <div className="mt-8 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          Add <code className="rounded bg-amber-100 px-1">SUPABASE_SERVICE_ROLE_KEY</code> to manage testimonials.
        </div>
      ) : null}

      {admin ? (
        <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
          <section className="rounded-xl border border-neutral-300 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-neutral-900">Add testimonial</h2>
            <div className="mt-6">
              <TestimonialForm />
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-neutral-900">Existing</h2>
            {testimonials.length === 0 ? (
              <p className="mt-4 rounded-xl border border-dashed border-neutral-300 bg-neutral-50 px-4 py-8 text-center text-sm text-neutral-600">
                No testimonials yet.
              </p>
            ) : (
              <ul className="mt-4 space-y-3">
                {testimonials.map((t) => (
                  <li
                    key={t.id}
                    className="rounded-xl border border-neutral-300 bg-white p-4 shadow-sm"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-neutral-900">{t.name}</p>
                        {t.role ? <p className="text-xs text-neutral-500">{t.role}</p> : null}
                      </div>
                      <DeleteWithConfirm
                        action={deleteTestimonialAction}
                        id={t.id}
                        confirmMessage={`Remove testimonial from “${t.name}”?`}
                      >
                        <button
                          type="submit"
                          className="rounded-md border border-red-300 bg-white px-2 py-1 text-xs font-medium text-red-800 hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </DeleteWithConfirm>
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-neutral-700 whitespace-pre-wrap">{t.content}</p>
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
