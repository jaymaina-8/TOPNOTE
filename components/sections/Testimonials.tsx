import { SchoolTestimonialCards } from "@/components/sections/SchoolTestimonialCards";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { SCHOOL_TESTIMONIALS } from "@/lib/content/schoolTestimonials";

type TestimonialsProps = {
  surface?: "canvas" | "muted";
};

export function Testimonials({ surface = "muted" }: TestimonialsProps) {
  if (SCHOOL_TESTIMONIALS.length === 0) {
    return null;
  }

  return (
    <Section surface={surface} className="py-16 md:py-20 lg:py-24">
      <Container className="max-w-6xl">
        <SectionHeading
          title="Trusted by Schools Across Kenya"
          description="Institutions already using our materials to deliver better learning outcomes."
        />
        <p className="mx-auto mt-6 max-w-2xl text-center text-sm font-semibold uppercase tracking-wide text-red-500">
          50+ Schools Supplied
        </p>
        <SchoolTestimonialCards />
      </Container>
    </Section>
  );
}
