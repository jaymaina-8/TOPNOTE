import Link from "next/link";
import { DashboardAlert, DashboardPageHeader } from "@/components/dashboard/DashboardUi";
import { CategoriesGridClient } from "@/components/admin/CategoriesGridClient";
import { countProductsInCategory, listCategoriesAdmin } from "@/lib/admin/categories-data";
import { createServiceRoleClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ blocked?: string; count?: string; error?: string }>;
};

export default async function DashboardCategoriesPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const admin = createServiceRoleClient();

  // Load and count categories in parallel
  let categories: any[] = [];
  if (admin) {
    const rawCategories = await listCategoriesAdmin();
    categories = await Promise.all(
      rawCategories.map(async (c) => {
        const count = await countProductsInCategory(c.id);
        return {
          ...c,
          productCount: count ?? 0,
        };
      })
    );
  }

  return (
    <div className="space-y-6">
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

      {admin && (
        <CategoriesGridClient initialCategories={categories} />
      )}
    </div>
  );
}
