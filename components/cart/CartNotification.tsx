"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type CartAddDetail = {
  itemName?: string;
  quantity?: number;
};

type ToastState = {
  id: number;
  itemName: string;
  quantity: number;
};

export function CartNotification() {
  const [toast, setToast] = useState<ToastState | null>(null);

  useEffect(() => {
    let timeoutId: number | undefined;

    const handleCartAdd = (event: Event) => {
      const detail = (event as CustomEvent<CartAddDetail>).detail;

      window.clearTimeout(timeoutId);
      setToast({
        id: Date.now(),
        itemName: detail?.itemName?.trim() || "Product",
        quantity: detail?.quantity ?? 1,
      });

      timeoutId = window.setTimeout(() => {
        setToast(null);
      }, 3200);
    };

    window.addEventListener("topnote-cart-add", handleCartAdd);

    return () => {
      window.clearTimeout(timeoutId);
      window.removeEventListener("topnote-cart-add", handleCartAdd);
    };
  }, []);

  return (
    <div
      className="pointer-events-none fixed right-3 top-[4.25rem] z-[70] flex w-[min(22rem,calc(100vw-1.5rem))] justify-end sm:right-5 sm:top-20"
      aria-live="polite"
      aria-atomic="true"
    >
      <div
        key={toast?.id ?? "empty"}
        className={[
          "w-full rounded-xl border border-primary/15 bg-white p-4 shadow-[var(--shadow-premium)] transition-all duration-300",
          toast ? "translate-x-0 opacity-100" : "translate-x-5 opacity-0",
          toast ? "pointer-events-auto" : "pointer-events-none",
        ].join(" ")}
      >
        {toast ? (
          <div className="flex items-start gap-3">
            <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
              <CartToastIcon />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-black text-neutral-950">Added to cart</p>
              <p className="mt-1 line-clamp-2 text-sm font-medium leading-snug text-neutral-600">
                {toast.itemName}
                {toast.quantity > 1 ? ` now has ${toast.quantity} in cart.` : " is ready for checkout."}
              </p>
              <Link
                href="/cart"
                className="mt-2 inline-flex text-sm font-bold text-primary transition-colors hover:text-primary/80"
              >
                View cart
              </Link>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function CartToastIcon() {
  return (
    <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2.2}
        d="M6.5 7.5h13l-1.3 7.1a2 2 0 0 1-2 1.6H9.1a2 2 0 0 1-2-1.6L5.8 5.8H3.9M9.2 19.5h.1m6.5 0h.1"
      />
    </svg>
  );
}
