import type { Config } from "tailwindcss";

/**
 * Content paths for tooling; theme tokens live in app/globals.css + styles/tokens.css (Tailwind v4).
 */
const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
};

export default config;
