import { prisma } from "@/lib/db/client";
import type { Role, User } from "@prisma/client";

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

export function findUsersByRole(role: Role): Promise<User[]> {
  return prisma.user.findMany({ where: { role }, orderBy: { displayName: "asc" } });
}

// Alumnat que encara no té cap aula assignada.
export function findUnassignedStudents(): Promise<User[]> {
  return prisma.user.findMany({
    where: { role: "STUDENT", classroomId: null },
    orderBy: { displayName: "asc" },
  });
}

export function createUser(data: {
  username: string;
  passwordHash: string;
  displayName: string;
  role?: Role;
  classroomId?: string | null;
}): Promise<User> {
  return prisma.user.create({ data });
}

// Noms d'usuari que comencen amb un prefix (per continuar la numeració
// quan es creen comptes en bloc).
export async function findUsernamesStartingWith(prefix: string): Promise<string[]> {
  const rows = await prisma.user.findMany({
    where: { username: { startsWith: prefix } },
    select: { username: true },
  });
  return rows.map((row) => row.username);
}

export async function createUsers(
  rows: {
    username: string;
    passwordHash: string;
    displayName: string;
    role: Role;
    classroomId: string | null;
  }[],
): Promise<void> {
  await prisma.user.createMany({ data: rows });
}

export function setUserActive(id: string, isActive: boolean): Promise<User> {
  return prisma.user.update({ where: { id }, data: { isActive } });
}

export function updateUserPasswordHash(id: string, passwordHash: string): Promise<User> {
  return prisma.user.update({ where: { id }, data: { passwordHash } });
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

// Vista d'un usuari per als panells de gestió (professorat/admin): inclou
// `isActive` (per mostrar/gestionar l'estat) però, com `PublicUser`, MAI
// el `passwordHash` — és el tipus segur per passar com a props a un
// component de client.
export interface ManagedUserView {
  id: string;
  username: string;
  displayName: string;
  role: Role;
  isActive: boolean;
}

export function toManagedUserView(user: User): ManagedUserView {
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    role: user.role,
    isActive: user.isActive,
  };
}
