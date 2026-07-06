import { DashboardAlert, DashboardPageHeader } from "@/components/dashboard/DashboardUi";
import { ProductsGridClient } from "@/components/admin/ProductsGridClient";
import { listProductsAdmin } from "@/lib/admin/products-data";
import { listCategoriesAdmin } from "@/lib/admin/categories-data";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import Link from "next/link";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function DashboardProductsPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const admin = createServiceRoleClient();

  // Load products and categories in parallel
  const [products, categories] = admin
    ? await Promise.all([listProductsAdmin(), listCategoriesAdmin()])
    : [[], []];

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Products"
        description="Create, edit, feature, and remove catalog products. Keep names, prices, and category assignments ready for public browsing."
        actions={
          <Link
            href="/dashboard/products/new"
            className="inline-flex min-h-10 items-center justify-center rounded-lg bg-[#E31B23] px-4 text-xs font-bold text-white shadow-sm hover:bg-[#C1141C] transition focus-visible:outline-none"
          >
            New Product
          </Link>
        }
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

      {admin && (
        <ProductsGridClient initialProducts={products} categories={categories} />
      )}
    </div>
  );
}
