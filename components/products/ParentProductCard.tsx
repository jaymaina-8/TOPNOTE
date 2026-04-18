import Image from "next/image";
import Link from "next/link";
import { TrackedWhatsAppButton } from "@/components/ctas/TrackedCtas";
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
import { WhatsAppOrderGlyph } from "@/components/products/WhatsAppOrderGlyph";
import { excerptText, formatKesPrice } from "@/lib/format";
import type { ProductWithCategory } from "@/lib/supabase/types";
import { parentProductWhatsAppMessage } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";

const CARD_DESCRIPTION_FALLBACK = "Ask us for details on WhatsApp.";

export type ParentProductCardProps = {
  product: ProductWithCategory;
  sourcePage: string;
  className?: string;
};

export function ParentProductCard({ product, sourcePage, className }: ParentProductCardProps) {
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
          <p className="text-[11px] font-medium uppercase tracking-wide text-neutral-500">Retail / cover price</p>
          <p className={cn("mt-1", catalogPriceClass)}>{formatKesPrice(product.price)}</p>
          <div className="mt-3.5 sm:mt-3">
            <TrackedWhatsAppButton
              message={parentProductWhatsAppMessage(product.name)}
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
