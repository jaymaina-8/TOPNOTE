"use client";

import { useEffect, useState } from "react";

import { readCart } from "@/components/cart/cartClient";
import { getCartCount } from "@/lib/cart";

export function CartLinkBadge() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const sync = () => setCount(getCartCount(readCart()));

    sync();
    window.addEventListener("storage", sync);
    window.addEventListener("topnote-cart-change", sync);

    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("topnote-cart-change", sync);
    };
  }, []);

  if (count === 0) {
    return null;
  }

  return (
    <span className="ml-1 inline-flex min-w-5 items-center justify-center rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
      {count}
    </span>
  );
}
