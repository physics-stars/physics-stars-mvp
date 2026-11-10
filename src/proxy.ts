import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/config/auth";
import { appAccessEnabled } from "@/lib/config/site";
import { defaultLocale, isLocale } from "@/components/public-site/copy";

/*
 * Proxy de protecció de rutes (equivalent al "middleware" de versions
 * anteriors de Next.js; des de Next.js 16 aquesta convenció es diu
 * "proxy" i viu a `src/proxy.ts`).
 *
 * S'executa en un runtime "Edge", on no és pràctic consultar directament
 * Prisma/Neon amb el client habitual. Per això aquí només es comprova de
 * forma ràpida si EXISTEIX la cookie de sessió (per redirigir de seguida
 * qui no ha iniciat sessió i millorar l'experiència d'usuari). La
 * comprovació de veritat —si el token és vàlid i no ha caducat— es fa
 * sempre al servidor dins de cada pàgina protegida a través de
 * `getCurrentUser()`, que sí consulta la base de dades. Per tant, la
 * seguretat real no depèn d'aquest proxy.
 */

const protectedPrefixes = ["/menu", "/teacher", "/admin", "/profile", "/preferences"];
const landingPaths = new Set(["/", "/ca", "/es", "/en"]);

// Només la landing es pot indexar: la resta de respostes porten `noindex`,
// tant amb l'accés tancat com obert. No es bloquegen a robots.txt perquè
// Google pugui llegir aquesta capçalera i retirar URLs antigues de l'índex.
export function proxy(request: NextRequest) {
  const response = route(request);
  if (!landingPaths.has(request.nextUrl.pathname)) {
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
  }
  return response;
}

function route(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Accés tancat: només la landing és visible (vegeu `appAccessEnabled`).
  if (!appAccessEnabled && !landingPaths.has(pathname)) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Not available yet" }, { status: 503 });
    }
    // Es manté l'URL i es mostra la pàgina «en construcció» en l'idioma
    // del camí (/en/...), del `?lang=`, de la landing (cookie) o en català.
    const firstSegment = pathname.split("/")[1];
    const candidates = [
      firstSegment,
      request.nextUrl.searchParams.get("lang"),
      request.cookies.get("physics-stars-public-language")?.value,
    ];
    const lang = candidates.find(isLocale) ?? defaultLocale;
    const url = request.nextUrl.clone();
    url.pathname = `/${lang}/coming-soon`;
    url.search = "";
    return NextResponse.rewrite(url);
  }

  const isProtected = protectedPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
  if (isProtected && !request.cookies.has(SESSION_COOKIE_NAME)) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

// El "matcher" ha de ser un array estàtic (Next.js l'analitza en temps de
// compilació). Inclou totes les rutes excepte els recursos de `_next` i els
// fitxers amb extensió (imatges, favicon, sitemap.xml, robots.txt...).
export const config = {
  matcher: ["/((?!_next/|.*\\..*).*)"],
};
