import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { categories } from "@/lib/content/home";

function CategoryIcon({ slug }: { slug: string }) {
  const common = "h-6 w-6 text-primary";
  switch (slug) {
    case "books":
      return (
        <svg className={common} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
          />
        </svg>
      );
    case "exams":
      return (
        <svg className={common} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      );
    case "stationery":
      return (
        <svg className={common} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
          />
        </svg>
      );
    case "lab-equipment":
      return (
        <svg className={common} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082m-5.507 0a18.27 18.27 0 0116.5 0"
          />
        </svg>
      );
    default:
      return null;
  }
}

function categoryHref(slug: string): string {
  if (slug === "exams") return "/products?category=exams";
  if (slug === "lab-equipment") return "/products?category=lab";
  return `/products?category=${slug}`;
}

export function Categories() {
  return (
    <Section surface="muted">
      <Container>
        <SectionHeading
          title="A complete learning supply house"
          description="Books, exams, stationery and lab supplies curated for Kenyan schools and families."
        />
        <ul className="mt-10 grid gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4 md:mt-12">
          {categories.map((cat) => (
            <li key={cat.slug} className="flex">
              <Link
                href={categoryHref(cat.slug)}
                className="group relative flex h-full w-full cursor-pointer flex-col overflow-hidden rounded-2xl border border-primary/10 bg-white p-7 shadow-[var(--shadow-sm)] transition-[transform,box-shadow,border-color] duration-300 ease-out before:absolute before:inset-x-0 before:top-0 before:h-1 before:bg-primary hover:-translate-y-1 hover:border-primary/25 hover:shadow-[var(--shadow-md)]"
              >
                <div
                  className="mb-5 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 shadow-[var(--shadow-sm)] ring-1 ring-primary/15"
                  aria-hidden
                >
                  <CategoryIcon slug={cat.slug} />
                </div>
                <h3 className="font-semibold leading-snug text-neutral-900 group-hover:text-primary">{cat.name}</h3>
                <span className="mt-auto pt-5 text-sm font-medium text-primary transition-colors group-hover:text-primary/90">
                  View products &rarr;
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Container>
    </Section>
  );
}
