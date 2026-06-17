import Image from "next/image";
import Link from "next/link";

import { AddToCartButton } from "@/components/cart/AddToCartButton";
import { TrackedPhoneButton, TrackedWhatsAppButton } from "@/components/ctas/TrackedCtas";
import { LocationBadge } from "@/components/location/LocationBadge";
import { InquiryForm } from "@/components/forms/InquiryForm";
import { AnimatedStats, type AnimatedStatItem } from "@/components/sections/AnimatedStats";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { formatKesPrice } from "@/lib/format";
import { WHATSAPP_MESSAGES } from "@/lib/whatsapp";
import type { ProductWithCategory } from "@/lib/supabase/types";

type SeedInspiredHomeProps = {
  products: ProductWithCategory[];
};

const productShowcase = [
  {
    eyebrow: "For home study",
    title: "CBC Revision Books",
    text: "Grade-focused books for daily practice, homework support, and confident term revision.",
    href: "/products?category=books",
    image: "/hero-books/hero-book-green.png",
  },
  {
    eyebrow: "For exams",
    title: "Practice Papers",
    text: "Exam sets and revision materials that help learners prepare with structure.",
    href: "/products?category=exams",
    image: "/hero-books/hero-book-red.png",
  },
  {
    eyebrow: "For classrooms",
    title: "School Supply Packs",
    text: "Books, stationery, and lab essentials for term planning and bulk school orders.",
    href: "/for-schools",
    image: "/hero-books/hero-book-teal.png",
  },
] as const;

const articleLinks = [
  {
    label: "School planning",
    title: "How schools can prepare term supply lists earlier",
    text: "A practical ordering rhythm for head teachers and procurement teams.",
    href: "/for-schools",
    image: "/generated/topnote-school-products-order.png",
    objectPosition: "center center",
  },
  {
    label: "Parent guide",
    title: "What parents should check before buying CBC books",
    text: "Simple cues for choosing grade-ready materials without guesswork.",
    href: "/for-parents",
    image: "/generated/topnote-parent-child-guide.png",
    objectPosition: "center center",
  },
  {
    label: "Study routine",
    title: "Why practice papers work best with a weekly routine",
    text: "Help learners revise in smaller, more consistent study blocks.",
    href: "/products?category=exams",
    image: "/generated/topnote-note-study-routine.png",
    objectPosition: "center center",
  },
] as const;

const testimonials = [
  {
    quote: "TOPNOTE made our bulk book ordering direct and clear before the term rush.",
    name: "Bright Sparks School",
  },
  {
    quote: "The WhatsApp support helped us confirm the right revision materials quickly.",
    name: "Royal Topmark Academy",
  },
  {
    quote: "Parents get practical guidance instead of guessing from a long shopping list.",
    name: "Parent support desk",
  },
] as const;

const statItems = [
  { value: 500, suffix: "+", label: "Products available" },
  { value: 50, suffix: "+", label: "Schools supplied" },
  { value: 10, suffix: "+", label: "Years experience" },
  { value: 100, suffix: "%", label: "Nationwide delivery" },
] satisfies readonly AnimatedStatItem[];

function SectionKicker({ children }: { children: React.ReactNode }) {
  return (
    <p className="w-fit rounded-full bg-[#fff1f2] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#a61222] ring-1 ring-[#d41224]/10">
      {children}
    </p>
  );
}

function FeaturedProducts({ products }: SeedInspiredHomeProps) {
  const displayProducts = products.slice(0, 4);

  return (
    <section className="bg-white py-14 sm:py-16 lg:py-20">
      <Container className="max-w-[1180px]">
        <div className="grid gap-5 lg:grid-cols-[0.85fr_1.15fr] lg:items-end">
          <div>
            <SectionKicker>Product showcase</SectionKicker>
            <h2 className="mt-4 max-w-xl text-3xl font-semibold leading-tight text-[#27070b] sm:text-4xl">
              Books, exams, and supplies for the next school day.
            </h2>
          </div>
          <p className="max-w-2xl text-sm leading-relaxed text-[#654046] sm:text-base">
            Start with the main learning categories, then message TOPNOTE for stock checks, retail pricing, bulk quotes, and delivery guidance.
          </p>
        </div>

        <div className="mt-9 grid gap-4 md:grid-cols-3">
          {productShowcase.map((item) => (
            <Link
              key={item.title}
              href={item.href}
              className="group grid min-h-[25rem] overflow-hidden rounded-lg border border-[#f1d7da] bg-[#fff8f8] transition-[border-color,box-shadow,transform] duration-300 hover:-translate-y-1 hover:border-[#d41224]/30 hover:shadow-[0_20px_60px_rgba(91,12,22,0.12)]"
            >
              <div className="flex min-h-[13rem] items-end justify-center bg-[#ffe9ec] p-5">
                <Image
                  src={item.image}
                  alt=""
                  width={260}
                  height={360}
                  className="max-h-56 w-auto object-contain drop-shadow-[0_18px_28px_rgba(70,8,15,0.22)] transition-transform duration-300 group-hover:scale-[1.04]"
                />
              </div>
              <div className="p-5">
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#d41224]">{item.eyebrow}</p>
                <h3 className="mt-2 text-xl font-semibold leading-tight text-[#27070b]">{item.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-[#654046]">{item.text}</p>
              </div>
            </Link>
          ))}
        </div>

        {displayProducts.length ? (
          <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {displayProducts.map((product) => (
              <li key={product.id}>
                <article className="flex h-full flex-col rounded-lg border border-[#f1d7da] bg-white p-4 shadow-sm">
                  <Link href={`/products/${product.slug}`} className="relative aspect-[4/3] overflow-hidden rounded-md bg-[#fff1f2]">
                    {product.image_url ? (
                      <Image src={product.image_url} alt={product.name} fill sizes="(max-width: 1024px) 50vw, 25vw" className="object-cover" />
                    ) : (
                      <Image src="/hero-books/hero-workbook-grade4.png" alt="" fill sizes="(max-width: 1024px) 50vw, 25vw" className="object-contain p-7" />
                    )}
                  </Link>
                  <p className="mt-4 text-[11px] font-bold uppercase tracking-wide text-[#d41224]">{product.categories?.name ?? "Catalog"}</p>
                  <h3 className="mt-1 text-base font-semibold leading-tight text-[#27070b]">
                    <Link href={`/products/${product.slug}`} className="hover:underline">
                      {product.name}
                    </Link>
                  </h3>
                  <p className="mt-2 text-sm font-bold text-[#7f0712]">{formatKesPrice(product.price)}</p>
                  <AddToCartButton
                    item={{
                      id: product.id,
                      name: product.name,
                      slug: product.slug,
                      price: product.price,
                      imageUrl: product.image_url,
                      categoryName: product.categories?.name ?? "Catalog",
                    }}
                    className="mt-auto rounded-full bg-[#7f0712] text-white hover:bg-[#a61222]"
                  />
                </article>
              </li>
            ))}
          </ul>
        ) : null}
      </Container>
    </section>
  );
}

export function SeedInspiredHome({ products }: SeedInspiredHomeProps) {
  return (
    <div className="bg-[#fff9f9]">
      <section className="relative isolate overflow-hidden bg-[#fff1f2]">
        <Image
          src="/generated/topnote-premium-hero-bg.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-[62%_center]"
        />
        <div
          className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,250,250,0.96)_0%,rgba(255,244,245,0.86)_42%,rgba(255,233,236,0.8)_100%)] sm:bg-[linear-gradient(90deg,rgba(255,250,250,0.98)_0%,rgba(255,250,250,0.94)_42%,rgba(255,250,250,0.58)_68%,rgba(255,250,250,0.14)_100%)]"
          aria-hidden
        />
        <div
          className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#fff9f9] to-transparent"
          aria-hidden
        />
        <Container className="relative flex max-w-[1180px] pb-16 pt-10 sm:pt-16 lg:min-h-[calc(100vh-5rem)] lg:items-center lg:pb-24">
          <div className="max-w-3xl">
            <p className="w-fit rounded-full border border-[#d41224]/14 bg-white/70 px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[#a61222] shadow-sm backdrop-blur">
              Kenya school supplies, simplified
            </p>
            <h1 className="mt-5 max-w-[12ch] text-[3.05rem] font-semibold leading-[0.98] tracking-normal text-[#23060a] sm:text-6xl lg:text-7xl">
              Learn ready. Term ready.
            </h1>
            <p className="mt-5 max-w-2xl text-base font-medium leading-relaxed text-[#654046] sm:text-lg lg:text-xl">
              Order CBC books, exam practice, stationery, and classroom essentials from TOPNOTE PUBLISHERS with fast WhatsApp support and dependable delivery across Kenya.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <TrackedWhatsAppButton
                message={WHATSAPP_MESSAGES.order}
                sourcePage="/"
                variant="primary"
                className="min-w-[13rem] rounded-full bg-[#960817] px-7 text-white shadow-[0_18px_42px_rgba(127,7,18,0.26)] hover:bg-[#b20d1d]"
              >
                Order on WhatsApp
              </TrackedWhatsAppButton>
              <Button
                href="/products"
                variant="outline"
                className="min-w-[13rem] rounded-full border border-[#7f0712]/16 bg-white/86 px-7 text-[#7f0712] shadow-[0_14px_34px_rgba(91,12,22,0.1)] backdrop-blur hover:bg-white"
              >
                Browse catalog
              </Button>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-2.5">
              <LocationBadge />
              {["CBC-aligned books", "Exam practice", "Stationery and school packs"].map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-[#7f0712]/12 bg-white/72 px-3 py-1.5 text-xs font-semibold text-[#7f0712] shadow-sm backdrop-blur"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        </Container>
      </section>

      <section>
        <AnimatedStats items={statItems} />
      </section>

      <section className="bg-[#fff9f9] py-14 sm:py-16 lg:py-20">
        <Container className="max-w-[1180px]">
          <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
            <div>
              <SectionKicker>Human ordering help</SectionKicker>
              <h2 className="mt-4 max-w-lg text-3xl font-semibold leading-tight text-[#27070b] sm:text-4xl">
                Parents and schools need clarity before they buy.
              </h2>
              <p className="mt-4 max-w-xl text-sm leading-relaxed text-[#654046] sm:text-base">
                Whether you have one learner&apos;s book list or a full school order, TOPNOTE helps you confirm the right materials, ask a real person, and move from list to delivery without friction.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Button href="/for-parents" variant="outline" className="rounded-full border border-[#7f0712]/15 bg-white px-6 text-[#7f0712]">
                  For parents
                </Button>
                <Button href="/for-schools" variant="outline" className="rounded-full border border-[#7f0712]/15 bg-white px-6 text-[#7f0712]">
                  For schools
                </Button>
              </div>
            </div>
            <div className="relative min-h-[21rem] overflow-hidden rounded-lg bg-[#ffe9ec] shadow-[0_18px_50px_rgba(91,12,22,0.1)] sm:min-h-[23rem]">
              <Image
                src="/generated/topnote-ordering-help.png"
                alt="Organized school materials and ordering support"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
          </div>
        </Container>
      </section>

      <FeaturedProducts products={products} />

      <section className="bg-[#7f0712] py-10 text-white sm:py-12">
        <Container className="max-w-[1180px]">
          <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#ffd7dc]">Fast WhatsApp quotes</p>
              <h2 className="mt-2 max-w-2xl text-3xl font-semibold leading-tight sm:text-4xl">
                Send your school list. We will help turn it into an order.
              </h2>
            </div>
            <TrackedWhatsAppButton
              message="Hello, I have a school materials list. Please help me confirm availability and pricing."
              sourcePage="/"
              variant="primary"
              className="rounded-full bg-white px-6 text-[#7f0712] hover:bg-[#fff1f2]"
            >
              Start a list order
            </TrackedWhatsAppButton>
          </div>
        </Container>
      </section>

      <section className="bg-[#fff9f9] py-14 sm:py-16 lg:py-20">
        <Container className="max-w-[1180px]">
          <div className="grid gap-8 lg:grid-cols-[0.78fr_1.22fr] lg:items-start">
            <div>
              <SectionKicker>Blog posts</SectionKicker>
              <h2 className="mt-4 max-w-lg text-3xl font-semibold leading-tight text-[#27070b] sm:text-4xl">
                Helpful ordering notes before the term rush.
              </h2>
              <p className="mt-4 max-w-md text-sm leading-relaxed text-[#654046] sm:text-base">
                Quick reads for schools and parents planning materials, quantities, and revision routines before the busy season.
              </p>
              <Button
                href="/products"
                variant="outline"
                className="mt-6 rounded-full border border-[#7f0712]/15 bg-white px-6 text-[#7f0712] hover:bg-[#fff7f7]"
              >
                Browse materials
              </Button>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {articleLinks.map((post) => (
                <Link
                  key={post.title}
                  href={post.href}
                  className="group overflow-hidden rounded-lg border border-[#f1d7da] bg-white shadow-sm transition-[border-color,box-shadow,transform] duration-300 hover:-translate-y-1 hover:border-[#d41224]/30 hover:shadow-[0_18px_45px_rgba(91,12,22,0.12)]"
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-[#ffe9ec]">
                    <Image
                      src={post.image}
                      alt=""
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.05]"
                      style={{ objectPosition: post.objectPosition }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#27070b]/42 via-transparent to-transparent" aria-hidden />
                    <span className="absolute bottom-3 left-3 rounded-full bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#a61222] shadow-sm">
                      {post.label}
                    </span>
                  </div>
                  <div className="p-5">
                    <h3 className="text-lg font-semibold leading-tight text-[#27070b]">{post.title}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-[#654046]">{post.text}</p>
                    <span className="mt-5 inline-flex text-sm font-bold text-[#a61222] transition-transform duration-300 group-hover:translate-x-1">
                      Read note
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </Container>
      </section>

      <section className="relative isolate overflow-hidden bg-[#ffe9ec] py-14 sm:py-16 lg:py-20">
        <Image src="/testimonials/bright-sparks-school.png" alt="" fill sizes="100vw" className="object-cover opacity-20" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,249,249,0.96)_0%,rgba(255,241,243,0.92)_48%,rgba(255,232,235,0.96)_100%)]" aria-hidden />
        <Container className="relative max-w-[1180px]">
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
            <div className="rounded-lg border border-[#f1d7da] bg-white/86 p-5 shadow-[0_18px_50px_rgba(91,12,22,0.1)] backdrop-blur sm:p-7">
              <SectionKicker>Testimonials / proof points</SectionKicker>
              <h2 className="mt-4 max-w-lg text-3xl font-semibold leading-tight text-[#27070b] sm:text-4xl lg:text-5xl">
                Trusted for practical school supply support.
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-[#654046] sm:text-base">
                Schools and parents come to TOPNOTE when they need clear ordering help, quick confirmation, and dependable material supply before term pressure builds.
              </p>
              <div className="mt-6 grid grid-cols-3 gap-2">
                {[
                  ["50+", "schools"],
                  ["500+", "items"],
                  ["100%", "delivery help"],
                ].map(([value, label]) => (
                  <div key={label} className="rounded-md bg-[#fff1f2] p-3 text-center">
                    <p className="text-xl font-bold leading-none text-[#d41224]">{value}</p>
                    <p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-[#7f0712]">{label}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {testimonials.map((item) => (
                <figure
                  key={item.name}
                  className="relative overflow-hidden rounded-lg border border-[#f1d7da] bg-white p-5 shadow-[0_18px_42px_rgba(91,12,22,0.1)] md:min-h-[18rem]"
                >
                  <span className="absolute right-4 top-3 text-6xl font-serif leading-none text-[#ffe1e5]" aria-hidden>
                    &ldquo;
                  </span>
                  <blockquote className="relative text-sm font-medium leading-relaxed text-[#4d2a30]">
                    &ldquo;{item.quote}&rdquo;
                  </blockquote>
                  <figcaption className="relative mt-6 border-t border-[#f1d7da] pt-4">
                    <p className="text-sm font-bold text-[#7f0712]">{item.name}</p>
                    <p className="mt-1 text-xs font-medium text-[#8a5d63]">Verified ordering experience</p>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </Container>
      </section>

      <section className="bg-white py-14 sm:py-16 lg:py-20">
        <Container className="max-w-[1180px]">
          <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
            <div>
              <SectionKicker>Lead generation freebie</SectionKicker>
              <h2 className="mt-4 max-w-xl text-3xl font-semibold leading-tight text-[#27070b] sm:text-4xl">
                Get a quick term-order checklist before you buy.
              </h2>
              <p className="mt-4 max-w-xl text-sm leading-relaxed text-[#654046] sm:text-base">
                Tell us what grade or school level you are buying for, and TOPNOTE will guide you through books, exam papers, stationery, and any bulk order requirements.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <TrackedWhatsAppButton
                  message="Hello, please send me the term-order checklist and help me plan my materials."
                  sourcePage="/"
                  variant="primary"
                  className="rounded-full bg-[#7f0712] px-6 text-white hover:bg-[#a61222]"
                >
                  Request checklist
                </TrackedWhatsAppButton>
                <TrackedPhoneButton sourcePage="/" variant="outline" className="rounded-full border border-[#7f0712]/15 bg-white px-6 text-[#7f0712]" />
              </div>
              <div className="mt-8 rounded-lg border border-[#f1d7da] bg-[#fff8f8] p-5 shadow-sm sm:p-6">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#d41224]">Before you message</p>
                <h3 className="mt-2 text-xl font-semibold leading-tight text-[#27070b]">
                  Send these details for a faster quote.
                </h3>
                <ul className="mt-5 grid gap-3 text-sm leading-relaxed text-[#654046] sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                  {[
                    "Grade or class level",
                    "Book titles or subject list",
                    "Quantity for each item",
                    "Delivery town or school",
                    "Retail or bulk order",
                    "Preferred contact time",
                  ].map((item) => (
                    <li key={item} className="flex gap-3 rounded-md bg-white px-3 py-2.5 shadow-sm">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#7f0712] text-[11px] font-bold text-white">
                        ✓
                      </span>
                      <span className="font-medium">{item}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-5 grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
                  {[
                    ["Fast reply", "WhatsApp-first support"],
                    ["Clear total", "Unit prices and quantity"],
                    ["Delivery help", "Confirm next steps"],
                  ].map(([title, text]) => (
                    <div key={title} className="rounded-md border border-[#f1d7da] bg-white p-3">
                      <p className="text-sm font-bold text-[#7f0712]">{title}</p>
                      <p className="mt-1 text-xs leading-relaxed text-[#654046]">{text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="rounded-lg border border-[#f1d7da] bg-[#fff8f8] p-5 sm:p-6">
              <div className="relative mb-6 aspect-[16/9] overflow-hidden rounded-md bg-[#ffe9ec] shadow-sm">
                <Image
                  src="/generated/topnote-contact-form-support.png"
                  alt="School order checklist and contact support"
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                />
              </div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#d41224]">Contact form</p>
              <InquiryForm
                sourcePage="/"
                sourceType="general"
                defaultMessage="Hello, I need help choosing school materials. Please share availability and pricing."
                title="Ask TOPNOTE"
                description="Share the material list, grade, or school order you want help with."
                submitButtonClassName="rounded-full bg-[#7f0712] text-white hover:bg-[#a61222]"
              />
            </div>
          </div>
        </Container>
      </section>

      <section className="bg-[#fff1f2] py-14 sm:py-16 lg:py-20">
        <Container className="max-w-[1180px]">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <SectionKicker>Ask for the sale</SectionKicker>
              <h2 className="mt-4 max-w-2xl text-3xl font-semibold leading-tight text-[#27070b] sm:text-4xl">
                Ready to confirm your books, exams, or school supplies?
              </h2>
              <p className="mt-4 max-w-xl text-sm leading-relaxed text-[#654046] sm:text-base">
                Message TOPNOTE now with your list, quantity, and delivery location. We will respond with the next best step.
              </p>
            </div>
            <TrackedWhatsAppButton
              message={WHATSAPP_MESSAGES.order}
              sourcePage="/"
              variant="primary"
              className="rounded-full bg-[#7f0712] px-7 text-white hover:bg-[#a61222]"
            >
              Place an order
            </TrackedWhatsAppButton>
          </div>
        </Container>
      </section>
    </div>
  );
}
