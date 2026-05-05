import { CartNotification } from "@/components/cart/CartNotification";
import { FloatingActions } from "@/components/layout/FloatingActions";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";

/**
 * Public marketing site chrome. Internal tools live under `/dashboard/*` (legacy `/admin` and `/inquiries` URLs redirect there via `next.config.ts`).
 */
export default function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <Navbar />
      <main className="flex-1 max-md:pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))]">{children}</main>
      <Footer />
      <FloatingActions />
      <CartNotification />
    </>
  );
}
