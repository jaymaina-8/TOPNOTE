"use client";

import { useEffect, useRef, useState } from "react";

import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { STATS_STRIP_ITEMS } from "@/lib/content/statsStrip";

import { AnimatedStatValue, usePrefersReducedMotion } from "./StatCounter";

export function StatsStrip() {
  const sectionRef = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);
  const prefersReducedMotion = usePrefersReducedMotion();
  const animationActive = prefersReducedMotion || inView;

  useEffect(() => {
    if (prefersReducedMotion) return;
    const el = sectionRef.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setInView(true);
          obs.disconnect();
        }
      },
      { threshold: 0.2, rootMargin: "0px 0px -8% 0px" },
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, [prefersReducedMotion]);

  return (
    <Section
      ref={sectionRef}
      surface="canvas"
      className="border-b border-neutral-200/80 bg-neutral-50/50 py-14 md:py-16 lg:py-20"
    >
      <Container>
        <div className="mx-auto max-w-6xl">
          <ul className="grid grid-cols-2 gap-x-6 gap-y-12 sm:gap-x-8 md:gap-y-14 lg:grid-cols-4 lg:gap-x-10 lg:gap-y-0">
            {STATS_STRIP_ITEMS.map((item) => (
              <li key={item.label} className="flex flex-col text-center">
                <div className="flex min-h-[3.25rem] items-baseline justify-center gap-0.5 sm:min-h-[3.5rem] md:min-h-[4rem]">
                  <span className="text-[clamp(1.75rem,5vw,2.75rem)] font-bold leading-none tracking-tight text-primary">
                    <AnimatedStatValue
                      target={item.value}
                      active={animationActive}
                      prefersReducedMotion={prefersReducedMotion}
                    />
                  </span>
                  <span className="text-[clamp(1.125rem,3vw,1.75rem)] font-bold leading-none text-primary">
                    {item.suffix}
                  </span>
                </div>
                <p className="mt-4 text-[0.65rem] font-semibold uppercase leading-snug tracking-[0.12em] text-neutral-700 sm:text-xs">
                  {item.label}
                </p>
                <div
                  className="mx-auto mt-3 h-[2px] w-[60px] shrink-0 bg-primary sm:mt-4"
                  aria-hidden
                />
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </Section>
  );
}
