/** Shared form state for internal admin server actions (not a "use server" module — safe to export objects). */

export type ProductFormState = { error: string | null };
export const productFormInitialState: ProductFormState = { error: null };

export type CategoryFormState = { error: string | null };
export const categoryFormInitialState: CategoryFormState = { error: null };

export type TestimonialFormState = { error: string | null };
export const testimonialFormInitialState: TestimonialFormState = { error: null };
