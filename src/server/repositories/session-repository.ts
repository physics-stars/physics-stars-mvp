import { prisma } from "@/lib/db/client";
import type { Session, User } from "@prisma/client";

/*
 * Accés a dades de la taula `Session`. `id` és sempre el hash SHA-256
 * del token de sessió (vegeu server/security/session-tokens.ts).
 */

export function createSession(data: {
  tokenHash: string;
  userId: string;
  expiresAt: Date;
}): Promise<Session> {
  return prisma.session.create({
    data: { id: data.tokenHash, userId: data.userId, expiresAt: data.expiresAt },
  });
}

// Recupera una sessió juntament amb l'usuari propietari, en una sola consulta.
export function findSessionWithUser(
  tokenHash: string,
): Promise<(Session & { user: User }) | null> {
  return prisma.session.findUnique({
    where: { id: tokenHash },
    include: { user: true },
  });
}

export function updateSessionExpiry(
  tokenHash: string,
  expiresAt: Date,
): Promise<Session> {
  return prisma.session.update({ where: { id: tokenHash }, data: { expiresAt } });
}

// Esborra una sessió (logout). Si ja no existeix, no falla.
export async function deleteSession(tokenHash: string): Promise<void> {
  await prisma.session.deleteMany({ where: { id: tokenHash } });
}

// Esborra totes les sessions d'un usuari (útil per a "tanca sessió a tots els dispositius").
export async function deleteAllSessionsForUser(userId: string): Promise<void> {
  await prisma.session.deleteMany({ where: { userId } });
}
