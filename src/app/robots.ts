import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/config/site";

// Imatges de broma que no han de sortir a Google (resultats d'imatges ni
// AI Overviews). Inclou les d'antigues versions de la landing. La resta
// d'imatges del web es poden indexar amb normalitat.
const hiddenImages = ["/juan.png", "/team/juan.png", "/team/juan-meme.png"];

// Les pàgines internes no es bloquegen aquí: porten `noindex` (vegeu
// `src/proxy.ts`) i Google necessita poder-les rastrejar per llegir-lo.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        // Cada imatge es bloqueja tant a la seva URL com a les versions
        // optimitzades de `next/image` (`/_next/image?url=%2F...&w=...`).
        ...hiddenImages.flatMap((path) => [
          path,
          `/_next/image*url=${encodeURIComponent(path)}`,
        ]),
      ],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
