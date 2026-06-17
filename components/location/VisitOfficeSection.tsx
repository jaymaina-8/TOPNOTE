import { MapEmbed } from "@/components/maps/MapEmbed";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import {
  GOOGLE_MAPS_DIRECTIONS_URL,
  OFFICE_ADDRESS_LINES,
} from "@/lib/location";
import { cn } from "@/lib/utils";

const mapButtonClass = cn(
  "min-h-12 w-full justify-center rounded-xl px-8 text-base font-bold shadow-md",
  "transition-[box-shadow,transform] duration-200 hover:shadow-lg active:scale-[0.99]",
  "sm:w-auto sm:min-w-[min(100%,14rem)]",
);

export function VisitOfficeSection() {
  return (
    <Section surface="canvas" className="border-t border-neutral-200/80 py-14 md:py-16 lg:py-20">
      <Container className="max-w-6xl">
        <div className="mx-auto max-w-2xl text-center lg:max-w-none lg:text-left">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-500">In person</p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-neutral-900 md:text-3xl">Visit Our Office</h2>
          <p className="mt-3 text-sm leading-relaxed text-neutral-600 md:text-base">
            Pick up orders or discuss bulk school supply during business hours at our Nairobi CBD office.
          </p>
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-2 lg:items-stretch lg:gap-10">
          <div className="flex flex-col justify-center rounded-2xl border border-neutral-200/90 bg-white p-7 shadow-[var(--shadow-md)] md:p-9">
            <address className="not-italic">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-neutral-500">Office address</p>
              <ul className="mt-4 space-y-1.5 text-base font-medium leading-relaxed text-neutral-900 md:text-lg">
                {OFFICE_ADDRESS_LINES.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </address>
            <div className="mt-8">
              <Button
                href={GOOGLE_MAPS_DIRECTIONS_URL}
                variant="primary"
                target="_blank"
                rel="noopener noreferrer"
                className={mapButtonClass}
              >
                Get Directions
              </Button>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-neutral-200/90 bg-white shadow-[var(--shadow-md)]">
            <MapEmbed />
          </div>
        </div>
      </Container>
    </Section>
  );
}
