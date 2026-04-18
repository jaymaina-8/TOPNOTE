"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

import { Button } from "@/components/ui/Button";
import { buildTrackAndRedirectUrl } from "@/lib/conversion/urls";
import { createWhatsAppLink, PHONE_DISPLAY, PHONE_TEL_HREF } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";

/**
 * Resolves `source_page` for tracking without hydration mismatches:
 * - When `sourcePage` is passed from the server, it is stable for SSR + hydration.
 * - Otherwise we omit `source_page` until after mount, then use `usePathname()`
 *   (Next.js can disagree with the server for pathname during static prerender / rewrites).
 */
function useTrackedSourcePage(explicit?: string): string | undefined {
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname() ?? "/";

  useEffect(() => {
    // Intentional: omit source_page until client mount so SSR matches first paint (Next.js pathname can differ).
    // eslint-disable-next-line react-hooks/set-state-in-effect -- mount gate for stable tracked href hydration
    setMounted(true);
  }, []);

  if (explicit?.trim()) {
    return explicit.trim();
  }
  if (!mounted) {
    return undefined;
  }
  return pathname;
}

type ButtonVariant = "primary" | "secondary" | "outline";

type TrackedBase = {
  /** When omitted, the current pathname is used. */
  sourcePage?: string;
  sourceProductId?: string;
};

type TrackedWhatsAppProps = TrackedBase & {
  message: string;
  variant?: ButtonVariant;
  className?: string;
  children: ReactNode;
};

export function TrackedWhatsAppButton({
  message,
  sourcePage,
  sourceProductId,
  variant = "primary",
  className,
  children,
}: TrackedWhatsAppProps) {
  const page = useTrackedSourcePage(sourcePage);
  const dest = createWhatsAppLink(message);
  const href = buildTrackAndRedirectUrl({
    event: "whatsapp_click",
    to: dest,
    sourcePage: page,
    sourceProductId,
  });
  return (
    <Button href={href} variant={variant} className={className}>
      {children}
    </Button>
  );
}

type TrackedPhoneButtonProps = TrackedBase & {
  variant?: ButtonVariant;
  className?: string;
  /** Used when `children` is omitted; defaults to “Call …” using PHONE_DISPLAY. */
  label?: string;
  children?: ReactNode;
};

export function TrackedPhoneButton({
  sourcePage,
  sourceProductId,
  variant = "primary",
  className,
  label,
  children,
}: TrackedPhoneButtonProps) {
  const page = useTrackedSourcePage(sourcePage);
  const href = buildTrackAndRedirectUrl({
    event: "phone_click",
    to: PHONE_TEL_HREF,
    sourcePage: page,
    sourceProductId,
  });
  return (
    <Button href={href} variant={variant} className={className}>
      {children ?? label ?? `Call ${PHONE_DISPLAY}`}
    </Button>
  );
}

type TrackedPhoneLinkProps = TrackedBase & {
  className?: string;
  children: ReactNode;
};

export function TrackedPhoneLink({ sourcePage, sourceProductId, className, children }: TrackedPhoneLinkProps) {
  const page = useTrackedSourcePage(sourcePage);
  const href = buildTrackAndRedirectUrl({
    event: "phone_click",
    to: PHONE_TEL_HREF,
    sourcePage: page,
    sourceProductId,
  });
  return (
    <a href={href} className={cn(className)}>
      {children}
    </a>
  );
}
