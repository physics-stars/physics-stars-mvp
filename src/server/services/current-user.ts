import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME } from "@/lib/config/auth";
import { validateSessionToken } from "@/server/services/auth-service";
import type { PublicUser } from "@/server/repositories/user-repository";

/*
 * Helper per obtenir l'usuari autenticat des de components de servidor
 * (pàgines, layouts) i route handlers, llegint la cookie de sessió.
 * `import "server-only"` evita per error que aquest fitxer s'acabi
 * important des de codi de client (on `next/headers` no existeix).
 *
 * S'embolcalla amb `cache()` de React perquè, si diverses parts de la
 * mateixa pàgina el criden durant el mateix render (p. ex. el layout i
 * la pàgina), només es faci una consulta a la base de dades en lloc
 * d'una per cada crida.
 */
export const getCurrentUser = cache(async (): Promise<PublicUser | null> => {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionToken) {
    return null;
  }

  const validated = await validateSessionToken(sessionToken);
  return validated?.user ?? null;
});
