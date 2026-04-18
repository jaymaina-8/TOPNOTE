import Image from "next/image";
import Link from "next/link";
import { TrackedWhatsAppButton } from "@/components/ctas/TrackedCtas";
import {
  catalogCardBodyClass,
  catalogCategoryLabelClass,
  catalogProductDescriptionClass,
  catalogProductTitleClass,
  catalogTrustLineClass,
  catalogWhatsAppButtonClass,
  productCardArticleClass,
  productCardCatalogImageAreaClass,
  productCardImageClass,
} from "@/components/products/productCardClasses";
import { WhatsAppOrderGlyph } from "@/components/products/WhatsAppOrderGlyph";
import { excerptText, formatKesPrice } from "@/lib/format";
import { getDiscountAmount, getSchoolPrice } from "@/lib/pricing";
import type { ProductWithCategory } from "@/lib/supabase/types";
import { schoolProductWhatsAppMessage } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";

const CARD_DESCRIPTION_FALLBACK = "Ask us for details on WhatsApp.";

export type SchoolProductCardProps = {
  product: ProductWithCategory;
  sourcePage: string;
  className?: string;
};

export function SchoolProductCard({ product, sourcePage, className }: SchoolProductCardProps) {
  const categoryName = product.categories?.name ?? "Catalog";
  const href = `/products/${product.slug}`;
  const excerpt = excerptText(product.description, 120, CARD_DESCRIPTION_FALLBACK);
  const schoolPrice = getSchoolPrice(product.price);
  const savePerUnit = getDiscountAmount(product.price);

  return (
    <article className={cn(productCardArticleClass, className)}>
      <Link href={href} className={productCardCatalogImageAreaClass} aria-label={`View ${product.name}`}>
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            className={productCardImageClass}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div
            className="flex h-full items-center justify-center text-neutral-400"
            role="img"
            aria-label={`${product.name} — image coming soon`}
          >
            <span className="text-sm font-medium">Image coming soon</span>
          </div>
        )}
      </Link>
      <div className={catalogCardBodyClass}>
        <p className={catalogCategoryLabelClass}>{categoryName}</p>
        <h3 className={catalogProductTitleClass}>
          <Link
            href={href}
            className="hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            {product.name}
          </Link>
        </h3>
        <p className={catalogProductDescriptionClass}>{excerpt}</p>

        <div className="mt-5 border-t border-neutral-100/90 pt-4 sm:mt-6">
          <div className="rounded-xl bg-neutral-50/80 p-3.5 shadow-[var(--shadow-sm)] sm:p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-neutral-500">School unit price</p>
                <p className="mt-1 text-xl font-bold tabular-nums tracking-tight text-positive">{formatKesPrice(schoolPrice)}</p>
              </div>
              <span className="shrink-0 rounded-full bg-positive-muted px-2.5 py-1 text-[11px] font-semibold text-positive">
                Save {formatKesPrice(savePerUnit)}
              </span>
            </div>
            <p className="mt-2 text-sm text-neutral-500">
              <span className="text-neutral-500 line-through tabular-nums">{formatKesPrice(product.price)}</span>
              <span className="ml-2 text-neutral-500">list price</span>
            </p>
          </div>
          <div className="mt-3.5 sm:mt-3">
            <TrackedWhatsAppButton
              message={schoolProductWhatsAppMessage(product.name)}
              sourcePage={sourcePage}
              sourceProductId={product.id}
              variant="primary"
              className={catalogWhatsAppButtonClass}
            >
              <>
                <WhatsAppOrderGlyph className="h-[1.125rem] w-[1.125rem] shrink-0 opacity-95" />
                WhatsApp to order
              </>
            </TrackedWhatsAppButton>
            <p className={catalogTrustLineClass}>Quick replies during business hours</p>
          </div>
        </div>
      </div>
    </article>
  );
}
