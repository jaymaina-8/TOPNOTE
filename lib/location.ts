/** Office location for TOPNOTE PUBLISHERS — Nairobi CBD. */

export const OFFICE_ADDRESS = {
  building: "Athi House",
  floor: "4th Floor, Room 402",
  street: "Charles Rubia Lane",
  city: "Nairobi",
  region: "Nairobi County",
  country: "Kenya",
  countryCode: "KE",
} as const;

export const OFFICE_ADDRESS_LINES = [
  `${OFFICE_ADDRESS.building}, ${OFFICE_ADDRESS.floor}`,
  OFFICE_ADDRESS.street,
  `${OFFICE_ADDRESS.city}, ${OFFICE_ADDRESS.country}`,
] as const;

export const OFFICE_ADDRESS_FULL = OFFICE_ADDRESS_LINES.join(", ");

export const MAP_COORDINATES = {
  lat: -1.2822642,
  lng: 36.8286325,
} as const;

export const GOOGLE_MAPS_PLACE_URL =
  "https://www.google.com/maps/place/Athi+House/@-1.2822588,36.8260576,16z/data=!3m1!4b1!4m6!3m5!1s0x182f1100673198a7:0x7295ef059525fe6a!8m2!3d-1.2822642!4d36.8286325!16s%2Fg%2F11ys439p_4";

export const GOOGLE_MAPS_DIRECTIONS_URL = `https://www.google.com/maps/dir/?api=1&destination=${MAP_COORDINATES.lat},${MAP_COORDINATES.lng}`;

/** Responsive iframe embed — no API key required. */
export const GOOGLE_MAPS_EMBED_URL = `https://www.google.com/maps?q=${MAP_COORDINATES.lat},${MAP_COORDINATES.lng}&hl=en&z=16&output=embed`;

export const LOCATION_BADGE_LABEL = "Nairobi CBD Office";
