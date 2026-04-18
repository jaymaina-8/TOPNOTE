import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { howItWorksSteps } from "@/lib/content/home";

function StepConnector() {
  return (
    <div
      className="hidden shrink-0 self-center md:flex md:h-10 md:w-10 md:items-center md:justify-center lg:h-12 lg:w-12"
      aria-hidden
    >
      <svg
        className="h-6 w-6 text-primary/35 lg:h-7 lg:w-7"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
      </svg>
    </div>
  );
}

export function HowItWorks() {
  return (
    <Section surface="muted">
      <Container>
        <SectionHeading
          title="Order in 3 Simple Steps"
          description="From product selection to delivery — fast and straightforward."
        />
        <ol className="mt-9 flex flex-col gap-4 md:mt-11 md:flex-row md:items-stretch md:gap-0 lg:mt-12">
          {howItWorksSteps.map((item, index) => (
            <li
              key={item.step}
              className="flex flex-1 flex-col md:min-w-0 md:flex-row md:items-stretch"
            >
              <div className="flex flex-1 flex-col rounded-2xl bg-white p-5 text-center shadow-[var(--shadow-sm)] transition-shadow hover:shadow-[var(--shadow-md)] md:p-6">
                <span className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 text-base font-bold text-primary ring-1 ring-primary/25 md:h-14 md:w-14 md:text-lg">
                  {item.step}
                </span>
                <h3 className="mt-3 text-base font-semibold leading-snug text-neutral-900 md:mt-4 md:text-lg">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-neutral-600 md:mt-2.5">{item.description}</p>
              </div>
              {index < howItWorksSteps.length - 1 ? <StepConnector /> : null}
            </li>
          ))}
        </ol>
      </Container>
    </Section>
  );
}
