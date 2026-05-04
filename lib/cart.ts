export const CART_STORAGE_KEY = "topnote-cart-v1";

export type CartItem = {
  id: string;
  name: string;
  slug: string;
  price: number;
  imageUrl: string | null;
  categoryName: string;
  quantity: number;
};

export type AddCartItemInput = Omit<CartItem, "quantity">;

export function normalizeQuantity(value: number): number {
  if (!Number.isFinite(value)) {
    return 1;
  }
  return Math.max(1, Math.min(999, Math.round(value)));
}

export function getCartCount(items: readonly CartItem[]): number {
  return items.reduce((sum, item) => sum + normalizeQuantity(item.quantity), 0);
}

export function getCartTotal(items: readonly CartItem[]): number {
  return items.reduce((sum, item) => sum + item.price * normalizeQuantity(item.quantity), 0);
}

export function buildCartWhatsAppMessage(items: readonly CartItem[]): string {
  const lines = items.map((item, index) => {
    const quantity = normalizeQuantity(item.quantity);
    const lineTotal = item.price * quantity;
    return `${index + 1}. ${item.name} - Qty ${quantity} x KES ${item.price.toLocaleString("en-KE")} = KES ${lineTotal.toLocaleString("en-KE")}`;
  });

  const total = getCartTotal(items);

  return [
    "Hello TOPNOTE PUBLISHERS, I would like to place this order:",
    "",
    ...lines,
    "",
    `Total: KES ${total.toLocaleString("en-KE")}`,
    "",
    "Please confirm availability and delivery details.",
  ].join("\n");
}
