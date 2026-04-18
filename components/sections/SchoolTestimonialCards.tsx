"use client";

import Image from "next/image";

import { FadeInWhenVisible } from "@/components/ui/FadeInWhenVisible";
import { cn } from "@/lib/utils";
import { SCHOOL_TESTIMONIALS, type SchoolTestimonial } from "@/lib/content/schoolTestimonials";

const badgeToneClass: Record<NonNullable<SchoolTestimonial["badgeTone"]>, string> = {
  amber:
    "border-amber-200/90 bg-gradient-to-br from-amber-50 via-amber-50/90 to-amber-100/70 text-neutral-900 shadow-sm",
  emerald:
    "border-emerald-200/90 bg-gradient-to-br from-emerald-50 via-emerald-50/90 to-emerald-100/70 text-neutral-900 shadow-sm",
};

/** Image-first cards: workbook / school photography on top (original marketing layout). */
function ImageLedCard({ school }: { school: SchoolTestimonial }) {
  if (!school.imageSrc) return null;

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-xl bg-white shadow-[var(--shadow-sm)] transition-shadow duration-200 hover:shadow-[var(--shadow-md)]">
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-neutral-100">
        <Image
          src={school.imageSrc}
          alt={school.imageAlt ?? school.title}
          fill
          sizes="(max-width: 768px) 100vw, 480px"
          className="object-cover object-center transition-transform duration-300 ease-out group-hover:scale-[1.02]"
        />
      </div>
      <div className="flex flex-1 flex-col p-7 md:p-8">
        {school.categoryLabel ? (
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">{school.categoryLabel}</p>
        ) : null}
        <h3 className={cn("text-xl font-bold tracking-tight text-neutral-900", school.categoryLabel && "mt-1")}>
          {school.title}
        </h3>
        {school.role ? <p className="mt-2 text-sm text-neutral-500">{school.role}</p> : null}
        <blockquote className="mt-4 flex-1 text-base leading-relaxed text-neutral-700">
          <span className="sr-only">Quote from {school.title}. </span>
          &ldquo;{school.quote}&rdquo;
        </blockquote>
      </div>
    </article>
  );
}

function BadgeFallbackCard({ school }: { school: SchoolTestimonial }) {
  const tone = school.badgeTone ?? "amber";

  return (
    <article
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white p-8 shadow-lg",
        "transition-all duration-300 hover:shadow-xl",
      )}
    >
      <span
        className="pointer-events-none absolute right-2 top-0 font-serif text-7xl leading-none text-primary/15 select-none md:right-4 md:text-8xl lg:text-9xl"
        aria-hidden
      >
        &ldquo;
      </span>

      <div className="relative z-[1] flex flex-1 flex-col gap-6">
        <div
          className={cn(
            "flex w-full items-center justify-center rounded-2xl border px-6 py-7 text-center md:px-8 md:py-8",
            badgeToneClass[tone],
          )}
        >
          <span className="text-balance text-xl font-bold leading-tight tracking-tight text-neutral-900 md:text-2xl">
            {school.title}
          </span>
        </div>

        {school.role ? <p className="text-sm text-neutral-500">{school.role}</p> : null}

        <blockquote className="relative z-[1] max-w-md text-lg leading-relaxed text-neutral-800 md:text-xl">
          <span className="sr-only">Quote from {school.title}. </span>
          {school.quote}
        </blockquote>
      </div>
    </article>
  );
}

export function SchoolTestimonialCards() {
  return (
    <ul className="mx-auto mt-12 grid w-full max-w-5xl grid-cols-1 gap-8 md:mt-14 md:grid-cols-2 md:gap-10">
      {SCHOOL_TESTIMONIALS.map((school, index) => (
        <li key={school.id} className="min-w-0">
          <FadeInWhenVisible delayMs={index * 100}>
            {school.imageSrc ? <ImageLedCard school={school} /> : <BadgeFallbackCard school={school} />}
          </FadeInWhenVisible>
        </li>
      ))}
    </ul>
  );
}
