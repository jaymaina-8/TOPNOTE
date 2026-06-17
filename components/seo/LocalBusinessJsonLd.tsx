import { SITE_NAME } from "@/lib/site";
import { GOOGLE_MAPS_PLACE_URL, MAP_COORDINATES, OFFICE_ADDRESS } from "@/lib/location";
import { PHONE_DISPLAY } from "@/lib/whatsapp";

function getSiteUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  return "https://topnotepublishers.co.ke";
}

export function LocalBusinessJsonLd() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: SITE_NAME,
    description:
      "Educational books, exams, stationery, and lab supplies for parents and schools across Kenya.",
    url: getSiteUrl(),
    telephone: PHONE_DISPLAY.replace(/\s/g, ""),
    address: {
      "@type": "PostalAddress",
      streetAddress: `${OFFICE_ADDRESS.building}, ${OFFICE_ADDRESS.floor}, ${OFFICE_ADDRESS.street}`,
      addressLocality: OFFICE_ADDRESS.city,
      addressRegion: OFFICE_ADDRESS.region,
      addressCountry: OFFICE_ADDRESS.countryCode,
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: MAP_COORDINATES.lat,
      longitude: MAP_COORDINATES.lng,
    },
    hasMap: GOOGLE_MAPS_PLACE_URL,
    areaServed: [
      { "@type": "City", name: "Nairobi" },
      { "@type": "Country", name: "Kenya" },
    ],
    sameAs: [GOOGLE_MAPS_PLACE_URL],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
