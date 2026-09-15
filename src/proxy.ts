import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/config/auth";

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
export function proxy(request: NextRequest) {
  const hasSessionCookie = request.cookies.has(SESSION_COOKIE_NAME);

  if (!hasSessionCookie) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirectTo", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

// El "matcher" ha de ser un array estàtic (Next.js l'analitza en temps de
// compilació), per això no es genera dinàmicament a partir d'una llista.
export const config = {
  matcher: ["/menu/:path*", "/profile/:path*", "/preferences/:path*"],
};
