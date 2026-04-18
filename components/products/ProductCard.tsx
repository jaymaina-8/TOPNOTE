import Image from "next/image";
import Link from "next/link";
import { TrackedWhatsAppButton } from "@/components/ctas/TrackedCtas";
import {
  catalogCardBodyClass,
  catalogCardBodyCompactClass,
  catalogCategoryLabelClass,
  catalogPriceClass,
  catalogPriceCompactClass,
  catalogProductDescriptionClass,
  catalogProductDescriptionCompactClass,
  catalogProductTitleClass,
  catalogProductTitleCompactClass,
  catalogTrustLineClass,
  catalogTrustLineCompactClass,
  catalogWhatsAppButtonClass,
  catalogWhatsAppButtonCompactClass,
  productCardArticleClass,
  productCardCatalogImageAreaClass,
  productCardImageClass,
} from "@/components/products/productCardClasses";
import { WhatsAppOrderGlyph } from "@/components/products/WhatsAppOrderGlyph";
import { excerptText, formatKesPrice } from "@/lib/format";
import type { ProductWithCategory } from "@/lib/supabase/types";
import { productCardWhatsAppMessage } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";

const CARD_DESCRIPTION_FALLBACK = "Ask us for details on WhatsApp.";

const DESCRIPTION_MAX = { default: 120, compact: 90 } as const;

export type ProductCardProps = {
  product: ProductWithCategory;
  /** Page path for conversion attribution (e.g. `/products` or `/`). */
  sourcePage: string;
  className?: string;
  /**
   * `compact` — tighter rhythm for home featured 2×2 mobile grid (same design system as catalog).
   */
  density?: "default" | "compact";
};

export function ProductCard({ product, sourcePage, className, density = "default" }: ProductCardProps) {
  const isCompact = density === "compact";
  const categoryName = product.categories?.name ?? "Catalog";
  const href = `/products/${product.slug}`;
  const excerpt = excerptText(
    product.description,
    isCompact ? DESCRIPTION_MAX.compact : DESCRIPTION_MAX.default,
    CARD_DESCRIPTION_FALLBACK,
  );

  const bodyClass = isCompact ? catalogCardBodyCompactClass : catalogCardBodyClass;
  const titleClass = isCompact ? catalogProductTitleCompactClass : catalogProductTitleClass;
  const descriptionClass = isCompact ? catalogProductDescriptionCompactClass : catalogProductDescriptionClass;
  const priceClass = isCompact ? catalogPriceCompactClass : catalogPriceClass;
  const waClass = isCompact ? catalogWhatsAppButtonCompactClass : catalogWhatsAppButtonClass;
  const trustClass = isCompact ? catalogTrustLineCompactClass : catalogTrustLineClass;

  const imageSizes = isCompact
    ? "(max-width: 640px) 48vw, (max-width: 1024px) 25vw, 20vw"
    : "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw";

  return (
    <article className={cn(productCardArticleClass, className)}>
      <Link href={href} className={productCardCatalogImageAreaClass} aria-label={`View ${product.name}`}>
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            className={productCardImageClass}
            sizes={imageSizes}
          />
        ) : (
          <div
            className="flex h-full items-center justify-center text-neutral-400"
            role="img"
            aria-label={`${product.name} — image coming soon`}
          >
            <span className={cn("font-medium text-neutral-400", isCompact ? "text-xs" : "text-sm")}>
              Image coming soon
            </span>
          </div>
        )}
      </Link>
      <div className={bodyClass}>
        <p className={cn(catalogCategoryLabelClass, isCompact && "max-sm:text-[10px] max-sm:tracking-[0.1em]")}>
          {categoryName}
        </p>
        <h3 className={titleClass}>
          <Link
            href={href}
            className="hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            {product.name}
          </Link>
        </h3>
        <p className={descriptionClass}>{excerpt}</p>
        <div
          className={cn(
            "border-t border-neutral-100/90 pt-4",
            isCompact ? "mt-3 sm:mt-5" : "mt-5 sm:mt-6",
          )}
        >
          <p className={priceClass}>{formatKesPrice(product.price)}</p>
          <div className={isCompact ? "mt-2.5 sm:mt-3" : "mt-3.5 sm:mt-3"}>
            <TrackedWhatsAppButton
              message={productCardWhatsAppMessage(product.name)}
              sourcePage={sourcePage}
              sourceProductId={product.id}
              variant="primary"
              className={waClass}
            >
              <>
                <WhatsAppOrderGlyph
                  className={cn("shrink-0 opacity-95", isCompact ? "h-4 w-4 max-sm:h-3.5 max-sm:w-3.5" : "h-[1.125rem] w-[1.125rem]")}
                />
                WhatsApp to order
              </>
            </TrackedWhatsAppButton>
            <p className={trustClass}>Quick replies during business hours</p>
          </div>
        </div>
      </div>
    </article>
  );
}
