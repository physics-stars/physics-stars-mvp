import type { MetadataRoute } from "next";
import { defaultLocale, publicCopy } from "@/components/public-site/copy";
import { siteName } from "@/lib/config/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: siteName,
    short_name: siteName,
    description: publicCopy[defaultLocale].seo.description,
    lang: defaultLocale,
    start_url: `/${defaultLocale}`,
    display: "browser",
    background_color: "#080a18",
    theme_color: "#080a18",
    icons: [
      { src: "/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
