import type { Role } from "@prisma/client";
import { ForbiddenError, NotFoundError, ValidationAppError } from "@/server/http/app-error";
import { hashPassword } from "@/server/security/password";
import {
  generatePlainPassword,
  generateUniqueUsername,
  slugifyDisplayName,
} from "@/server/security/credentials-generator";
import { deleteAllSessionsForUser } from "@/server/repositories/session-repository";
import { findClassroomById } from "@/server/repositories/classroom-repository";
import {
  createUser,
  createUsers,
  findUserById,
  findUsernamesStartingWith,
  setUserActive as setUserActiveInDb,
  toPublicUser,
  updateUserPasswordHash,
  type PublicUser,
} from "@/server/repositories/user-repository";

/*
 * Lògica de negoci per crear i gestionar comptes des dels panells
 * d'administració/professorat: generació de credencials (mai les tria
 * l'admin/professor a mà), reinici de contrasenya i (des)activació.
 *
 * Contrasenyes: es generen, es fan servir UN COP per mostrar-les a qui
 * ha fet l'acció, i només se'n desa el hash Argon2id — mai es poden
 * tornar a consultar, només reiniciar.
 */

export interface CreatedAccount {
  user: PublicUser;
  plainPassword: string;
}

// Crea un compte de professor o alumne (els comptes ADMIN no es creen
// des d'aquesta via). Si és alumne i s'indica una aula, es valida que
// existeixi.
export async function adminCreateUser(input: {
  displayName: string;
  role: Extract<Role, "TEACHER" | "STUDENT">;
  classroomId?: string | null;
}): Promise<CreatedAccount> {
  const classroomId = input.role === "STUDENT" ? (input.classroomId ?? null) : null;

  if (classroomId !== null) {
    const classroom = await findClassroomById(classroomId);
    if (!classroom) {
      throw new ValidationAppError("L'aula indicada no existeix.");
    }
  }

  const username = await generateUniqueUsername(input.displayName);
  const plainPassword = generatePlainPassword();
  const passwordHash = await hashPassword(plainPassword);

  const user = await createUser({
    username,
    passwordHash,
    displayName: input.displayName,
    role: input.role,
    classroomId,
  });

  return { user: toPublicUser(user), plainPassword };
}

export interface BulkCreatedAccount {
  username: string;
  displayName: string;
  plainPassword: string;
}

export interface BulkCreatedAccounts {
  role: "TEACHER" | "STUDENT";
  classroomName: string | null;
  accounts: BulkCreatedAccount[];
}

// Hasheja les contrasenyes en lots petits: Argon2id és costós (memòria
// i CPU) i així no es disparen totes a la vegada.
async function hashInBatches(passwords: string[], batchSize = 8): Promise<string[]> {
  const hashes: string[] = [];
  for (let i = 0; i < passwords.length; i += batchSize) {
    const batch = passwords.slice(i, i + batchSize);
    hashes.push(...(await Promise.all(batch.map((password) => hashPassword(password)))));
  }
  return hashes;
}

// Escapa un text per fer-lo servir literalment dins una expressió regular.
function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Crea diversos comptes alhora a partir d'un prefix: "Alumne 4A" i 3
// comptes -> "Alumne 4A 1", "Alumne 4A 2", "Alumne 4A 3" (usuaris
// "alumne.4a1"...). Si ja existeixen comptes amb aquest prefix, la
// numeració continua a partir de l'últim en lloc de repetir-se.
export async function adminCreateUsersBulk(input: {
  role: "TEACHER" | "STUDENT";
  prefix: string;
  count: number;
  classroomId?: string | null;
}): Promise<BulkCreatedAccounts> {
  const classroomId = input.role === "STUDENT" ? (input.classroomId ?? null) : null;

  let classroomName: string | null = null;
  if (classroomId !== null) {
    const classroom = await findClassroomById(classroomId);
    if (!classroom) {
      throw new ValidationAppError("L'aula indicada no existeix.");
    }
    classroomName = classroom.name;
  }

  const base = slugifyDisplayName(input.prefix);
  const numberPattern = new RegExp("^" + escapeRegExp(base) + "(\\d+)$");
  const existing = await findUsernamesStartingWith(base);
  const highest = existing.reduce((max, username) => {
    const match = numberPattern.exec(username);
    return match ? Math.max(max, Number(match[1])) : max;
  }, 0);

  const numbers = Array.from({ length: input.count }, (_, index) => highest + index + 1);
  const plainPasswords = numbers.map(() => generatePlainPassword());
  const hashes = await hashInBatches(plainPasswords);

  const accounts: BulkCreatedAccount[] = numbers.map((number, index) => ({
    username: `${base}${number}`,
    displayName: `${input.prefix} ${number}`,
    plainPassword: plainPasswords[index],
  }));

  await createUsers(
    accounts.map((account, index) => ({
      username: account.username,
      passwordHash: hashes[index],
      displayName: account.displayName,
      role: input.role,
      classroomId,
    })),
  );

  return { role: input.role, classroomName, accounts };
}

// Genera i desa una contrasenya nova per a un usuari ja existent, i
// tanca totes les seves sessions actives (el canvi té efecte immediat).
export async function resetUserPassword(userId: string): Promise<string> {
  const plainPassword = generatePlainPassword();
  const passwordHash = await hashPassword(plainPassword);

  await updateUserPasswordHash(userId, passwordHash);
  await deleteAllSessionsForUser(userId);

  return plainPassword;
}

// Reinici de contrasenya fet per un professor: només per a alumnat
// d'una de les SEVES aules.
export async function teacherResetStudentPassword(
  teacherId: string,
  studentId: string,
): Promise<string> {
  const student = await findUserById(studentId);
  if (!student || student.role !== "STUDENT") {
    throw new NotFoundError("Aquest alumne no existeix.");
  }
  if (student.classroomId === null) {
    throw new ForbiddenError("Aquest alumne no és a cap de les teves aules.");
  }
  const classroom = await findClassroomById(student.classroomId);
  if (!classroom || classroom.teacherId !== teacherId) {
    throw new ForbiddenError("Aquest alumne no és a cap de les teves aules.");
  }

  return resetUserPassword(studentId);
}

// Activa o desactiva un compte (mai l'esborra). Desactivar-lo tanca
// totes les seves sessions actives. Un admin no es pot desactivar a si
// mateix, per evitar quedar-se bloquejat sense voler.
export async function setUserActive(
  actingUserId: string,
  targetUserId: string,
  isActive: boolean,
): Promise<PublicUser> {
  if (!isActive && actingUserId === targetUserId) {
    throw new ForbiddenError("No pots desactivar el teu propi compte.");
  }

  const target = await findUserById(targetUserId);
  if (!target) {
    throw new NotFoundError("Aquest usuari no existeix.");
  }
  if (target.role === "ADMIN") {
    throw new ForbiddenError("Els comptes d'administració no es poden gestionar des d'aquí.");
  }

  const updated = await setUserActiveInDb(targetUserId, isActive);
  if (!isActive) {
    await deleteAllSessionsForUser(targetUserId);
  }

  return toPublicUser(updated);
}
