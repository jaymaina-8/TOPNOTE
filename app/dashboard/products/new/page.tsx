import Link from "next/link";

import { ProductForm } from "@/components/admin/ProductForm";
import { DashboardAlert, DashboardPageHeader, DashboardPanel } from "@/components/dashboard/DashboardUi";
import { createProductAction } from "@/lib/actions/admin/products";
import { listBookSubcategoriesAdmin } from "@/lib/admin/book-subcategories-data";
import { listCategoriesAdmin } from "@/lib/admin/categories-data";
import { createServiceRoleClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const admin = createServiceRoleClient();
  const [categories, bookSubcategories] = admin
    ? await Promise.all([listCategoriesAdmin(), listBookSubcategoriesAdmin()])
    : [[], []];

  return (
    <div>
      <Link href="/dashboard/products" className="text-sm font-bold text-neutral-600 underline-offset-4 hover:text-neutral-950 hover:underline">
        ← Products
      </Link>
      <div className="mt-4">
        <DashboardPageHeader title="New product" description="Add a catalog item with price, category, image, and public listing details." />
      </div>

      {!admin ? (
        <DashboardAlert>
          Add <code className="rounded bg-amber-100 px-1">SUPABASE_SERVICE_ROLE_KEY</code> to create products.
        </DashboardAlert>
      ) : null}

      {admin && categories.length === 0 ? (
        <DashboardAlert>
          Create a{" "}
          <Link href="/dashboard/categories" className="font-bold underline">
            category
          </Link>{" "}
          first.
        </DashboardAlert>
      ) : null}

      {admin && categories.length > 0 && bookSubcategories.length === 0 ? (
        <DashboardAlert>
          Book types are not set up yet. Run the Supabase migration{" "}
          <code className="rounded bg-amber-100 px-1">20260616120000_book_subcategories.sql</code> so Assessment Books and
          Workbooks appear in the form.
        </DashboardAlert>
      ) : null}

      {admin && categories.length > 0 && bookSubcategories.length > 0 ? (
        <DashboardPanel className="mt-8 p-6">
          <ProductForm categories={categories} bookSubcategories={bookSubcategories} action={createProductAction} />
        </DashboardPanel>
      ) : null}
    </div>
  );
}
