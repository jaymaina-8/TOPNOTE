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
  catalogWhatsAppButtonLabelClass,
  catalogWhatsAppGlyphClass,
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
            sizes="(max-width: 640px) 48vw, (max-width: 1024px) 50vw, 33vw"
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

        <div className="mt-4 border-t border-neutral-100/90 pt-3 sm:mt-6 sm:pt-4">
          <div className="rounded-xl bg-neutral-50/80 p-2.5 shadow-[var(--shadow-sm)] sm:p-4">
            <div className="flex items-start justify-between gap-2 sm:gap-3">
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-500 sm:text-[11px]">School unit price</p>
                <p className="mt-1 text-lg font-bold tabular-nums tracking-tight text-positive sm:text-xl">{formatKesPrice(schoolPrice)}</p>
              </div>
              <span className="shrink-0 rounded-full bg-positive-muted px-2 py-0.5 text-[10px] font-semibold text-positive sm:px-2.5 sm:py-1 sm:text-[11px]">
                Save {formatKesPrice(savePerUnit)}
              </span>
            </div>
            <p className="mt-1.5 text-xs text-neutral-500 sm:mt-2 sm:text-sm">
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
                <WhatsAppOrderGlyph className={catalogWhatsAppGlyphClass} />
                <span className={catalogWhatsAppButtonLabelClass}>WhatsApp to order</span>
              </>
            </TrackedWhatsAppButton>
            <p className={catalogTrustLineClass}>Quick replies during business hours</p>
          </div>
        </div>
      </div>
    </article>
  );
}
