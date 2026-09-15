import { randomBytes, createHash } from "crypto";

/*
 * Gestió dels tokens de sessió (patró "hashed session token").
 *
 * El token en cru (aleatori i impredictible) és el que es guarda a la
 * cookie del navegador i mai s'emmagatzema tal qual a la base de dades:
 * només s'hi desa el seu hash SHA-256. Així, si algú tingués accés de
 * només lectura a la base de dades, NO podria suplantar cap sessió activa
 * (a diferència d'un JWT, on posseir el contingut de la base ja bastaria).
 * A més, a diferència d'un JWT autocontingut, una sessió es pot revocar
 * a l'instant esborrant la fila corresponent.
 */

// Genera un token de sessió aleatori i criptogràficament segur.
export function generateSessionToken(): string {
  return randomBytes(32).toString("base64url");
}

// Deriva l'identificador de base de dades (hash) a partir del token en cru.
export function hashSessionToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
