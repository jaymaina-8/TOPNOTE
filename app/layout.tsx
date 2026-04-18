import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { SITE_NAME } from "@/lib/site";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: SITE_NAME,
  description: "Educational books, exams, stationery, and lab supplies for parents and schools across Kenya.",
  openGraph: {
    images: [{ url: "/logo-topnote.png", alt: SITE_NAME }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="flex min-h-full flex-col bg-background text-foreground" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
