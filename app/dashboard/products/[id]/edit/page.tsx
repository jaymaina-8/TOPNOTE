import Link from "next/link";
import { notFound } from "next/navigation";

import { ProductForm } from "@/components/admin/ProductForm";
import { updateProductAction } from "@/lib/actions/admin/products";
import { listCategoriesAdmin } from "@/lib/admin/categories-data";
import { getProductByIdAdmin } from "@/lib/admin/products-data";
import { UUID_RE } from "@/lib/admin/validation";
import { createServiceRoleClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditProductPage({ params }: PageProps) {
  const { id } = await params;
  if (!UUID_RE.test(id)) notFound();

  const admin = createServiceRoleClient();
  if (!admin) {
    return (
      <div>
        <p className="text-sm text-neutral-600">
          <Link href="/dashboard/products" className="font-medium text-neutral-800 underline-offset-2 hover:underline">
            ← Products
          </Link>
        </p>
        <h1 className="mt-4 text-2xl font-bold tracking-tight text-neutral-900">Edit product</h1>
        <div className="mt-8 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          Add <code className="rounded bg-amber-100 px-1">SUPABASE_SERVICE_ROLE_KEY</code> to edit products.
        </div>
      </div>
    );
  }

  const [product, categories] = await Promise.all([getProductByIdAdmin(id), listCategoriesAdmin()]);
  if (!product) notFound();

  return (
    <div>
      <p className="text-sm text-neutral-600">
        <Link href="/dashboard/products" className="font-medium text-neutral-800 underline-offset-2 hover:underline">
          ← Products
        </Link>
      </p>
      <h1 className="mt-4 text-2xl font-bold tracking-tight text-neutral-900">Edit product</h1>
      <p className="mt-1 text-sm text-neutral-600">
        Public URL:{" "}
        <Link href={`/products/${product.slug}`} className="text-neutral-900 underline-offset-2 hover:underline">
          /products/{product.slug}
        </Link>
      </p>

      <div className="mt-8 rounded-xl border border-neutral-300 bg-white p-6 shadow-sm">
        <ProductForm categories={categories} product={product} action={updateProductAction} />
      </div>
    </div>
  );
}
