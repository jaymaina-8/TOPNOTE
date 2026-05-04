import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export type PageIntroProps = {
  title: ReactNode;
  /** Short line under the title (e.g. category focus). */
  subtitle?: ReactNode;
  description?: ReactNode;
  eyebrow?: string;
  align?: "center" | "left";
  className?: string;
  children?: ReactNode;
};

export function PageIntro({
  title,
  subtitle,
  description,
  eyebrow,
  align = "center",
  className,
  children,
}: PageIntroProps) {
  return (
    <header
      className={cn(
        "publisher-page-intro",
        align === "center" && "mx-auto max-w-2xl text-center",
        align === "left" && "max-w-2xl",
        className,
      )}
    >
      {eyebrow ? (
        <p className="inline-flex rounded-full border border-primary/15 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary shadow-[var(--shadow-sm)]">
          {eyebrow}
        </p>
      ) : null}
      <h1
        className={cn(
          "text-balance text-3xl font-bold tracking-tight text-neutral-950 md:text-4xl lg:text-5xl",
          eyebrow && "mt-4",
        )}
      >
        {title}
      </h1>
      {subtitle ? (
        <p className="mt-3 text-sm font-semibold text-primary md:text-base">{subtitle}</p>
      ) : null}
      {description ? (
        <p className="mt-4 text-pretty text-base leading-relaxed text-neutral-600 md:text-lg">{description}</p>
      ) : null}
      {children}
    </header>
  );
}
