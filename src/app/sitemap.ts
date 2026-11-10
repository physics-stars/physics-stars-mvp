import type { MetadataRoute } from "next";
import { defaultLocale, locales } from "@/components/public-site/copy";
import { siteUrl } from "@/lib/config/site";

// Una entrada per idioma de la landing, cadascuna amb les seves alternatives hreflang.
export default function sitemap(): MetadataRoute.Sitemap {
  const languages = {
    ...Object.fromEntries(locales.map((locale) => [locale, `${siteUrl}/${locale}`])),
    "x-default": `${siteUrl}/${defaultLocale}`,
  };
  return locales.map((locale) => ({
    url: `${siteUrl}/${locale}`,
    changeFrequency: "monthly",
    priority: locale === defaultLocale ? 1 : 0.9,
    alternates: { languages },
  }));
}
