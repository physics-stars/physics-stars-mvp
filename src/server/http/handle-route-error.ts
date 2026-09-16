import { NextResponse } from "next/server";
import { AppError } from "@/server/http/app-error";

/*
 * Gestor uniforme d'errors a les rutes d'API.
 *
 * Si l'error és un `AppError` "conegut" (p. ex. llençat des de la capa
 * de serveis per una violació de regles de negoci), es respon amb el
 * seu missatge i estat HTTP concrets. Per a qualsevol altre error
 * inesperat (p. ex. la base de dades no configurada, o una caiguda
 * temporal de connexió), Next.js respondria amb la seva pàgina d'error
 * per defecte (HTML) si no es capturés aquí; el frontend espera sempre
 * rebre JSON d'aquests endpoints. Es registra l'error complet al
 * servidor, però només es retorna un missatge genèric al client.
 */
export function handleRouteError(error: unknown): NextResponse {
  if (error instanceof AppError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  console.error(error);
  return NextResponse.json(
    { error: "Hi ha hagut un error inesperat. Torna-ho a provar més tard." },
    { status: 500 },
  );
}
