/** Shared form state for internal admin server actions (not a "use server" module — safe to export objects). */

export type ProductFormState = { error: string | null; success?: boolean };
export const productFormInitialState: ProductFormState = { error: null, success: false };

export type CategoryFormState = { error: string | null; success?: boolean };
export const categoryFormInitialState: CategoryFormState = { error: null, success: false };

export type TestimonialFormState = { error: string | null };
export const testimonialFormInitialState: TestimonialFormState = { error: null };

export type ExamFormState = { error: string | null; success?: boolean };
export const examFormInitialState: ExamFormState = { error: null, success: false };
