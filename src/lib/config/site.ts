// URL pública canònica. La fan servir les metadades, el sitemap i el JSON-LD.
// Ha de coincidir amb el domini principal de Vercel (l'altre hi redirigeix).
export const siteUrl = "https://www.physicsstars.com";
export const siteName = "Physics Stars";

// Mentre l'app no estigui llesta només la landing (/, /ca, /es, /en) és
// pública: la resta de rutes mostren la pàgina «en construcció» i l'API
// respon 503. Per obrir l'accés, defineix `NEXT_PUBLIC_APP_ACCESS=open`
// (a Vercel o a `.env.local`) i torna a desplegar o reinicia `next dev`.
export const appAccessEnabled = process.env.NEXT_PUBLIC_APP_ACCESS === "open";
