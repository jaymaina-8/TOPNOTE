import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type SectionHeadingProps = {
  title: string;
  description?: ReactNode;
  eyebrow?: string;
  align?: "center" | "left";
  className?: string;
};

export function SectionHeading({ title, description, eyebrow, align = "center", className }: SectionHeadingProps) {
  return (
    <div
      className={cn(
        align === "center" && "mx-auto max-w-2xl text-center",
        align === "left" && "max-w-2xl",
        className,
      )}
    >
      {eyebrow ? (
        <p className="text-xs font-semibold uppercase tracking-wider text-primary">{eyebrow}</p>
      ) : null}
      <h2 className={cn("text-2xl font-bold tracking-tight text-neutral-900 md:text-3xl", eyebrow && "mt-2")}>
        {title}
      </h2>
      {description ? (
        <p className="mt-4 text-pretty text-base leading-relaxed text-neutral-600 md:text-lg">{description}</p>
      ) : null}
    </div>
  );
}
