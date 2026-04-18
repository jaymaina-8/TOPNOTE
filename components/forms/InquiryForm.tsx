"use client";

import { useActionState, useEffect, useRef } from "react";

import { submitInquiryAction, type InquiryActionState } from "@/lib/actions/submit-inquiry";
import { Button } from "@/components/ui/Button";
import type { ValidatedSourceType } from "@/lib/validation/inquiry";
import { cn } from "@/lib/utils";

const initialState: InquiryActionState = { status: "idle" };

const inputClass =
  "w-full rounded-xl bg-white px-4 py-2.5 text-sm text-neutral-900 shadow-[var(--shadow-sm)] outline-none transition placeholder:text-neutral-400 focus:ring-2 focus:ring-primary/25";

export type InquiryFormProps = {
  /** When set, stored as `source_product_id` on the inquiry. */
  sourceProductId?: string;
  /** Used for default message copy when `defaultMessage` is not provided. */
  productName?: string;
  /** Overrides the default product-prefill message. */
  defaultMessage?: string;
  /** Attribution for inquiries and conversion events (e.g. `/contact`, `/products/my-slug`). */
  sourcePage: string;
  /** High-level source label stored on the inquiry row. */
  sourceType: ValidatedSourceType;
  className?: string;
  /** Optional title/description for the form block (e.g. contact page). */
  title?: string;
  description?: string;
  /** Merged onto the `<form>` element (e.g. `space-y-5` for looser field spacing). */
  formClassName?: string;
  submitButtonClassName?: string;
};

export function InquiryForm({
  sourceProductId,
  productName,
  defaultMessage,
  sourcePage,
  sourceType,
  className,
  title,
  description,
  formClassName,
  submitButtonClassName,
}: InquiryFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const messageDefault =
    defaultMessage ??
    (productName
      ? `Hello, I'm interested in ${productName}. Please share more details.`
      : "");

  const [state, formAction, isPending] = useActionState(submitInquiryAction, initialState);

  useEffect(() => {
    if (state.status === "success" && formRef.current) {
      formRef.current.reset();
    }
  }, [state]);

  return (
    <div className={cn("space-y-4", className)}>
      {title ? <h2 className="text-xl font-bold tracking-tight text-neutral-900">{title}</h2> : null}
      {description ? <p className="mt-2 text-sm leading-relaxed text-neutral-600">{description}</p> : null}

      {state.status === "success" ? (
        <div
          className="rounded-xl bg-positive-muted px-4 py-3 text-sm text-positive shadow-[var(--shadow-sm)]"
          role="status"
        >
          {state.message}
        </div>
      ) : null}

      {state.status === "error" ? (
        <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-900 shadow-[var(--shadow-sm)]" role="alert">
          {state.error}
        </div>
      ) : null}

      <form ref={formRef} action={formAction} className={cn("space-y-4", formClassName)}>
        <input type="hidden" name="source_page" value={sourcePage} />
        <input type="hidden" name="source_type" value={sourceType} />
        {sourceProductId ? <input type="hidden" name="source_product_id" value={sourceProductId} /> : null}

        <div>
          <label htmlFor="inquiry-name" className="block text-sm font-medium text-neutral-800">
            Name <span className="font-normal text-neutral-500">(optional)</span>
          </label>
          <input
            id="inquiry-name"
            name="name"
            type="text"
            autoComplete="name"
            className={cn(inputClass, "mt-1.5")}
            disabled={isPending}
            maxLength={200}
          />
        </div>

        <div>
          <label htmlFor="inquiry-phone" className="block text-sm font-medium text-neutral-800">
            Phone <span className="font-normal text-neutral-500">(optional)</span>
          </label>
          <input
            id="inquiry-phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            className={cn(inputClass, "mt-1.5")}
            disabled={isPending}
            maxLength={40}
          />
        </div>

        <div>
          <label htmlFor="inquiry-message" className="block text-sm font-medium text-neutral-800">
            Message <span className="text-red-600">*</span>
          </label>
          <textarea
            id="inquiry-message"
            name="message"
            required
            rows={5}
            defaultValue={messageDefault}
            className={cn(inputClass, "mt-1.5 min-h-[120px] resize-y")}
            disabled={isPending}
            maxLength={8000}
          />
        </div>

        <Button
          type="submit"
          variant="primary"
          disabled={isPending}
          className={cn("w-full sm:w-auto", submitButtonClassName)}
        >
          {isPending ? "Sending…" : "Send inquiry"}
        </Button>
      </form>
    </div>
  );
}
