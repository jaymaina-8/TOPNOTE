import Link from "next/link";

import { DeleteWithConfirm } from "@/components/admin/DeleteWithConfirm";
import { deleteProductAction } from "@/lib/actions/admin/products";
import { listProductsAdmin } from "@/lib/admin/products-data";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { formatKesPrice } from "@/lib/format";

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
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Products</h1>
          <p className="mt-1 text-sm text-neutral-600">Create, edit, or remove catalog products.</p>
        </div>
        <Link
          href="/dashboard/products/new"
          className="rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
        >
          New product
        </Link>
      </div>

      {!admin ? (
        <div className="mt-8 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          Add <code className="rounded bg-amber-100 px-1">SUPABASE_SERVICE_ROLE_KEY</code> to the server environment to
          manage products.
        </div>
      ) : null}

      {sp.error === "delete" ? (
        <div className="mt-6 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-950" role="alert">
          Could not delete that product. Try again.
        </div>
      ) : null}

      {admin && products.length === 0 ? (
        <p className="mt-8 rounded-xl border border-dashed border-neutral-300 bg-white px-4 py-8 text-center text-sm text-neutral-600">
          No products yet.{" "}
          <Link href="/dashboard/products/new" className="font-medium text-neutral-900 underline-offset-2 hover:underline">
            Create one
          </Link>
          .
        </p>
      ) : null}

      {admin && products.length > 0 ? (
        <div className="mt-8 overflow-x-auto rounded-xl border border-neutral-300 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-neutral-200 text-left text-sm">
            <thead className="bg-neutral-50 text-xs font-semibold uppercase tracking-wide text-neutral-600">
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
                  <td className="px-4 py-3 font-medium text-neutral-900">{p.name}</td>
                  <td className="px-4 py-3 text-neutral-600">
                    <code className="rounded bg-neutral-100 px-1 text-xs">{p.slug}</code>
                  </td>
                  <td className="px-4 py-3 text-neutral-700">{p.categories?.name ?? "—"}</td>
                  <td className="px-4 py-3 text-neutral-800">{formatKesPrice(p.price)}</td>
                  <td className="px-4 py-3 text-neutral-700">{p.is_featured ? "Yes" : "No"}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex flex-wrap justify-end gap-2">
                      <Link
                        href={`/dashboard/products/${p.id}/edit`}
                        className="rounded-md border border-neutral-300 bg-white px-2 py-1 text-xs font-medium text-neutral-800 hover:bg-neutral-100"
                      >
                        Edit
                      </Link>
                      <DeleteWithConfirm
                        action={deleteProductAction}
                        id={p.id}
                        confirmMessage={`Delete product “${p.name}”? This cannot be undone.`}
                        extraHidden={{ slug_hint: p.slug }}
                      >
                        <button
                          type="submit"
                          className="rounded-md border border-red-300 bg-white px-2 py-1 text-xs font-medium text-red-800 hover:bg-red-50"
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
      ) : null}
    </div>
  );
}
