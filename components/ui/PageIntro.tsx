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
        align === "center" && "mx-auto max-w-2xl text-center",
        align === "left" && "max-w-2xl",
        className,
      )}
    >
      {eyebrow ? (
        <p className="text-xs font-semibold uppercase tracking-wider text-primary">{eyebrow}</p>
      ) : null}
      <h1
        className={cn(
          "text-balance text-3xl font-bold tracking-tight text-neutral-900 md:text-4xl",
          eyebrow && "mt-2",
        )}
      >
        {title}
      </h1>
      {subtitle ? (
        <p className="mt-2 text-sm font-semibold text-neutral-800 md:text-base">{subtitle}</p>
      ) : null}
      {description ? (
        <p className="mt-4 text-pretty text-base leading-relaxed text-neutral-600 md:text-lg">{description}</p>
      ) : null}
      {children}
    </header>
  );
}
