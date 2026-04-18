import Link from "next/link";

import { CategoryForm } from "@/components/admin/CategoryForm";
import { DeleteWithConfirm } from "@/components/admin/DeleteWithConfirm";
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
      <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Categories</h1>
      <p className="mt-1 text-sm text-neutral-600">
        Used by products. Deleting a category is blocked while products still reference it (reassign or remove products
        first).
      </p>

      {!admin ? (
        <div className="mt-8 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          Add <code className="rounded bg-amber-100 px-1">SUPABASE_SERVICE_ROLE_KEY</code> to manage categories.
        </div>
      ) : null}

      {sp.blocked === "1" && sp.count ? (
        <div className="mt-6 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950" role="alert">
          Cannot delete: {sp.count} product(s) still use this category. Reassign them in{" "}
          <Link href="/dashboard/products" className="font-medium underline">
            Products
          </Link>{" "}
          or remove those products first.
        </div>
      ) : null}

      {sp.error === "delete" ? (
        <div className="mt-6 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-950" role="alert">
          Could not delete that category. Try again.
        </div>
      ) : null}

      {sp.error === "count" ? (
        <div className="mt-6 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-950" role="alert">
          Could not verify related products. Try again.
        </div>
      ) : null}

      {admin ? (
        <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
          <section className="rounded-xl border border-neutral-300 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-neutral-900">New category</h2>
            <p className="mt-1 text-sm text-neutral-600">Name, slug, and type (books, exams, stationery, lab).</p>
            <div className="mt-6">
              <CategoryForm />
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-neutral-900">Existing</h2>
            {categories.length === 0 ? (
              <p className="mt-4 rounded-xl border border-dashed border-neutral-300 bg-neutral-50 px-4 py-8 text-center text-sm text-neutral-600">
                No categories yet.
              </p>
            ) : (
              <ul className="mt-4 divide-y divide-neutral-200 rounded-xl border border-neutral-300 bg-white shadow-sm">
                {await Promise.all(
                  categories.map(async (c) => {
                    const n = await countProductsInCategory(c.id);
                    return (
                      <li key={c.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                        <div>
                          <p className="font-medium text-neutral-900">{c.name}</p>
                          <p className="text-xs text-neutral-500">
                            <code className="rounded bg-neutral-100 px-1">{c.slug}</code> · {c.type}
                            {n !== null ? ` · ${n} product(s)` : ""}
                          </p>
                        </div>
                        <DeleteWithConfirm
                          action={deleteCategoryAction}
                          id={c.id}
                          confirmMessage={`Delete category “${c.name}”?`}
                        >
                          <button
                            type="submit"
                            className="rounded-md border border-red-300 bg-white px-2 py-1 text-xs font-medium text-red-800 hover:bg-red-50"
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
