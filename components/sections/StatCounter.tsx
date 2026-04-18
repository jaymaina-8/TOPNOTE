"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";

const DURATION_MS = 1400;

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function subscribeReducedMotion(callback: () => void): () => void {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", callback);
  return () => mq.removeEventListener("change", callback);
}

function getReducedMotionSnapshot(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(subscribeReducedMotion, getReducedMotionSnapshot, () => false);
}

type AnimatedStatValueProps = {
  target: number;
  /** When true, count up from 0 to target (ignored if reduced motion). */
  active: boolean;
  prefersReducedMotion: boolean;
};

/**
 * Renders the numeric part only; animates once when `active` becomes true.
 */
export function AnimatedStatValue({ target, active, prefersReducedMotion }: AnimatedStatValueProps) {
  const [display, setDisplay] = useState(0);
  const ranRef = useRef(false);

  const shown = prefersReducedMotion ? target : display;

  useEffect(() => {
    if (prefersReducedMotion) return;
    if (!active || ranRef.current) return;
    ranRef.current = true;

    let start: number | null = null;
    let raf = 0;

    const tick = (now: number) => {
      if (start === null) start = now;
      const elapsed = now - start;
      const t = Math.min(1, elapsed / DURATION_MS);
      const eased = easeOutCubic(t);
      setDisplay(Math.round(eased * target));
      if (t < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        setDisplay(target);
      }
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, prefersReducedMotion, target]);

  return <span className="tabular-nums">{shown}</span>;
}
