import Link from "next/link";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
};

export function DashboardPageHeader({ eyebrow, title, description, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {eyebrow ? <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">{eyebrow}</p> : null}
        <h1 className="mt-1 text-2xl font-black tracking-tight text-neutral-950 md:text-3xl">{title}</h1>
        {description ? <div className="mt-2 max-w-3xl text-sm leading-relaxed text-neutral-600">{description}</div> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

type DashboardButtonProps = {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary";
  className?: string;
};

export function DashboardButton({ href, children, variant = "primary", className }: DashboardButtonProps) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex min-h-10 items-center justify-center rounded-lg px-4 text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
        variant === "primary"
          ? "bg-neutral-950 text-white hover:bg-neutral-800"
          : "border border-neutral-200 bg-white text-neutral-800 hover:bg-neutral-50",
        className,
      )}
    >
      {children}
    </Link>
  );
}

type PanelProps = {
  children: ReactNode;
  className?: string;
};

export function DashboardPanel({ children, className }: PanelProps) {
  return (
    <section className={cn("rounded-xl border border-neutral-200 bg-white shadow-sm", className)}>
      {children}
    </section>
  );
}

type StatCardProps = {
  label: string;
  value: ReactNode;
  tone?: "default" | "red" | "green" | "amber" | "sky";
};

const toneClasses = {
  default: "bg-neutral-100 text-neutral-700",
  red: "bg-primary/10 text-primary",
  green: "bg-emerald-50 text-emerald-700",
  amber: "bg-amber-50 text-amber-700",
  sky: "bg-sky-50 text-sky-700",
} as const;

export function DashboardStatCard({ label, value, tone = "default" }: StatCardProps) {
  return (
    <li className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-neutral-500">{label}</p>
        <span className={cn("h-2.5 w-2.5 rounded-full", toneClasses[tone])} aria-hidden />
      </div>
      <p className="mt-3 text-3xl font-black tabular-nums tracking-tight text-neutral-950">{value}</p>
    </li>
  );
}

type EmptyStateProps = {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
};

export function DashboardEmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="rounded-xl border border-dashed border-neutral-300 bg-white px-4 py-10 text-center">
      <p className="text-sm font-bold text-neutral-900">{title}</p>
      {description ? <div className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-neutral-600">{description}</div> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function DashboardAlert({
  children,
  tone = "amber",
}: {
  children: ReactNode;
  tone?: "amber" | "red";
}) {
  return (
    <div
      className={cn(
        "mt-6 rounded-xl border px-4 py-3 text-sm",
        tone === "amber" ? "border-amber-200 bg-amber-50 text-amber-950" : "border-red-200 bg-red-50 text-red-950",
      )}
      role="alert"
    >
      {children}
    </div>
  );
}
