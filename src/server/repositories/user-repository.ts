import { prisma } from "@/lib/db/client";
import type { User } from "@prisma/client";

/*
 * Accés a dades de la taula `User`. Cap altra part del codi hauria de
 * parlar directament amb Prisma per consultar usuaris: sempre s'ha de
 * passar per aquest repositori, perquè si en el futur canviem l'ORM o
 * afegim una capa de càtxer, només caldrà tocar aquest fitxer.
 */

export function findUserByUsername(username: string): Promise<User | null> {
  return prisma.user.findUnique({ where: { username } });
}

export function findUserById(id: string): Promise<User | null> {
  return prisma.user.findUnique({ where: { id } });
}

export function createUser(data: {
  username: string;
  passwordHash: string;
  displayName: string;
}): Promise<User> {
  return prisma.user.create({ data });
}

// Dades públiques d'un usuari, segures per retornar al frontend
// (mai s'hi ha d'incloure el `passwordHash`).
export interface PublicUser {
  id: string;
  username: string;
  displayName: string;
  role: User["role"];
}

export function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    role: user.role,
  };
}
