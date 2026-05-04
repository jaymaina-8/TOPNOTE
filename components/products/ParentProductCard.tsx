import Image from "next/image";
import Link from "next/link";
import { AddToCartButton } from "@/components/cart/AddToCartButton";
import {
  catalogCardBodyClass,
  catalogCategoryLabelClass,
  catalogPriceClass,
  catalogProductDescriptionClass,
  catalogProductTitleClass,
  catalogTrustLineClass,
  catalogWhatsAppButtonClass,
  productCardArticleClass,
  productCardCatalogImageAreaClass,
  productCardImageClass,
} from "@/components/products/productCardClasses";
import { excerptText, formatKesPrice } from "@/lib/format";
import type { ProductWithCategory } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";

const CARD_DESCRIPTION_FALLBACK = "Ask us for details on WhatsApp.";

export type ParentProductCardProps = {
  product: ProductWithCategory;
  sourcePage: string;
  className?: string;
};

export function ParentProductCard({ product, className }: ParentProductCardProps) {
  const categoryName = product.categories?.name ?? "Catalog";
  const href = `/products/${product.slug}`;
  const excerpt = excerptText(product.description, 120, CARD_DESCRIPTION_FALLBACK);

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
          <p className="text-[10px] font-medium uppercase tracking-wide text-neutral-500 sm:text-[11px]">Retail / cover price</p>
          <p className={cn("mt-1", catalogPriceClass)}>{formatKesPrice(product.price)}</p>
          <div className="mt-3.5 sm:mt-3">
            <AddToCartButton
              item={{
                id: product.id,
                name: product.name,
                slug: product.slug,
                price: product.price,
                imageUrl: product.image_url,
                categoryName,
              }}
              className={catalogWhatsAppButtonClass}
            />
            <p className={catalogTrustLineClass}>Review totals in your cart before WhatsApp checkout</p>
          </div>
        </div>
      </div>
    </article>
  );
}
