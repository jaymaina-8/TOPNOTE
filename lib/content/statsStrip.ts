/**
 * Homepage trust strip — edit values and labels here.
 * `suffix` appears after the animated number (e.g. "+", "%").
 */
export type StatsStripItem = {
  value: number;
  suffix: string;
  label: string;
};

export const STATS_STRIP_ITEMS: readonly StatsStripItem[] = [
  { value: 500, suffix: "+", label: "Products Available" },
  { value: 50, suffix: "+", label: "Schools Supplied" },
  { value: 10, suffix: "+", label: "Years Experience" },
  { value: 100, suffix: "%", label: "Nationwide Delivery" },
] as const;
