"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";

import { cn } from "@/lib/utils";

type FadeInWhenVisibleProps = {
  children: ReactNode;
  className?: string;
  /** Stagger delay after the element becomes visible (ms). */
  delayMs?: number;
};

function subscribeReducedMotion(onChange: () => void) {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

function getReducedMotionClientSnapshot() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function getReducedMotionServerSnapshot() {
  return false;
}

export function FadeInWhenVisible({ children, className, delayMs = 0 }: FadeInWhenVisibleProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const prefersReducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionClientSnapshot,
    getReducedMotionServerSnapshot,
  );

  useEffect(() => {
    if (prefersReducedMotion) return;

    const el = ref.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -32px 0px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [prefersReducedMotion]);

  const show = prefersReducedMotion || visible;

  return (
    <div
      ref={ref}
      className={cn(
        "transition-[opacity,transform] duration-700 ease-out motion-reduce:transition-none",
        show ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0",
        className,
      )}
      style={show && delayMs > 0 ? { transitionDelay: `${delayMs}ms` } : undefined}
    >
      {children}
    </div>
  );
}
