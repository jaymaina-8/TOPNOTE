import Link from "next/link";

import { CategoryForm } from "@/components/admin/CategoryForm";
import { DeleteWithConfirm } from "@/components/admin/DeleteWithConfirm";
import { DashboardAlert, DashboardEmptyState, DashboardPageHeader, DashboardPanel } from "@/components/dashboard/DashboardUi";
import { deleteCategoryAction } from "@/lib/actions/admin/categories";
import { countProductsInCategory, listCategoriesAdmin } from "@/lib/admin/categories-data";
import { createServiceRoleClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ blocked?: string; count?: string; error?: string }>;
};

export default async function DashboardCategoriesPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const admin = createServiceRoleClient();
  const categories = admin ? await listCategoriesAdmin() : [];

  return (
    <div>
      <DashboardPageHeader
        title="Categories"
        description="Organize products by type. Deleting a category is blocked while products still reference it."
      />

      {!admin ? (
        <DashboardAlert>
          Add <code className="rounded bg-amber-100 px-1">SUPABASE_SERVICE_ROLE_KEY</code> to manage categories.
        </DashboardAlert>
      ) : null}

      {sp.blocked === "1" && sp.count ? (
        <DashboardAlert>
          Cannot delete: {sp.count} product(s) still use this category. Reassign them in{" "}
          <Link href="/dashboard/products" className="font-bold underline">
            Products
          </Link>{" "}
          or remove those products first.
        </DashboardAlert>
      ) : null}

      {sp.error === "delete" ? <DashboardAlert tone="red">Could not delete that category. Try again.</DashboardAlert> : null}
      {sp.error === "count" ? <DashboardAlert tone="red">Could not verify related products. Try again.</DashboardAlert> : null}

      {admin ? (
        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.18fr)]">
          <DashboardPanel className="p-6">
            <h2 className="text-lg font-black text-neutral-950">New category</h2>
            <p className="mt-1 text-sm leading-relaxed text-neutral-600">Name, slug, and type for catalog grouping.</p>
            <div className="mt-6">
              <CategoryForm />
            </div>
          </DashboardPanel>

          <section>
            <div className="flex items-end justify-between gap-3">
              <div>
                <h2 className="text-lg font-black text-neutral-950">Existing categories</h2>
                <p className="mt-1 text-sm text-neutral-600">{categories.length} categories configured</p>
              </div>
            </div>
            {categories.length === 0 ? (
              <div className="mt-4">
                <DashboardEmptyState title="No categories yet" description="Create a category before adding catalog products." />
              </div>
            ) : (
              <ul className="mt-4 overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
                {await Promise.all(
                  categories.map(async (c) => {
                    const n = await countProductsInCategory(c.id);
                    return (
                      <li key={c.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-100 px-4 py-3 last:border-0">
                        <div className="min-w-0">
                          <p className="font-bold text-neutral-950">{c.name}</p>
                          <p className="mt-1 text-xs text-neutral-500">
                            <code className="rounded bg-neutral-100 px-1.5 py-0.5 font-semibold">{c.slug}</code>{" "}
                            <span className="mx-1">·</span>
                            {c.type}
                            {n !== null ? ` · ${n} product(s)` : ""}
                          </p>
                        </div>
                        <DeleteWithConfirm
                          action={deleteCategoryAction}
                          id={c.id}
                          confirmMessage={`Delete category "${c.name}"?`}
                        >
                          <button
                            type="submit"
                            className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-bold text-red-700 hover:bg-red-50"
                          >
                            Delete
                          </button>
                        </DeleteWithConfirm>
                      </li>
                    );
                  }),
                )}
              </ul>
            )}
          </section>
        </div>
      ) : null}
    </div>
  );
}
