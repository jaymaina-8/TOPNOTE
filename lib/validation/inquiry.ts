const MAX_MESSAGE_LENGTH = 8_000;
const MAX_NAME_LENGTH = 200;
const MAX_PHONE_LENGTH = 40;
const MAX_SOURCE_PAGE_LENGTH = 500;

const SOURCE_TYPES = ["product", "contact", "general"] as const;
export type ValidatedSourceType = (typeof SOURCE_TYPES)[number];

/** Basic UUID v4 shape check before sending to Supabase. */
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type ValidatedInquiryPayload = {
  name: string | null;
  phone: string | null;
  message: string;
  sourceProductId: string | null;
  sourcePage: string | null;
  sourceType: ValidatedSourceType;
};

export type ValidateInquiryResult =
  | { ok: true; data: ValidatedInquiryPayload }
  | { ok: false; error: string };

export function validateInquiryInput(input: {
  name: string | undefined;
  phone: string | undefined;
  message: string | undefined;
  sourceProductId: string | undefined;
  sourcePage: string | undefined;
  sourceType: string | undefined;
}): ValidateInquiryResult {
  const nameTrimmed = input.name?.trim() ?? "";
  const phoneTrimmed = input.phone?.trim() ?? "";
  const messageTrimmed = input.message?.trim() ?? "";
  const sourceRaw = input.sourceProductId?.trim() ?? "";
  const sourcePageRaw = input.sourcePage?.trim() ?? "";
  const sourceTypeRaw = input.sourceType?.trim().toLowerCase() ?? "";

  if (!messageTrimmed) {
    return { ok: false, error: "Please enter a message." };
  }

  if (messageTrimmed.length > MAX_MESSAGE_LENGTH) {
    return {
      ok: false,
      error: `Message is too long (max ${MAX_MESSAGE_LENGTH.toLocaleString()} characters).`,
    };
  }

  if (nameTrimmed.length > MAX_NAME_LENGTH) {
    return { ok: false, error: "Name is too long." };
  }

  if (phoneTrimmed.length > MAX_PHONE_LENGTH) {
    return { ok: false, error: "Phone number is too long." };
  }

  const PHONE_RE = /^[+\d\s().-]{7,25}$/;
  if (phoneTrimmed && !PHONE_RE.test(phoneTrimmed)) {
    return { ok: false, error: "Please enter a valid phone number (7 to 25 characters, e.g. +254700000000)." };
  }

  let sourceProductId: string | null = null;
  if (sourceRaw) {
    if (!UUID_RE.test(sourceRaw)) {
      return { ok: false, error: "Something went wrong. Please try again." };
    }
    sourceProductId = sourceRaw;
  }

  if (!sourceTypeRaw || !SOURCE_TYPES.includes(sourceTypeRaw as ValidatedSourceType)) {
    return { ok: false, error: "Something went wrong. Please try again." };
  }
  const sourceType = sourceTypeRaw as ValidatedSourceType;

  let sourcePage: string | null = null;
  if (sourcePageRaw) {
    if (sourcePageRaw.length > MAX_SOURCE_PAGE_LENGTH) {
      return { ok: false, error: "Something went wrong. Please try again." };
    }
    if (!sourcePageRaw.startsWith("/")) {
      return { ok: false, error: "Something went wrong. Please try again." };
    }
    sourcePage = sourcePageRaw;
  }

  return {
    ok: true,
    data: {
      name: nameTrimmed.length ? nameTrimmed : null,
      phone: phoneTrimmed.length ? phoneTrimmed : null,
      message: messageTrimmed,
      sourceProductId,
      sourcePage,
      sourceType,
    },
  };
}
