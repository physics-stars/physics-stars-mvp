import { NextResponse } from "next/server";

/*
 * Gestor uniforme d'errors inesperats a les rutes d'API.
 *
 * Sense això, un error no controlat (p. ex. la base de dades no
 * configurada, o una caiguda temporal de connexió) faria que Next.js
 * respongués amb la seva pàgina d'error per defecte (HTML), quan el
 * frontend espera sempre rebre JSON d'aquests endpoints. Es registra
 * l'error complet al servidor, però només es retorna un missatge
 * genèric al client.
 */
export function handleRouteError(error: unknown): NextResponse {
  console.error(error);
  return NextResponse.json(
    { error: "Hi ha hagut un error inesperat. Torna-ho a provar més tard." },
    { status: 500 },
  );
}
