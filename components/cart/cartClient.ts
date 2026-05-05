"use client";

import { CART_STORAGE_KEY, normalizeQuantity, type AddCartItemInput, type CartItem } from "@/lib/cart";

function dispatchCartChange() {
  window.dispatchEvent(new Event("topnote-cart-change"));
}

function dispatchCartAdd(item: AddCartItemInput, quantity: number) {
  window.dispatchEvent(
    new CustomEvent("topnote-cart-add", {
      detail: {
        itemName: item.name,
        quantity,
      },
    }),
  );
}

export function readCart(): CartItem[] {
  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as CartItem[];
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .filter((item) => item && typeof item.id === "string" && typeof item.name === "string")
      .map((item) => ({
        ...item,
        price: Number(item.price) || 0,
        quantity: normalizeQuantity(Number(item.quantity) || 1),
        imageUrl: item.imageUrl ?? null,
        categoryName: item.categoryName || "Catalog",
      }));
  } catch {
    return [];
  }
}

export function writeCart(items: readonly CartItem[]) {
  window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  dispatchCartChange();
}

export function addToCart(input: AddCartItemInput) {
  const items = readCart();
  const existing = items.find((item) => item.id === input.id);

  if (existing) {
    existing.quantity = normalizeQuantity(existing.quantity + 1);
    writeCart(items);
    dispatchCartAdd(input, existing.quantity);
    return existing.quantity;
  }

  writeCart([...items, { ...input, quantity: 1 }]);
  dispatchCartAdd(input, 1);
  return 1;
}
