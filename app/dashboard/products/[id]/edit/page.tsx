import Link from "next/link";
import { notFound } from "next/navigation";

import { ProductForm } from "@/components/admin/ProductForm";
import { DashboardAlert, DashboardPageHeader, DashboardPanel } from "@/components/dashboard/DashboardUi";
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
        <Link href="/dashboard/products" className="text-sm font-bold text-neutral-600 underline-offset-4 hover:text-neutral-950 hover:underline">
          ← Products
        </Link>
        <div className="mt-4">
          <DashboardPageHeader title="Edit product" />
        </div>
        <DashboardAlert>
          Add <code className="rounded bg-amber-100 px-1">SUPABASE_SERVICE_ROLE_KEY</code> to edit products.
        </DashboardAlert>
      </div>
    );
  }

  const [product, categories] = await Promise.all([getProductByIdAdmin(id), listCategoriesAdmin()]);
  if (!product) notFound();

  return (
    <div>
      <Link href="/dashboard/products" className="text-sm font-bold text-neutral-600 underline-offset-4 hover:text-neutral-950 hover:underline">
        ← Products
      </Link>
      <div className="mt-4">
        <DashboardPageHeader
          title="Edit product"
          description={
            <>
              Public URL:{" "}
              <Link href={`/products/${product.slug}`} className="font-bold text-neutral-900 underline-offset-4 hover:underline">
                /products/{product.slug}
              </Link>
            </>
          }
        />
      </div>

      <DashboardPanel className="mt-8 p-6">
        <ProductForm categories={categories} product={product} action={updateProductAction} />
      </DashboardPanel>
    </div>
  );
}
