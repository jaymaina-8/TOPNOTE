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
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                const removeAttr = (node) => {
                  if (node.nodeType === 1) {
                    if (node.hasAttribute('bis_skin_checked')) {
                      node.removeAttribute('bis_skin_checked');
                    }
                    const children = node.getElementsByTagName('*');
                    for (let i = 0; i < children.length; i++) {
                      if (children[i].hasAttribute('bis_skin_checked')) {
                        children[i].removeAttribute('bis_skin_checked');
                      }
                    }
                  }
                };
                const observer = new MutationObserver((mutations) => {
                  for (let i = 0; i < mutations.length; i++) {
                    const m = mutations[i];
                    if (m.type === 'childList') {
                      const addedNodes = m.addedNodes;
                      for (let j = 0; j < addedNodes.length; j++) {
                        removeAttr(addedNodes[j]);
                      }
                    } else if (m.type === 'attributes' && m.attributeName === 'bis_skin_checked') {
                      const target = m.target;
                      if (target.nodeType === 1 && target.hasAttribute('bis_skin_checked')) {
                        target.removeAttribute('bis_skin_checked');
                      }
                    }
                  }
                });
                observer.observe(document.documentElement, {
                  childList: true,
                  subtree: true,
                  attributes: true,
                  attributeFilter: ['bis_skin_checked']
                });
                window.addEventListener('DOMContentLoaded', () => {
                  document.querySelectorAll('[bis_skin_checked]').forEach(el => el.removeAttribute('bis_skin_checked'));
                });
              })();
            `
          }}
        />
      </head>
      <body className="flex min-h-full flex-col bg-background text-foreground" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
