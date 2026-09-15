import type { NextRequest } from "next/server";

/*
 * Verificació de l'origen (Origin header) com a capa addicional de defensa
 * contra CSRF a les rutes d'API que modifiquen estat (login, logout...).
 *
 * Els navegadors afegeixen automàticament la capçalera `Origin` a les
 * peticions fetch/XHR que canvien estat (POST, PUT, DELETE...), i aquesta
 * capçalera NO es pot falsificar des de JavaScript. Si l'origen no coincideix
 * amb el de la nostra pròpia aplicació, rebutgem la petició. Això complementa
 * (no substitueix) l'ús de cookies amb `SameSite=Lax`.
 */
export function isTrustedOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");

  // Algunes peticions mateix-origen (navegació normal, certs clients) no
  // envien Origin. Com que les peticions fetch entre orígens SEMPRE
  // l'envien, no tenir-la no és per si mateix una senyal d'atac.
  if (!origin) {
    return true;
  }

  return origin === request.nextUrl.origin;
}
