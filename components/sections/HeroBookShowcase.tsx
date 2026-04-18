"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { HERO_BOOK_PUBLIC_PATHS } from "@/lib/heroBookAssets";
import { cn } from "@/lib/utils";

const AUTOPLAY_MS = 13_000;
const TRANSITION_MS = 480;
const SLIDE_OFFSET_PX = 40;

/** Single source of truth for the stage wrapper — tall enough for 1.8×+ scaled composition; overflow visible so books are not clipped. */
const CAROUSEL_STAGE_CLASS =
  "relative min-h-[308px] w-full overflow-visible px-4 sm:px-6 lg:min-h-[min(62vh,640px)] lg:px-3 xl:px-4";

/** Paths from `lib/heroBookAssets.ts` — same files as `ROOT_PNG` in `scripts/remove-hero-book-matte.mjs` */
const R = HERO_BOOK_PUBLIC_PATHS[0];
const G = HERO_BOOK_PUBLIC_PATHS[1];
const T = HERO_BOOK_PUBLIC_PATHS[2];
const W = HERO_BOOK_PUBLIC_PATHS[3];

export type HeroShowcaseSlide = {
  id: string;
  label: string;
  desktop: { main: string; left: string; right: string };
  mobile:
    | { layout: "single"; main: string }
    | { layout: "pair"; front: string; back: string };
};

/** Four slides × 3 books each (Targeter-style layered composition). All paths verified under `public/hero-books/`. */
export const HERO_SHOWCASE_SLIDES: readonly HeroShowcaseSlide[] = [
  {
    id: "cluster-grade4",
    label: "Featured grade 4 and series",
    desktop: { main: W, left: G, right: T },
    mobile: { layout: "pair", front: W, back: G },
  },
  {
    id: "cluster-red",
    label: "Featured reds and series",
    desktop: { main: R, left: W, right: G },
    mobile: { layout: "single", main: R },
  },
  {
    id: "cluster-green",
    label: "Featured greens and series",
    desktop: { main: G, left: R, right: T },
    mobile: { layout: "pair", front: G, back: T },
  },
  {
    id: "cluster-teal",
    label: "Featured teal and series",
    desktop: { main: T, left: W, right: R },
    mobile: { layout: "single", main: T },
  },
];

/** Same vertical offset (8px) for direction; blur/opacity differ for depth. */
const softShadow = "drop-shadow-[0_8px_18px_rgba(15,23,42,0.08)]";
const softShadowMain = "drop-shadow-[0_8px_40px_rgba(15,23,42,0.24)]";

/** Stronger separation on small screens — books read clearly on white. */
const mobileShadowSide =
  "drop-shadow-[0_10px_24px_rgba(15,23,42,0.14)] drop-shadow-[0_2px_6px_rgba(15,23,42,0.07)]";
const mobileShadowMain =
  "drop-shadow-[0_12px_32px_rgba(15,23,42,0.3)] drop-shadow-[0_4px_10px_rgba(15,23,42,0.1)]";

const mobileImgClear = "brightness-[1.02] contrast-[1.04]";

function BookImg({
  src,
  alt,
  className,
  priority,
}: {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
}) {
  return (
    <img
      src={src}
      alt={alt}
      width={520}
      height={720}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      draggable={false}
      className={cn("pointer-events-none h-auto w-full object-contain select-none", className)}
    />
  );
}

/** Desktop: grouped 3-book cluster — overlap pulls sides toward main; sides behind main, main sizing unchanged. */
function DesktopComposition({
  slide,
  priority,
}: {
  slide: HeroShowcaseSlide["desktop"];
  priority: boolean;
}) {
  const { main, left, right } = slide;
  const side = cn(
    "relative w-[30%] max-w-[280px] min-w-0 shrink-0 origin-bottom opacity-[0.95]",
    "scale-[0.84] lg:scale-[0.86]",
    softShadow,
  );
  /** Stronger overlap (~12%) — sides sit closer to main; grouped cluster, main unchanged. */
  const overlapIn =
    "[margin-right:-4.25rem] sm:[margin-right:-4.5rem] md:[margin-right:-4.75rem] lg:[margin-right:-5rem] xl:[margin-right:-5.25rem]";
  const overlapOut =
    "[margin-left:-4.25rem] sm:[margin-left:-4.5rem] md:[margin-left:-4.75rem] lg:[margin-left:-5rem] xl:[margin-left:-5.25rem]";

  return (
    <div className="mx-auto flex w-full max-w-full flex-col justify-center pb-1 pt-1">
      <div className="hero-books-row min-h-[min(44vh,420px)] w-full max-w-full sm:min-h-[min(46vh,440px)] lg:min-h-[min(52vh,520px)]">
        {/* Left: behind main; rotation + scale only — baseline via .hero-books-row */}
        <div
          className={cn(
            side,
            "z-[10] -rotate-[7deg]",
            overlapIn,
          )}
        >
          <BookImg src={left} alt="" priority={priority} />
        </div>
        {/* Main: dominant; center/front */}
        <div
          className={cn(
            "z-[30] w-[52%] max-w-[400px] min-w-[200px] shrink-0 lg:min-w-[220px]",
            softShadowMain,
          )}
        >
          <BookImg src={main} alt="" priority={priority} />
        </div>
        {/* Right: mirror left */}
        <div className={cn(side, "z-[10] rotate-[7deg]", overlapOut)}>
          <BookImg src={right} alt="" />
        </div>
      </div>
    </div>
  );
}

/** Mobile / sm: single or layered pair — full-width friendly, shared baseline, grouped overlap. */
function MobileComposition({
  slide,
  priority,
}: {
  slide: HeroShowcaseSlide["mobile"];
  priority: boolean;
}) {
  if (slide.layout === "single") {
    return (
      <div className="relative mx-auto flex min-h-[min(46vh,360px)] w-full max-w-[min(100%,26rem)] items-center justify-center px-2 pb-3 pt-1 sm:min-h-[min(44vh,380px)] sm:px-3">
        <div className={cn("w-[min(98%,23rem)] max-w-[380px] sm:max-w-[400px]", mobileShadowMain)}>
          <BookImg src={slide.main} alt="" priority={priority} className={mobileImgClear} />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[min(46vh,360px)] w-full max-w-[min(100%,28rem)] items-center justify-center px-2 pb-3 pt-1 sm:min-h-[min(44vh,400px)] sm:px-4">
      <div className="hero-books-row w-full max-w-[min(100%,24rem)] -translate-x-0.5 sm:max-w-[26rem] sm:-translate-x-1">
        <div
          className={cn(
            "z-[10] w-[44%] max-w-[172px] shrink-0 origin-bottom -rotate-[6deg] scale-[0.95] [margin-right:-3.25rem] sm:w-[43%] sm:max-w-[184px] sm:-rotate-[7deg] sm:scale-[0.94] sm:[margin-right:-3.5rem]",
            mobileShadowSide,
          )}
        >
          <BookImg src={slide.back} alt="" className={mobileImgClear} />
        </div>
        <div
          className={cn(
            "z-[30] w-[56%] max-w-[300px] min-w-[168px] shrink-0 sm:min-w-[180px]",
            mobileShadowMain,
          )}
        >
          <BookImg src={slide.front} alt="" priority={priority} className={mobileImgClear} />
        </div>
      </div>
    </div>
  );
}

function SlideFrame({ slide, priority }: { slide: HeroShowcaseSlide; priority: boolean }) {
  return (
    <div className="w-full bg-white" aria-hidden>
      <div className="hidden w-full justify-center overflow-visible lg:flex">
        <div className="hero-books-composition-scale w-full max-w-full">
          <DesktopComposition slide={slide.desktop} priority={priority} />
        </div>
      </div>
      <div className="flex w-full justify-center overflow-visible pb-1 pt-1 lg:hidden">
        <div className="flex min-h-[min(46vh,360px)] w-full max-w-full items-center justify-center overflow-visible sm:min-h-[min(44vh,400px)]">
          <div className="hero-books-mobile-scale max-w-full">
            <MobileComposition slide={slide.mobile} priority={priority} />
          </div>
        </div>
      </div>
    </div>
  );
}

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return reduced;
}

function ShowcaseNavArrow({
  direction,
  label,
  disabled,
  onClick,
}: {
  direction: "prev" | "next";
  label: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "absolute top-[46%] z-[40] -translate-y-1/2 lg:top-[42%]",
        "flex h-8 w-8 items-center justify-center rounded-full border border-neutral-200/90 bg-white/95 text-neutral-500 shadow-sm backdrop-blur-sm sm:h-9 sm:w-9",
        "transition-colors hover:border-primary hover:text-primary",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
        "disabled:pointer-events-none disabled:opacity-35",
        direction === "prev"
          ? "left-0.5 sm:left-1 lg:left-3 xl:left-4"
          : "right-0.5 sm:right-1 lg:right-3 xl:right-4",
      )}
    >
      <svg
        className="h-4 w-4 sm:h-[1.15rem] sm:w-[1.15rem]"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
        aria-hidden
      >
        {direction === "prev" ? (
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        ) : (
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        )}
      </svg>
    </button>
  );
}

export function HeroBookShowcase({ className }: { className?: string }) {
  const slides = useMemo(() => [...HERO_SHOWCASE_SLIDES], []);
  const count = slides.length;
  const [visible, setVisible] = useState(0);
  const [pair, setPair] = useState<{ from: number; to: number } | null>(null);
  const [pairPhase, setPairPhase] = useState(false);
  const reducedMotion = usePrefersReducedMotion();
  const transitioningRef = useRef(false);
  const activeDot = pair ? pair.to : visible;

  const transitionTo = useCallback(
    (nextIndex: number) => {
      if (nextIndex === visible || nextIndex < 0 || nextIndex >= count) return;
      if (transitioningRef.current) return;
      if (reducedMotion) {
        setVisible(nextIndex);
        return;
      }
      transitioningRef.current = true;
      setPair({ from: visible, to: nextIndex });
    },
    [count, visible, reducedMotion],
  );

  useLayoutEffect(() => {
    if (!pair) {
      setPairPhase(false);
      return;
    }
    setPairPhase(false);
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => setPairPhase(true));
    });
    return () => cancelAnimationFrame(id);
  }, [pair]);

  useEffect(() => {
    if (!pair) return undefined;
    const id = window.setTimeout(() => {
      setVisible(pair.to);
      setPair(null);
      transitioningRef.current = false;
    }, TRANSITION_MS);
    return () => window.clearTimeout(id);
  }, [pair]);

  const tick = useCallback(() => {
    transitionTo((visible + 1) % count);
  }, [transitionTo, visible, count]);

  const goPrev = useCallback(() => {
    transitionTo((visible - 1 + count) % count);
  }, [transitionTo, visible, count]);

  const goNextManual = useCallback(() => {
    transitionTo((visible + 1) % count);
  }, [transitionTo, visible, count]);

  useEffect(() => {
    if (count <= 1) return undefined;
    const id = window.setInterval(tick, AUTOPLAY_MS);
    return () => window.clearInterval(id);
  }, [count, tick]);

  const ease = "cubic-bezier(0.22, 1, 0.36, 1)";
  const transitionStyle =
    reducedMotion || !pair
      ? "none"
      : `opacity ${TRANSITION_MS}ms ${ease}, transform ${TRANSITION_MS}ms ${ease}`;

  const navDisabled = !!pair;

  /** Only render arrow controls after mount so SSR and first client paint match (avoids hydration noise). */
  const [clientNav, setClientNav] = useState(false);
  useEffect(() => {
    setClientNav(true);
  }, []);

  return (
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label="Featured book showcase"
      className={cn("relative w-full min-w-0 overflow-visible bg-white", className)}
    >
      <div className={CAROUSEL_STAGE_CLASS}>
        {clientNav ? (
          <>
            <ShowcaseNavArrow
              direction="prev"
              label="Previous slide"
              disabled={navDisabled}
              onClick={goPrev}
            />
            <ShowcaseNavArrow
              direction="next"
              label="Next slide"
              disabled={navDisabled}
              onClick={goNextManual}
            />
          </>
        ) : null}

        {!pair && (
          <div key={`idle-${visible}`} className="relative w-full">
            <SlideFrame slide={slides[visible]} priority={visible === 0} />
          </div>
        )}

        {pair && (
          <div className="relative min-h-[308px] w-full lg:min-h-[min(62vh,640px)]">
            {/* Outgoing whole composition (entire slide moves together) */}
            <div
              className="absolute inset-0 w-full"
              style={{
                transition: transitionStyle,
                opacity: pairPhase ? 0 : 1,
                transform: pairPhase ? `translateX(-${SLIDE_OFFSET_PX}px)` : "translateX(0)",
              }}
            >
              <SlideFrame slide={slides[pair.from]} priority={false} />
            </div>
            {/* Incoming whole composition */}
            <div
              className="absolute inset-0 w-full"
              style={{
                transition: transitionStyle,
                opacity: pairPhase ? 1 : 0,
                transform: pairPhase ? "translateX(0)" : `translateX(${SLIDE_OFFSET_PX}px)`,
              }}
            >
              <SlideFrame slide={slides[pair.to]} priority={pair.to === 0} />
            </div>
          </div>
        )}
      </div>

      <div className="mt-3 flex justify-center gap-1.5 pb-1 lg:mt-3" role="group" aria-label="Slide indicators">
        {slides.map((s, i) => (
          <button
            key={s.id}
            type="button"
            aria-pressed={i === activeDot}
            aria-label={`Show slide ${i + 1} of ${count}: ${s.label}`}
            disabled={!!pair}
            className={cn(
              "h-1.5 rounded-full transition-[width,background-color] duration-300 disabled:cursor-wait",
              i === activeDot ? "w-6 bg-primary/80" : "w-1.5 bg-neutral-300/90 hover:bg-neutral-400",
            )}
            onClick={() => transitionTo(i)}
          />
        ))}
      </div>
    </div>
  );
}

/** Alias (professional product showcase slider). */
export const HeroBookSlider = HeroBookShowcase;
