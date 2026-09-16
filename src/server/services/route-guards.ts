import "server-only";
import { redirect } from "next/navigation";
import type { Role } from "@prisma/client";
import { getHomePathForRole } from "@/lib/config/roles";
import { getCurrentUser } from "@/server/services/current-user";
import type { PublicUser } from "@/server/repositories/user-repository";

/*
 * Guardes d'accés per a components de servidor (pàgines). Fan servir
 * `redirect()`, així que NOMÉS s'han de cridar des de pàgines/layouts,
 * mai des de route handlers (per a `app/api/*`, vegeu
 * `server/http/require-role.ts`, que retorna un estat HTTP en lloc de
 * redirigir).
 */
export { getHomePathForRole };

// Exigeix que hi hagi una sessió vàlida; si no n'hi ha, redirigeix a /login.
export async function requireUser(): Promise<PublicUser> {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}

// Exigeix que l'usuari autenticat tingui un dels rols indicats; si té
// sessió però un rol diferent, el redirigeix a LA SEVA pròpia pàgina
// d'inici (no a /login, ja que sí està autenticat).
export async function requireRole(allowed: Role | Role[]): Promise<PublicUser> {
  const user = await requireUser();
  const allowedRoles = Array.isArray(allowed) ? allowed : [allowed];

  if (!allowedRoles.includes(user.role)) {
    redirect(getHomePathForRole(user.role));
  }

  return user;
}
