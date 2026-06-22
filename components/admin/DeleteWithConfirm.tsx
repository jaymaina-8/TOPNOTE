"use client";

import type { ReactNode } from "react";

type Props = {
  action: (formData: FormData) => Promise<void>;
  id: string;
  confirmMessage: string;
  children: ReactNode;
  idFieldName?: string;
  /** Optional extra hidden fields (e.g. slug_hint for revalidation). */
  extraHidden?: Record<string, string>;
};

export function DeleteWithConfirm({
  action,
  id,
  confirmMessage,
  children,
  idFieldName = "id",
  extraHidden,
}: Props) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm(confirmMessage)) e.preventDefault();
      }}
    >
      <input type="hidden" name={idFieldName} value={id} />
      {extraHidden
        ? Object.entries(extraHidden).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)
        : null}
      {children}
    </form>
  );
}
