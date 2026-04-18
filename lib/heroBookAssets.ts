/**
 * Canonical hero book filenames under `public/hero-books/`.
 * Must match `ROOT_PNG` in `scripts/remove-hero-book-matte.mjs` (same basenames).
 */
export const HERO_BOOK_FILENAMES = [
  "hero-book-red.png",
  "hero-book-green.png",
  "hero-book-teal.png",
  "hero-workbook-grade4.png",
] as const;

export const HERO_BOOK_PUBLIC_PATHS = HERO_BOOK_FILENAMES.map(
  (name) => `/hero-books/${name}` as const,
);
