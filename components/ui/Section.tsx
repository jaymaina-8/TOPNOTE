import { forwardRef, type ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/utils";

type SectionProps = ComponentPropsWithoutRef<"section"> & {
  children: React.ReactNode;
  /** White canvas vs very light neutral — use to alternate section rhythm on marketing pages. */
  surface?: "canvas" | "muted";
};

export const Section = forwardRef<HTMLElement, SectionProps>(function Section(
  { className, children, surface, ...rest },
  ref,
) {
  return (
    <section
      ref={ref}
      className={cn(
        "py-12 md:py-16 lg:py-20",
        surface === "canvas" && "bg-white",
        surface === "muted" && "bg-surface-muted",
        className,
      )}
      {...rest}
    >
      {children}
    </section>
  );
});
