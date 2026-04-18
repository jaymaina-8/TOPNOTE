import { cn } from "@/lib/utils";

/** Shared presentation for public product cards (visual consistency). */
export const productCardArticleClass =
  "group flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-[var(--shadow-sm)] transition-[box-shadow] duration-200 hover:shadow-[var(--shadow-md)]";

export const productCardCatalogImageAreaClass =
  "relative block aspect-[3/2] overflow-hidden bg-neutral-50 outline-none ring-primary focus-visible:ring-2 focus-visible:ring-offset-2 sm:aspect-[4/3]";

export const productCardImageClass = "object-cover object-center transition-transform duration-300 group-hover:scale-[1.03]";

/**
 * Mobile-first grid for `/products`, `/for-parents`, `/for-schools` (via `CatalogWithFilters`).
 * 1 column on narrow phones; 2 columns from `sm`; 3 from `lg`.
 */
export const catalogProductGridClass =
  "grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-6 md:gap-7 lg:grid-cols-3 lg:gap-8";

/**
 * Home Featured Products: **2 columns on mobile** (2×2 for four items), 4 columns on large screens.
 */
export const homeFeaturedProductGridClass =
  "grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-2 md:gap-6 lg:grid-cols-4 lg:gap-8";

/** Listing cards: extra horizontal breathing room on small viewports (single-column mobile). */
export const catalogCardBodyClass = "flex flex-1 flex-col p-6 sm:p-5";

/** Home featured strip in 2-col mobile: slightly tighter padding, same system as catalog. */
export const catalogCardBodyCompactClass = "flex flex-1 flex-col p-4 sm:p-5 max-sm:px-3.5";

export const catalogCategoryLabelClass =
  "text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-500";

export const catalogProductTitleClass =
  "mt-2 text-balance text-base font-bold leading-tight tracking-tight text-neutral-900 sm:mt-1.5";

/** Slightly smaller title in very narrow 2-col featured cells. */
export const catalogProductTitleCompactClass =
  "mt-2 text-balance text-sm font-bold leading-tight tracking-tight text-neutral-900 max-sm:line-clamp-3 sm:mt-1.5 sm:text-base";

export const catalogProductDescriptionClass =
  "mt-2.5 flex-1 text-sm leading-relaxed text-neutral-600 sm:mt-2";

export const catalogProductDescriptionCompactClass =
  "mt-1.5 flex-1 text-[13px] leading-snug text-neutral-600 sm:mt-2 sm:text-sm sm:leading-relaxed";

export const catalogPriceClass = "text-lg font-bold tabular-nums tracking-tight text-neutral-950";

export const catalogPriceCompactClass =
  "text-base font-bold tabular-nums tracking-tight text-neutral-950 sm:text-lg";

/** Primary WhatsApp CTA on catalog / parent / school listing cards — full width, touch-friendly. */
export const catalogWhatsAppButtonClass = cn(
  "flex w-full min-h-12 items-center justify-center gap-2 rounded-full border-0 px-4 py-3.5 text-sm font-bold !text-white shadow-md shadow-[#ff2d2d]/30 transition-all duration-300 ease-out",
  "bg-[#FF2D2D] hover:-translate-y-0.5 hover:bg-[#c91728] hover:shadow-lg hover:shadow-[#ff2d2d]/40 hover:!text-white active:translate-y-0",
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF2D2D]/45",
);

/** Slightly shorter tap target + text in 2-col mobile featured cells. */
export const catalogWhatsAppButtonCompactClass = cn(
  catalogWhatsAppButtonClass,
  "max-sm:min-h-[2.75rem] max-sm:gap-1.5 max-sm:px-3 max-sm:py-3 max-sm:text-[0.8125rem]",
);

/** Muted reassurance line under listing WhatsApp buttons. */
export const catalogTrustLineClass =
  "mt-2.5 text-center text-[11px] font-medium leading-relaxed text-neutral-500 sm:mt-2";

export const catalogTrustLineCompactClass = cn(
  catalogTrustLineClass,
  "max-sm:mt-1.5 max-sm:text-[10px] max-sm:leading-snug",
);
