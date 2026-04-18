import { cn } from "@/lib/utils";

/** Shared presentation for public product cards (visual consistency). */
export const productCardArticleClass =
  "group flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-[var(--shadow-sm)] transition-[box-shadow] duration-200 hover:shadow-[var(--shadow-md)]";

export const productCardCatalogImageAreaClass =
  "relative block aspect-[5/3] overflow-hidden bg-neutral-50 outline-none ring-primary focus-visible:ring-2 focus-visible:ring-offset-2 sm:aspect-[4/3]";

export const productCardImageClass = "object-cover object-center transition-transform duration-300 group-hover:scale-[1.03]";

/**
 * Mobile-first grid for `/products`, `/for-parents`, `/for-schools` (via `CatalogWithFilters`).
 * 2 columns on phones; 3 from `lg` (desktop unchanged).
 */
export const catalogProductGridClass =
  "grid grid-cols-2 gap-3.5 gap-y-6 sm:gap-5 md:gap-7 lg:grid-cols-3 lg:gap-8";

/**
 * Home Featured Products: **2 columns on mobile** (2×2 for four items), 4 columns on large screens.
 */
export const homeFeaturedProductGridClass =
  "grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-2 md:gap-6 lg:grid-cols-4 lg:gap-8";

/** Listing cards: slightly tighter padding on narrow 2-col mobile; roomier from `sm` up. */
export const catalogCardBodyClass = "flex flex-1 flex-col p-4 px-3.5 sm:p-5";

/** Home featured strip in 2-col mobile: slightly tighter padding, same system as catalog. */
export const catalogCardBodyCompactClass = "flex flex-1 flex-col p-4 sm:p-5 max-sm:px-3.5";

export const catalogCategoryLabelClass =
  "text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-500";

export const catalogProductTitleClass =
  "mt-2 text-balance text-sm font-bold leading-tight tracking-tight text-neutral-900 max-sm:line-clamp-3 sm:mt-1.5 sm:text-base";

/** Home featured strip — same title scale as catalog listing (2-col mobile). */
export const catalogProductTitleCompactClass = catalogProductTitleClass;

export const catalogProductDescriptionClass =
  "mt-2 flex-1 text-[13px] leading-snug text-neutral-600 sm:mt-2 sm:text-sm sm:leading-relaxed";

export const catalogProductDescriptionCompactClass =
  "mt-1.5 flex-1 text-[13px] leading-snug text-neutral-600 sm:mt-2 sm:text-sm sm:leading-relaxed";

export const catalogPriceClass =
  "text-base font-bold tabular-nums tracking-tight text-neutral-950 sm:text-lg";

export const catalogPriceCompactClass = catalogPriceClass;

/** WhatsApp mark: slightly smaller on narrow 2-col cards; full size from `sm` up. */
export const catalogWhatsAppGlyphClass =
  "h-3.5 w-3.5 shrink-0 opacity-95 sm:h-[1.125rem] sm:w-[1.125rem]";

/** Label next to the glyph — balanced lines on tiny widths without crowding. */
export const catalogWhatsAppButtonLabelClass =
  "min-w-0 text-center text-balance leading-snug sm:leading-normal";

/**
 * Primary WhatsApp CTA on catalog / parent / school listing cards — full width, touch-friendly.
 * Mobile-first: compact on very small phones; `sm:` restores the roomier catalog treatment.
 */
export const catalogWhatsAppButtonClass = cn(
  "flex w-full min-h-[2.5rem] items-center justify-center gap-1.5 rounded-[1.125rem] border-0 px-2.5 py-2 text-[0.8125rem] font-bold leading-snug !text-white shadow-md shadow-[#ff2d2d]/30 transition-all duration-300 ease-out",
  "sm:min-h-12 sm:gap-2 sm:rounded-full sm:px-4 sm:py-3.5 sm:text-sm sm:leading-normal",
  "bg-[#FF2D2D] hover:-translate-y-0.5 hover:bg-[#c91728] hover:shadow-lg hover:shadow-[#ff2d2d]/40 hover:!text-white active:translate-y-0",
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF2D2D]/45",
);

/** Home featured strip — same CTA sizing as catalog listing on mobile. */
export const catalogWhatsAppButtonCompactClass = catalogWhatsAppButtonClass;

/** Muted reassurance line under listing WhatsApp buttons. */
export const catalogTrustLineClass =
  "mt-1 text-center text-[10px] font-medium leading-snug text-neutral-500 sm:mt-2 sm:text-[11px] sm:leading-relaxed";

export const catalogTrustLineCompactClass = catalogTrustLineClass;
