import type { NextRequest } from "next/server";

/*
 * Obté l'adreça IP de qui fa la petició. A Vercel, l'aplicació s'executa
 * darrere un proxy, així que la IP real arriba a la capçalera
 * `x-forwarded-for` (la primera de la llista és la del client original).
 */
export function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0]!.trim();
  }
  return request.headers.get("x-real-ip") ?? "unknown";
}
