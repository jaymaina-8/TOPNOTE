import Link from "next/link";

import { DeleteWithConfirm } from "@/components/admin/DeleteWithConfirm";
import {
  DashboardAlert,
  DashboardButton,
  DashboardEmptyState,
  DashboardPageHeader,
} from "@/components/dashboard/DashboardUi";
import { deleteProductAction } from "@/lib/actions/admin/products";
import { listProductsAdmin } from "@/lib/admin/products-data";
import { formatKesPrice } from "@/lib/format";
import { createServiceRoleClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function DashboardProductsPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const admin = createServiceRoleClient();
  const products = admin ? await listProductsAdmin() : [];

  return (
    <div>
      <DashboardPageHeader
        title="Products"
        description="Create, edit, feature, and remove catalog products. Keep names, prices, and category assignments ready for public browsing."
        actions={<DashboardButton href="/dashboard/products/new">New product</DashboardButton>}
      />

      {!admin ? (
        <DashboardAlert>
          Add <code className="rounded bg-amber-100 px-1">SUPABASE_SERVICE_ROLE_KEY</code> to the server environment to
          manage products.
        </DashboardAlert>
      ) : null}

      {sp.error === "delete" ? (
        <DashboardAlert tone="red">Could not delete that product. Try again.</DashboardAlert>
      ) : null}

      {admin && products.length === 0 ? (
        <div className="mt-8">
          <DashboardEmptyState
            title="No products yet"
            description="Create the first catalog item so it can appear in the public product grid."
            action={<DashboardButton href="/dashboard/products/new">Create product</DashboardButton>}
          />
        </div>
      ) : null}

      {admin && products.length > 0 ? (
        <div className="mt-8 overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-100 px-4 py-3">
            <p className="text-sm font-black text-neutral-950">{products.length} catalog items</p>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-neutral-500">Admin inventory</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-100 text-left text-sm">
              <thead className="bg-neutral-50 text-xs font-bold uppercase tracking-[0.12em] text-neutral-500">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Slug</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Price</th>
                  <th className="px-4 py-3">Featured</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-neutral-50/80">
                    <td className="max-w-[18rem] px-4 py-3 font-bold text-neutral-950">{p.name}</td>
                    <td className="px-4 py-3 text-neutral-600">
                      <code className="rounded bg-neutral-100 px-1.5 py-0.5 text-xs font-semibold">{p.slug}</code>
                    </td>
                    <td className="px-4 py-3 text-neutral-700">{p.categories?.name ?? "—"}</td>
                    <td className="px-4 py-3 font-semibold tabular-nums text-neutral-900">{formatKesPrice(p.price)}</td>
                    <td className="px-4 py-3">
                      <span className={p.is_featured ? "rounded-full bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-700" : "rounded-full bg-neutral-100 px-2 py-1 text-xs font-bold text-neutral-600"}>
                        {p.is_featured ? "Yes" : "No"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex flex-wrap justify-end gap-2">
                        <Link
                          href={`/dashboard/products/${p.id}/edit`}
                          className="rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-bold text-neutral-800 hover:bg-neutral-50"
                        >
                          Edit
                        </Link>
                        <DeleteWithConfirm
                          action={deleteProductAction}
                          id={p.id}
                          confirmMessage={`Delete product "${p.name}"? This cannot be undone.`}
                          extraHidden={{ slug_hint: p.slug }}
                        >
                          <button
                            type="submit"
                            className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-bold text-red-700 hover:bg-red-50"
                          >
                            Delete
                          </button>
                        </DeleteWithConfirm>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
}
