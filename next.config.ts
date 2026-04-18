import type { NextConfig } from "next";
import { loadEnvConfig } from "@next/env";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Project root (directory containing this file). Ensures `.env.local` loads even when `process.cwd()` differs in dev workers. */
const projectRoot = path.dirname(fileURLToPath(import.meta.url));
loadEnvConfig(projectRoot);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? "";

const nextConfig: NextConfig = {
  /** Allow product image uploads (validated to 5 MiB server-side) via Server Actions. */
  experimental: {
    serverActions: {
      bodySizeLimit: "6mb",
    },
  },
  /** Legacy internal URLs from the MVP admin — canonical UI lives under `/dashboard/*`. */
  async redirects() {
    return [
      { source: "/admin", destination: "/dashboard", permanent: false },
      { source: "/admin/products", destination: "/dashboard/products", permanent: false },
      { source: "/admin/products/new", destination: "/dashboard/products/new", permanent: false },
      { source: "/admin/products/:id/edit", destination: "/dashboard/products/:id/edit", permanent: false },
      { source: "/admin/categories", destination: "/dashboard/categories", permanent: false },
      { source: "/admin/testimonials", destination: "/dashboard/testimonials", permanent: false },
      { source: "/inquiries", destination: "/dashboard/inquiries", permanent: false },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  /** Explicit passthrough so Turbopack / RSC always see these (not only `process.cwd()`-based loads). */
  ...(supabaseUrl && supabaseAnonKey
    ? {
        env: {
          NEXT_PUBLIC_SUPABASE_URL: supabaseUrl,
          NEXT_PUBLIC_SUPABASE_ANON_KEY: supabaseAnonKey,
        },
      }
    : {}),
};

export default nextConfig;
