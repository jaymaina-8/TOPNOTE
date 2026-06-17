import { GOOGLE_MAPS_EMBED_URL } from "@/lib/location";
import { cn } from "@/lib/utils";

type MapEmbedProps = {
  title?: string;
  className?: string;
  aspectClassName?: string;
};

export function MapEmbed({
  title = "TOPNOTE PUBLISHERS office location on Google Maps",
  className,
  aspectClassName = "aspect-[16/10] sm:aspect-[16/9]",
}: MapEmbedProps) {
  return (
    <div className={cn("relative w-full max-w-full overflow-hidden", aspectClassName, className)}>
      <iframe
        title={title}
        src={GOOGLE_MAPS_EMBED_URL}
        className="absolute inset-0 h-full w-full border-0"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        allowFullScreen
      />
    </div>
  );
}
