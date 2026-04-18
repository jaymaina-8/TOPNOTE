import Link from "next/link";

import { ProductForm } from "@/components/admin/ProductForm";
import { createProductAction } from "@/lib/actions/admin/products";
import { listCategoriesAdmin } from "@/lib/admin/categories-data";
import { createServiceRoleClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const admin = createServiceRoleClient();
  const categories = admin ? await listCategoriesAdmin() : [];

  return (
    <div>
      <p className="text-sm text-neutral-600">
        <Link href="/dashboard/products" className="font-medium text-neutral-800 underline-offset-2 hover:underline">
          ← Products
        </Link>
      </p>
      <h1 className="mt-4 text-2xl font-bold tracking-tight text-neutral-900">New product</h1>

      {!admin ? (
        <div className="mt-8 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          Add <code className="rounded bg-amber-100 px-1">SUPABASE_SERVICE_ROLE_KEY</code> to create products.
        </div>
      ) : null}

      {admin && categories.length === 0 ? (
        <div className="mt-8 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          Create a{" "}
          <Link href="/dashboard/categories" className="font-medium underline">
            category
          </Link>{" "}
          first.
        </div>
      ) : null}

      {admin && categories.length > 0 ? (
        <div className="mt-8 rounded-xl border border-neutral-300 bg-white p-6 shadow-sm">
          <ProductForm categories={categories} action={createProductAction} />
        </div>
      ) : null}
    </div>
  );
}
