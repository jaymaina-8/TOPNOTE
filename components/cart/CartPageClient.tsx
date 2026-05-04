"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { readCart, writeCart } from "@/components/cart/cartClient";
import { Button } from "@/components/ui/Button";
import { buildCartWhatsAppMessage, getCartCount, getCartTotal, normalizeQuantity, type CartItem } from "@/lib/cart";
import { formatKesPrice } from "@/lib/format";
import { createWhatsAppLink } from "@/lib/whatsapp";

function updateQuantity(items: readonly CartItem[], id: string, quantity: number): CartItem[] {
  return items.map((item) => (item.id === id ? { ...item, quantity: normalizeQuantity(quantity) } : item));
}

export function CartPageClient() {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const sync = () => {
      setItems(readCart());
      setLoaded(true);
    };

    sync();
    window.addEventListener("storage", sync);
    window.addEventListener("topnote-cart-change", sync);

    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("topnote-cart-change", sync);
    };
  }, []);

  const itemCount = getCartCount(items);
  const total = getCartTotal(items);
  const whatsappHref = useMemo(() => createWhatsAppLink(buildCartWhatsAppMessage(items)), [items]);

  const setCart = (nextItems: CartItem[]) => {
    setItems(nextItems);
    writeCart(nextItems);
  };

  if (!loaded) {
    return (
      <div className="rounded-2xl bg-white p-8 text-sm text-neutral-600 shadow-[var(--shadow-sm)]">
        Loading cart...
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-2xl bg-white p-8 text-center shadow-[var(--shadow-sm)] md:p-12">
        <h2 className="text-2xl font-bold tracking-tight text-neutral-900">Your cart is empty</h2>
        <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-neutral-600">
          Add books, exam papers, stationery, or school supplies, then come back here to review the total before sending the order on WhatsApp.
        </p>
        <Button href="/products" variant="primary" className="mt-7">
          Browse products
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_23rem] lg:items-start">
      <div className="space-y-4">
        {items.map((item) => (
          <article key={item.id} className="grid gap-4 rounded-2xl bg-white p-4 shadow-[var(--shadow-sm)] sm:grid-cols-[7.5rem_1fr] sm:p-5">
            <Link href={`/products/${item.slug}`} className="relative aspect-[4/3] overflow-hidden rounded-xl bg-neutral-50">
              {item.imageUrl ? (
                <Image src={item.imageUrl} alt={item.name} fill sizes="120px" className="object-cover" />
              ) : (
                <span className="flex h-full items-center justify-center text-xs font-medium text-neutral-400">No image</span>
              )}
            </Link>
            <div className="min-w-0">
              <div className="flex gap-4 sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-primary">{item.categoryName}</p>
                  <h2 className="mt-1 text-lg font-bold leading-tight text-neutral-900">
                    <Link href={`/products/${item.slug}`} className="hover:text-primary">
                      {item.name}
                    </Link>
                  </h2>
                  <p className="mt-2 text-sm font-semibold tabular-nums text-neutral-700">{formatKesPrice(item.price)} each</p>
                </div>
                <button
                  type="button"
                  className="shrink-0 rounded-full px-3 py-1 text-xs font-semibold text-neutral-500 transition-colors hover:bg-red-50 hover:text-red-700"
                  onClick={() => setCart(items.filter((cartItem) => cartItem.id !== item.id))}
                >
                  Remove
                </button>
              </div>

              <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-neutral-100 pt-4">
                <div className="inline-flex overflow-hidden rounded-full border border-neutral-200 bg-white">
                  <button
                    type="button"
                    className="min-h-10 min-w-10 px-3 text-lg font-bold text-neutral-700 transition-colors hover:bg-neutral-50"
                    onClick={() => setCart(updateQuantity(items, item.id, item.quantity - 1))}
                    aria-label={`Decrease quantity for ${item.name}`}
                  >
                    -
                  </button>
                  <input
                    className="w-14 border-x border-neutral-200 text-center text-sm font-bold tabular-nums outline-none"
                    value={item.quantity}
                    inputMode="numeric"
                    aria-label={`Quantity for ${item.name}`}
                    onChange={(event) => setCart(updateQuantity(items, item.id, Number(event.target.value)))}
                  />
                  <button
                    type="button"
                    className="min-h-10 min-w-10 px-3 text-lg font-bold text-neutral-700 transition-colors hover:bg-neutral-50"
                    onClick={() => setCart(updateQuantity(items, item.id, item.quantity + 1))}
                    aria-label={`Increase quantity for ${item.name}`}
                  >
                    +
                  </button>
                </div>
                <p className="text-lg font-bold tabular-nums text-neutral-900">{formatKesPrice(item.price * item.quantity)}</p>
              </div>
            </div>
          </article>
        ))}
      </div>

      <aside className="rounded-2xl bg-white p-5 shadow-[var(--shadow-sm)] lg:sticky lg:top-24">
        <h2 className="text-xl font-bold tracking-tight text-neutral-900">Order summary</h2>
        <dl className="mt-5 space-y-3 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-neutral-600">Items</dt>
            <dd className="font-semibold text-neutral-900">{itemCount}</dd>
          </div>
          <div className="flex justify-between gap-4 border-t border-neutral-100 pt-3">
            <dt className="font-bold text-neutral-900">Total</dt>
            <dd className="text-xl font-bold tabular-nums text-primary">{formatKesPrice(total)}</dd>
          </div>
        </dl>
        <a
          href={whatsappHref}
          className="mt-6 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-[var(--shadow-sm)] transition-colors hover:bg-primary/92"
        >
          Proceed to WhatsApp
        </a>
        <Button href="/products" variant="outline" className="mt-3 w-full">
          Add more products
        </Button>
        <button
          type="button"
          className="mt-4 w-full rounded-xl px-4 py-2 text-sm font-semibold text-neutral-500 transition-colors hover:bg-neutral-50 hover:text-red-700"
          onClick={() => setCart([])}
        >
          Clear cart
        </button>
        <p className="mt-5 text-xs leading-relaxed text-neutral-500">
          WhatsApp will open with your product list, quantities, unit prices, and total. TOPNOTE will confirm availability and delivery.
        </p>
      </aside>
    </div>
  );
}
