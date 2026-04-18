import { Categories } from "@/components/sections/Categories";
import { FeaturedProducts } from "@/components/sections/FeaturedProducts";
import { FinalCta } from "@/components/sections/FinalCta";
import { Hero } from "@/components/sections/Hero";
import { StatsStrip } from "@/components/sections/StatsStrip";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { Testimonials } from "@/components/sections/Testimonials";
import { WhyChooseUs } from "@/components/sections/WhyChooseUs";
import { getFeaturedProducts } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function Home() {
  const featuredProducts = await getFeaturedProducts();

  return (
    <>
      <Hero />
      <StatsStrip />
      <Categories />
      <FeaturedProducts products={featuredProducts} />
      <HowItWorks />
      <WhyChooseUs />
      <Testimonials />
      <FinalCta />
    </>
  );
}
