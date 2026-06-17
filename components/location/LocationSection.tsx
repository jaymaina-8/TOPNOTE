import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { GOOGLE_MAPS_PLACE_URL, OFFICE_ADDRESS_LINES } from "@/lib/location";
import { cn } from "@/lib/utils";

const mapButtonClass = cn(
  "min-h-12 w-full justify-center sm:w-auto sm:min-w-[min(100%,16rem)]",
);

export function LocationSection() {
  return (
    <Section surface="muted" className="py-16 md:py-20 lg:py-24">
      <Container className="max-w-6xl">
        <SectionHeading
          title="Our Nairobi office"
          description="Visit us in the CBD for pickups, consultations, and school supply planning."
          className="mb-8 md:mb-10"
        />
        <div className="rounded-2xl border border-neutral-200/90 bg-white p-7 shadow-[var(--shadow-sm)] md:p-9">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between sm:gap-8">
            <address className="not-italic">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Office location</p>
              <ul className="mt-4 space-y-1 text-base leading-relaxed text-neutral-700 md:text-lg">
                {OFFICE_ADDRESS_LINES.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </address>
            <Button
              href={GOOGLE_MAPS_PLACE_URL}
              variant="primary"
              target="_blank"
              rel="noopener noreferrer"
              className={mapButtonClass}
            >
              View on Google Maps
            </Button>
          </div>
        </div>
      </Container>
    </Section>
  );
}
