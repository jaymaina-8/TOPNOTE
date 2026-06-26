import type { NextConfig } from "next";
import { loadEnvConfig } from "@next/env";
import path from "node:path";
import { fileURLToPath } from "node:url";

/** Project root (directory containing this file). Ensures `.env.local` loads even when `process.cwd()` differs in dev workers. */
const projectRoot = path.dirname(fileURLToPath(import.meta.url));
loadEnvConfig(projectRoot);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? "";
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() ?? "";

function serverActionAllowedOrigins(): string[] {
  const origins = new Set<string>();
  for (const raw of [siteUrl, process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : ""]) {
    if (!raw) continue;
    try {
      origins.add(new URL(raw).host);
    } catch {
      // ignore invalid URLs
    }
  }
  return [...origins];
}

const allowedOrigins = serverActionAllowedOrigins();

const nextConfig: NextConfig = {
  /** Allow product image uploads (validated to 5 MiB server-side) via Server Actions. */
  experimental: {
    serverActions: {
      bodySizeLimit: "6mb",
      ...(allowedOrigins.length > 0 ? { allowedOrigins } : {}),
    },
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-DNS-Prefetch-Control", value: "on" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
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
