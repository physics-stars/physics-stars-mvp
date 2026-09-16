import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import type { Role } from "@prisma/client";
import { getCurrentUser } from "@/server/services/current-user";
import { isTrustedOrigin } from "@/server/security/origin-check";
import type { PublicUser } from "@/server/repositories/user-repository";

/*
 * Guardes d'accés per a route handlers (`app/api/*`). A diferència de
 * `server/services/route-guards.ts` (pensada per a pàgines, que
 * redirigeix), aquí mai es redirigeix: es retorna un resultat perquè la
 * ruta decideixi la resposta HTTP (401/403 amb JSON), tal com s'espera
 * de qualsevol endpoint d'API.
 */

export type AuthorizedResult =
  | { ok: true; user: PublicUser }
  | { ok: false; status: 401 | 403 };

export async function getAuthorizedUser(allowedRoles: Role[]): Promise<AuthorizedResult> {
  const user = await getCurrentUser();

  if (!user) {
    return { ok: false, status: 401 };
  }
  if (!allowedRoles.includes(user.role)) {
    return { ok: false, status: 403 };
  }

  return { ok: true, user };
}

/*
 * Comprovació combinada (origen + autorització) que fan servir totes
 * les rutes d'API de gestió (professor/admin), per no repetir aquestes
 * dues comprovacions a cada fitxer. Si `ok` és `false`, `response` ja
 * és la resposta JSON a retornar directament.
 */
export type ApiAccessResult =
  | { ok: true; user: PublicUser }
  | { ok: false; response: NextResponse };

export async function requireApiAccess(
  request: NextRequest,
  allowedRoles: Role[],
): Promise<ApiAccessResult> {
  if (!isTrustedOrigin(request)) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Origen de la petició no vàlid." }, { status: 403 }),
    };
  }

  const auth = await getAuthorizedUser(allowedRoles);
  if (!auth.ok) {
    const message =
      auth.status === 401
        ? "Cal iniciar sessió."
        : "No tens permís per fer aquesta acció.";
    return { ok: false, response: NextResponse.json({ error: message }, { status: auth.status }) };
  }

  return { ok: true, user: auth.user };
}
