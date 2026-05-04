import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { whyChooseUs } from "@/lib/content/home";

const TRUST_BADGES = ["500+ products available", "50+ schools supplied"] as const;

export function WhyChooseUs() {
  return (
    <Section surface="canvas">
      <Container>
        <SectionHeading title="Why schools choose TOPNOTE" description="A publisher and supply partner built for Kenyan learners and educators." />
        <div className="mx-auto mt-5 flex max-w-2xl flex-wrap justify-center gap-2 md:mt-6">
          {TRUST_BADGES.map((label) => (
            <span
              key={label}
              className="rounded-full border border-primary/15 bg-primary/[0.08] px-3 py-1 text-xs font-medium text-primary"
            >
              {label}
            </span>
          ))}
        </div>
        <ul className="mt-10 grid gap-4 sm:grid-cols-2 md:mt-12 md:gap-5">
          {whyChooseUs.map((item) => (
            <li
              key={item.title}
              className="flex items-start gap-3.5 rounded-2xl border border-primary/10 bg-white p-5 shadow-[var(--shadow-sm)] transition-[transform,box-shadow,border-color] duration-200 md:hover:-translate-y-1 md:hover:border-primary/25 md:hover:shadow-[var(--shadow-md)]"
            >
              <span
                className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary"
                aria-hidden
              >
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold leading-snug text-neutral-900">{item.title}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-neutral-500">{item.subtext}</p>
              </div>
            </li>
          ))}
        </ul>
      </Container>
    </Section>
  );
}
