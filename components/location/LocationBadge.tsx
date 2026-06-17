import { GOOGLE_MAPS_PLACE_URL, LOCATION_BADGE_LABEL } from "@/lib/location";
import { cn } from "@/lib/utils";

type LocationBadgeProps = {
  className?: string;
};

export function LocationBadge({ className }: LocationBadgeProps) {
  return (
    <a
      href={GOOGLE_MAPS_PLACE_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "inline-flex min-h-12 items-center gap-2 rounded-full border border-[#7f0712]/12 bg-white/72 px-4 py-2.5",
        "text-sm font-semibold text-[#7f0712] shadow-sm backdrop-blur",
        "transition-[transform,box-shadow,border-color] duration-200",
        "hover:-translate-y-0.5 hover:border-[#d41224]/25 hover:shadow-md",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#d41224]/60",
        className,
      )}
    >
      <span aria-hidden>📍</span>
      <span>{LOCATION_BADGE_LABEL}</span>
    </a>
  );
}
