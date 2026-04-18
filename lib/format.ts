/** Format product price for display (Kenya shillings). */
export function formatKesPrice(amount: number): string {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

/** Trim plain text for card excerpts; returns fallback when empty. */
export function excerptText(
  text: string | null | undefined,
  maxChars: number,
  emptyFallback: string,
): string {
  const t = text?.trim();
  if (!t) return emptyFallback;
  if (t.length <= maxChars) return t;
  return `${t.slice(0, Math.max(0, maxChars - 1)).trim()}…`;
}
