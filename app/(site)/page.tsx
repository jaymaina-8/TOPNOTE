import { SeedInspiredHome } from "@/components/sections/SeedInspiredHome";
import { getFeaturedProducts } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function Home() {
  const featuredProducts = await getFeaturedProducts();

  return <SeedInspiredHome products={featuredProducts} />;
}
