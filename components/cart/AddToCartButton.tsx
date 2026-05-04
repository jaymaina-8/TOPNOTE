"use client";

import { useState } from "react";

import { addToCart } from "@/components/cart/cartClient";
import { Button } from "@/components/ui/Button";
import type { AddCartItemInput } from "@/lib/cart";
import { cn } from "@/lib/utils";

type AddToCartButtonProps = {
  item: AddCartItemInput;
  className?: string;
  label?: string;
};

export function AddToCartButton({ item, className, label = "Add to cart" }: AddToCartButtonProps) {
  const [added, setAdded] = useState(false);

  return (
    <Button
      type="button"
      variant="primary"
      className={cn("w-full", className)}
      onClick={() => {
        addToCart(item);
        setAdded(true);
        window.setTimeout(() => setAdded(false), 1400);
      }}
    >
      <span aria-hidden>{added ? "✓" : "+"}</span>
      {added ? "Added to cart" : label}
    </Button>
  );
}
