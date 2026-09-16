import type { Role } from "@prisma/client";
import { ForbiddenError, NotFoundError, ValidationAppError } from "@/server/http/app-error";
import { hashPassword } from "@/server/security/password";
import {
  generatePlainPassword,
  generateUniqueUsername,
} from "@/server/security/credentials-generator";
import { deleteAllSessionsForUser } from "@/server/repositories/session-repository";
import { findClassroomById } from "@/server/repositories/classroom-repository";
import {
  createUser,
  findUserById,
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
