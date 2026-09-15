import { NextResponse } from "next/server";
import { getCurrentUser } from "@/server/services/current-user";
import { handleRouteError } from "@/server/http/handle-route-error";

/*
 * GET /api/auth/session — retorna l'usuari autenticat actual (o `null`).
 * Pensat perquè components de client puguin comprovar l'estat de la
 * sessió (per exemple, per mostrar el nom d'usuari a una capçalera)
 * sense haver de repetir la lògica de lectura de cookies.
 */
export async function GET() {
  try {
    const user = await getCurrentUser();
    return NextResponse.json({ user });
  } catch (error) {
    return handleRouteError(error);
  }
}
