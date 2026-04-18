/** E.164-style number without + (Kenya). */
export const WHATSAPP_NUMBER = "254712430992";

export const WHATSAPP_MESSAGES = {
  order: "Hello, I would like to place an order.",
  inquiry: "Hello, I would like to make an inquiry.",
} as const;

/** Display and tel: link — align with contact page copy. */
export const PHONE_DISPLAY = "+254 712 430 992";
export const PHONE_TEL_HREF = "tel:+254712430992";

export function productCardWhatsAppMessage(productName: string) {
  return `Hello, I'm interested in the ${productName}. Is it available?`;
}

export function parentProductWhatsAppMessage(productName: string) {
  return `Hello, I'm interested in ${productName}. Please share availability and retail price.`;
}

export function schoolProductWhatsAppMessage(productName: string) {
  return `Hello, I'm interested in bulk pricing for ${productName} for a school. Please share details.`;
}

export function productDetailWhatsAppMessage(productName: string) {
  return `Hello, I'm interested in ${productName}. Please share more details.`;
}

/** @deprecated Prefer productCardWhatsAppMessage or productDetailWhatsAppMessage */
export function productInquiryMessage(productName: string) {
  return productCardWhatsAppMessage(productName);
}

/**
 * Returns a wa.me URL with optional pre-filled message (URL-encoded).
 */
export function createWhatsAppLink(message: string): string {
  const text = encodeURIComponent(message);
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${text}`;
}
