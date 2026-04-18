import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

const variants = {
  primary:
    "bg-primary text-primary-foreground shadow-[var(--shadow-sm)] hover:bg-primary/92 active:bg-primary/95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
  secondary:
    "bg-neutral-100 text-neutral-900 shadow-[var(--shadow-sm)] hover:bg-neutral-200/90 active:bg-neutral-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-400",
  outline:
    "bg-white text-neutral-900 shadow-[var(--shadow-sm)] hover:bg-neutral-50 active:bg-neutral-100/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-400",
} as const;

const base =
  "inline-flex min-h-11 min-w-[44px] items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-center text-sm font-semibold transition-[color,background-color,border-color,box-shadow] disabled:pointer-events-none disabled:opacity-50";

type BaseProps = {
  variant?: keyof typeof variants;
  className?: string;
  children: ReactNode;
};

export type ButtonProps = BaseProps &
  (
    | ({ href: string } & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "className" | "children">)
    | ({ href?: undefined } & ButtonHTMLAttributes<HTMLButtonElement> & { className?: string })
  );

export function Button({ variant = "primary", className, children, href, ...rest }: ButtonProps) {
  const classes = cn(base, variants[variant], className);

  if (href !== undefined) {
    const anchorProps = rest as AnchorHTMLAttributes<HTMLAnchorElement>;
    const isInternal = href.startsWith("/") && !href.startsWith("//");
    if (isInternal) {
      return (
        <Link href={href} className={classes} {...anchorProps}>
          {children}
        </Link>
      );
    }
    return (
      <a href={href} className={classes} {...anchorProps}>
        {children}
      </a>
    );
  }

  const buttonProps = rest as ButtonHTMLAttributes<HTMLButtonElement>;
  return (
    <button type={buttonProps.type ?? "button"} className={classes} {...buttonProps}>
      {children}
    </button>
  );
}
