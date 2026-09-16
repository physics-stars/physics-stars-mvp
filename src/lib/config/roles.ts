import type { Role } from "@prisma/client";

/*
 * Ruta d'inici pròpia de cada rol. Funció pura, sense dependències de
 * servidor (a diferència de `server/services/route-guards.ts`), perquè
 * la pugui fer servir tant el backend com un component de client (p. ex.
 * `LoginForm`, per redirigir cap a la pàgina correcta després del login).
 */
export function getHomePathForRole(role: Role): string {
  switch (role) {
    case "ADMIN":
      return "/admin";
    case "TEACHER":
      return "/teacher";
    case "STUDENT":
      return "/menu";
  }
}
