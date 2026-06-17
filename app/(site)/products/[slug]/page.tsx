import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AddToCartButton } from "@/components/cart/AddToCartButton";
import { TrackedPhoneButton, TrackedWhatsAppButton } from "@/components/ctas/TrackedCtas";
import { InquiryForm } from "@/components/forms/InquiryForm";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { excerptText, formatKesPrice } from "@/lib/format";
import { getProductBySlug } from "@/lib/queries";
import { PHONE_DISPLAY, productDetailWhatsAppMessage } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ slug: string }>;
};

const DESCRIPTION_FALLBACK =
  "Contact us on WhatsApp for full details, availability, and delivery options.";

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) {
    return { title: "Product not found" };
  }
  const desc = excerptText(product.description, 155, DESCRIPTION_FALLBACK);
  return {
    title: `${product.name} | TOPNOTE PUBLISHERS`,
    description: desc,
  };
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) {
    notFound();
  }

  const categoryName = product.categories?.name ?? "Catalog";
  const bodyText = product.description?.trim() ? product.description : DESCRIPTION_FALLBACK;

  return (
    <Section surface="canvas">
      <Container>
        <nav className="text-sm text-neutral-600" aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-1.5">
            <li>
              <Link href="/" className="font-medium transition-colors hover:text-neutral-900">
                Home
              </Link>
            </li>
            <li aria-hidden className="text-neutral-400">
              /
            </li>
            <li>
              <Link href="/products" className="font-medium transition-colors hover:text-neutral-900">
                Products
              </Link>
            </li>
            <li aria-hidden className="text-neutral-400">
              /
            </li>
            <li className="font-semibold text-neutral-900">{product.name}</li>
          </ol>
        </nav>

        <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-start lg:gap-12">
          <div className="overflow-hidden rounded-2xl bg-neutral-50 shadow-[var(--shadow-sm)]">
            {product.image_url ? (
              <div className="relative aspect-[4/3] w-full">
                <Image
                  src={product.image_url}
                  alt={product.name}
                  fill
                  priority
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              </div>
            ) : (
              <div
                className="flex aspect-[4/3] items-center justify-center text-neutral-400"
                role="img"
                aria-label={`${product.name} — image coming soon`}
              >
                <span className="text-sm">Image coming soon</span>
              </div>
            )}
          </div>

          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">{categoryName}</p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-neutral-900 md:text-4xl">{product.name}</h1>
            <p className="mt-5 text-2xl font-semibold tabular-nums tracking-tight text-neutral-900">{formatKesPrice(product.price)}</p>
            {product.grade ? (
              <p className="mt-2 text-sm text-neutral-600">
                <span className="font-medium text-neutral-800">Grade / level:</span> {product.grade}
              </p>
            ) : null}
            {product.bookSubcategory ? (
              <p className="mt-2 text-sm text-neutral-600">
                <span className="font-medium text-neutral-800">Book type:</span> {product.bookSubcategory.name}
              </p>
            ) : null}
            <div className="mt-6 space-y-4 text-base leading-relaxed text-neutral-700">
              {bodyText.split("\n").map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <AddToCartButton
                item={{
                  id: product.id,
                  name: product.name,
                  slug: product.slug,
                  price: product.price,
                  imageUrl: product.image_url,
                  categoryName,
                }}
                className="w-full sm:w-auto"
              />
              <TrackedWhatsAppButton
                message={productDetailWhatsAppMessage(product.name)}
                sourcePage={`/products/${slug}`}
                sourceProductId={product.id}
                variant="primary"
                className="w-full sm:w-auto"
              >
                WhatsApp us about this product
              </TrackedWhatsAppButton>
              <TrackedPhoneButton
                sourcePage={`/products/${slug}`}
                sourceProductId={product.id}
                variant="outline"
                className="w-full sm:w-auto"
                label={`Call ${PHONE_DISPLAY}`}
              />
            </div>

            <div className="mt-10 rounded-2xl bg-white p-6 shadow-[var(--shadow-sm)] md:p-8">
              <h2 className="text-lg font-bold text-neutral-900">Send an inquiry</h2>
              <p className="mt-2 text-sm leading-relaxed text-neutral-600">
                Prefer a written note? We’ll reply by phone or WhatsApp.
              </p>
              <InquiryForm
                className="mt-4"
                sourceProductId={product.id}
                productName={product.name}
                sourcePage={`/products/${slug}`}
                sourceType="product"
              />
            </div>

            <p className="mt-8">
              <Link href="/products" className="text-sm font-semibold text-primary underline-offset-4 transition-colors hover:underline">
                ← Back to all products
              </Link>
            </p>
          </div>
        </div>
      </Container>
    </Section>
  );
}
