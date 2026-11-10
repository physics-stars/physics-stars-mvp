import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  defaultLocale,
  isLocale,
  locales,
  publicCopy,
  type Locale,
} from "@/components/public-site/copy";
import { siteName, siteUrl } from "@/lib/config/site";

// Format `idioma_REGIÓ` que demana Open Graph.
const openGraphLocales: Record<Locale, string> = {
  ca: "ca_ES",
  es: "es_ES",
  en: "en_US",
};

// Només existeixen /ca, /es i /en; qualsevol altre segment és un 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export async function generateMetadata({
  params,
}: LayoutProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const seo = publicCopy[lang].seo;

  return {
    title: seo.title,
    description: seo.description,
    keywords: seo.keywords,

    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },

    // Canònica pròpia per idioma i enllaços hreflang a les altres versions.
    alternates: {
      canonical: `/${lang}`,
      languages: {
        ...Object.fromEntries(locales.map((locale) => [locale, `/${locale}`])),
        "x-default": `/${defaultLocale}`,
      },
    },

    openGraph: {
      title: seo.title,
      description: seo.description,
      url: `/${lang}`,
      siteName,
      locale: openGraphLocales[lang],
      alternateLocale: locales
        .filter((locale) => locale !== lang)
        .map((locale) => openGraphLocales[locale]),
      type: "website",
      images: [
        {
          url: "/preview_og.png",
          width: 1200,
          height: 630,
          alt: seo.imageAlt,
        },
      ],
    },

    twitter: {
      card: "summary_large_image",
      title: seo.title,
      description: seo.description,
      images: [{ url: "/preview_twitter.png", alt: seo.imageAlt }],
    },
  };
}

export default async function LandingLayout({
  children,
  params,
}: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const seo = publicCopy[lang].seo;

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "EducationalOrganization",
        "@id": `${siteUrl}/#organization`,
        name: siteName,
        url: siteUrl,
        logo: {
          "@type": "ImageObject",
          "@id": `${siteUrl}/#logo`,
          url: `${siteUrl}/icon-512x512.png`,
          contentUrl: `${siteUrl}/icon-512x512.png`,
          width: 512,
          height: 512,
          caption: siteName,
        },
        image: {
          "@type": "ImageObject",
          "@id": `${siteUrl}/#preview`,
          url: `${siteUrl}/preview_og.png`,
          contentUrl: `${siteUrl}/preview_og.png`,
          width: 1200,
          height: 630,
          caption: seo.imageAlt,
        },
        description: seo.organization,
        knowsLanguage: [...locales],
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
        "@id": `${siteUrl}/#website`,
        url: siteUrl,
        name: siteName,
        inLanguage: [...locales],
        publisher: { "@id": `${siteUrl}/#organization` },
      },
      {
        "@type": "WebPage",
        "@id": `${siteUrl}/${lang}#webpage`,
        url: `${siteUrl}/${lang}`,
        name: seo.title,
        description: seo.description,
        inLanguage: lang,
        // Imatge preferida per als resultats de cerca (en lloc de les fotos de l'equip).
        primaryImageOfPage: { "@id": `${siteUrl}/#preview` },
        image: { "@id": `${siteUrl}/#preview` },
        isPartOf: { "@id": `${siteUrl}/#website` },
        about: { "@id": `${siteUrl}/#organization` },
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {children}
    </>
  );
}
