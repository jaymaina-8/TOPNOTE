"use client";

import { useEffect, useRef, useState } from "react";

export type AnimatedStatItem = {
  value: number;
  suffix?: string;
  label: string;
};

type AnimatedStatsProps = {
  items: readonly AnimatedStatItem[];
  compact?: boolean;
};

function useCountUp(target: number) {
  const [value, setValue] = useState(0);
  const nodeRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    let frame = 0;
    let startTime: number | null = null;
    const duration = 1250;

    const animate = (time: number) => {
      if (startTime === null) {
        startTime = time;
      }

      const progress = Math.min((time - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased));

      if (progress < 1) {
        frame = requestAnimationFrame(animate);
      }
    };

    frame = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(frame);
    };
  }, [target]);

  return { value, nodeRef };
}

function AnimatedNumber({ item, compact }: { item: AnimatedStatItem; compact?: boolean }) {
  const { value, nodeRef } = useCountUp(item.value);

  return (
    <div
      className={
        compact
          ? "border-r border-[#f1d7da] px-3 py-3 last:border-r-0"
          : "flex min-h-[9rem] flex-col items-center justify-center px-5 py-8 text-center"
      }
    >
      <p
        className={
          compact
            ? "text-lg font-semibold leading-none text-[#7f0712]"
            : "text-4xl font-bold leading-none tracking-normal text-[#ed1028] sm:text-5xl"
        }
      >
        <span ref={nodeRef}>{value}</span>
        {item.suffix ? <span>{item.suffix}</span> : null}
      </p>
      <p
        className={
          compact
            ? "mt-1 text-[10px] font-medium leading-tight text-[#654046]"
            : "mt-8 text-[11px] font-bold uppercase tracking-[0.18em] text-[#202020]"
        }
      >
        {item.label}
      </p>
      {!compact ? <span className="mt-5 h-0.5 w-14 bg-[#ed1028]" aria-hidden /> : null}
    </div>
  );
}

export function AnimatedStats({ items, compact = false }: AnimatedStatsProps) {
  if (compact) {
    return (
      <dl className="grid grid-cols-2 overflow-hidden rounded-lg border border-[#f1d7da] bg-[#fff8f8] min-[420px]:grid-cols-4">
        {items.map((item) => (
          <AnimatedNumber key={item.label} item={item} compact />
        ))}
      </dl>
    );
  }

  return (
    <div className="border-y border-[#ececec] bg-[#f8f8f8]">
      <div className="mx-auto grid max-w-[1180px] grid-cols-1 divide-y divide-[#ececec] min-[420px]:grid-cols-2 min-[420px]:divide-x min-[420px]:divide-y-0 md:grid-cols-4">
        {items.map((item) => (
          <AnimatedNumber key={item.label} item={item} />
        ))}
      </div>
    </div>
  );
}
