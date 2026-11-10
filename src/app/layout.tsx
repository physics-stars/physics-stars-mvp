import type { Metadata } from "next";
import { Geist, Geist_Mono, Cinzel } from "next/font/google";
import { siteName, siteUrl } from "@/lib/config/site";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Font de títols: dona el toc "d'aventura" a la marca sense necessitat
// de textures ni imatges, només amb tipografia.
const cinzel = Cinzel({
  variable: "--font-cinzel",
  subsets: ["latin"],
  weight: ["500", "700", "900"],
});

// Metadades compartides per tota l'aplicació. Les de la landing (títol,
// descripció, Open Graph, hreflang i JSON-LD) són a `[lang]/layout.tsx`,
// traduïdes a cada idioma.
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: siteName,
  applicationName: siteName,
  category: "education",

  authors: [
    { name: "David Diestre" },
    { name: "Juan Roset" },
    { name: "Aissam Khadraoui" },
    { name: "Víctor Calvo" },
  ],
  creator: siteName,
  publisher: siteName,

  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-16x16.png", type: "image/png", sizes: "16x16" },
      { url: "/favicon-32x32.png", type: "image/png", sizes: "32x32" },
      { url: "/icon-192x192.png", type: "image/png", sizes: "192x192" },
      { url: "/icon-512x512.png", type: "image/png", sizes: "512x512" },
    ],
    shortcut: "/favicon.ico",
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },

  // Per defecte res no s'indexa; la landing ho activa a `[lang]/layout.tsx`.
  robots: { index: false, follow: false },

  // Token de la propietat de Google Search Console (mètode etiqueta HTML).
  // No cal si la propietat es verifica per DNS.
  verification: { google: process.env.GOOGLE_SITE_VERIFICATION },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ca"
      className={`${geistSans.variable} ${geistMono.variable} ${cinzel.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
