/** Default bulk discount for school catalog (percentage off listed price). */
export const SCHOOL_BULK_DISCOUNT_PERCENT = 10;

/**
 * School catalog unit price after the standard bulk discount (10% off list).
 * Centralized: list × 0.9, rounded to whole shillings.
 */
export function getSchoolPrice(price: number): number {
  return Math.round(price * 0.9);
}

/**
 * Savings per unit vs list price (matches {@link getSchoolPrice} rounding).
 */
export function getDiscountAmount(price: number): number {
  return price - getSchoolPrice(price);
}
