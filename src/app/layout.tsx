import type { Metadata } from "next";
import { Geist, Geist_Mono, Cinzel } from "next/font/google";
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

export const metadata: Metadata = {
  metadataBase: new URL("https://physicsstars.com"),

  title: {
    default: "Physics Stars | Aprèn física amb pensament crític i gamificació",
    template: "%s | Physics Stars",
  },
  description:
    "A Physics Stars reinventem la manera d’aprendre física amb una plataforma edtech que integra de forma immersiva pensament crític i gamificació.",
  applicationName: "Physics Stars",
  category: "education",

  keywords: [
    "física",
    "edtech",
    "gamificació",
    "educació",
    "pensament crític",
    "aprendre física",
    "ciència interactiva",
    "Physics Stars",
  ],

  authors: [
    { name: "David Diestre" },
    { name: "Juan Roset" },
    { name: "Aissam Khadraoui" },
    { name: "Víctor Calvo" },
  ],
  creator: "Physics Stars",
  publisher: "Physics Stars",

  alternates: {
    canonical: "/",
  },

  openGraph: {
    title: "Physics Stars | Aprèn física amb pensament crític i gamificació",
    description:
      "A Physics Stars reinventem la manera d’aprendre física amb una plataforma edtech que integra de forma immersiva pensament crític i gamificació.",
    url: "/",
    siteName: "Physics Stars",
    locale: "ca_ES",
    type: "website",
    images: [
      {
        url: "/preview_og.png",
        width: 1200,
        height: 630,
        alt: "Physics Stars - Plataforma EdTech de física gamificada",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "Physics Stars | Aprèn física amb pensament crític i gamificació",
    description:
      "A Physics Stars reinventem la manera d’aprendre física amb una plataforma edtech que integra de forma immersiva pensament crític i gamificació.",
    images: ["/preview_twitter.png"],
  },

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

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};



const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "EducationalOrganization",
      "@id": "https://physicsstars.com/#organization",
      name: "Physics Stars",
      url: "https://physicsstars.com",
      logo: {
        "@type": "ImageObject",
        "@id": "https://physicsstars.com/#logo",
        url: "https://physicsstars.com/icon-512x512.png",
        contentUrl: "https://physicsstars.com/icon-512x512.png",
        width: 512,
        height: 512,
        caption: "Physics Stars",
      },
      image: "https://physicsstars.com/preview_og.png",
      description:
        "Plataforma edtech que reinventa la manera d'aprendre física integrant pensament crític i gamificació.",
      knowsLanguage: ["ca", "es", "en"],
      founder: [
        { "@type": "Person", name: "David Diestre" },
        { "@type": "Person", name: "Juan Roset" },
        { "@type": "Person", name: "Aissam Khadraoui" },
        { "@type": "Person", name: "Víctor Calvo" },
      ],
      // Add your real social media links below when available
      sameAs: [
        // "https://www.linkedin.com/company/physics-stars",
        // "https://www.instagram.com/physicsstars",
        // "https://x.com/PhysicsStars",
      ],
    },
    {
      "@type": "WebSite",
      "@id": "https://physicsstars.com/#website",
      url: "https://physicsstars.com",
      name: "Physics Stars",
      description: "Aprèn física amb pensament crític i gamificació",
      publisher: {
        "@id": "https://physicsstars.com/#organization",
      },
      inLanguage: "ca",
    },
  ],
};


export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ca"
      className={`${geistSans.variable} ${geistMono.variable} ${cinzel.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {children}
      </body>
    </html>
  );
}
