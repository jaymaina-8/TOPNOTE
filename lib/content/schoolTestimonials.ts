/**
 * Featured school testimonials (home & about). Holiday homework book covers in `public/testimonials/`.
 */
export type SchoolTestimonial = {
  id: string;
  title: string;
  quote: string;
  /** e.g. Administration / School Management */
  role?: string;
  /** Short label above the school name (image-led cards). */
  categoryLabel?: string;
  /** Path under `public/` when available */
  imageSrc?: string;
  imageAlt?: string;
  /** Styling for the full-name badge when no image */
  badgeTone?: "amber" | "emerald";
};

export const SCHOOL_TESTIMONIALS: readonly SchoolTestimonial[] = [
  {
    id: "royal-topmark",
    title: "Royal Topmark Academy",
    role: "School Management",
    categoryLabel: "Partner school",
    quote:
      "Reliable delivery and consistent quality materials. Planning school supply each term is now simple and predictable.",
    imageSrc: "/testimonials/royal-topmark-academy.png",
    imageAlt:
      "Royal Topmark Academy holiday homework book cover — lab learning, school grounds, and graduation",
  },
  {
    id: "bright-sparks",
    title: "Bright Sparks School",
    role: "Administration",
    categoryLabel: "Partner school",
    quote:
      "Affordable, syllabus-aligned materials that improve learning outcomes. We rely on TOPNOTE every term.",
    imageSrc: "/testimonials/bright-sparks-school.png",
    imageAlt:
      "Bright Sparks School holiday homework cover — learners reading and school branding",
  },
] as const;
