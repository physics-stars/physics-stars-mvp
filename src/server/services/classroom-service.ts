import { ForbiddenError, NotFoundError, ValidationAppError } from "@/server/http/app-error";
import {
  createClassroom,
  deleteClassroom,
  findClassroomById,
  moveStudentsToClassroom,
} from "@/server/repositories/classroom-repository";
import { findUserById } from "@/server/repositories/user-repository";
import type { Classroom } from "@prisma/client";

/*
 * Lògica de negoci de la gestió d'aules. Hi ha dues "vies" d'accés amb
 * regles diferents:
 *  - Professor (`teacher*`): només pot crear/eliminar/moure alumnat de
 *    les SEVES pròpies aules.
 *  - Admin (`admin*`): sense aquesta restricció de propietat, però
 *    igualment es valida que els identificadors indicats existeixin i
 *    tinguin sentit (p. ex. que l'aula destí sigui realment una aula).
 *
 * Les comprovacions d'autorització viuen aquí (no a la ruta ni al
 * repositori) perquè són regles de negoci, no detalls HTTP ni de
 * persistència.
 */

async function assertClassroomOwnedByTeacher(
  classroomId: string,
  teacherId: string,
): Promise<Classroom> {
  const classroom = await findClassroomById(classroomId);
  if (!classroom) {
    throw new NotFoundError("Aquesta aula no existeix.");
  }
  if (classroom.teacherId !== teacherId) {
    throw new ForbiddenError("Aquesta aula no és teva.");
  }
  return classroom;
}

// --- Professor ---

export function teacherCreateClassroom(teacherId: string, name: string) {
  return createClassroom({ name, teacherId });
}

export async function teacherDeleteClassroom(
  teacherId: string,
  classroomId: string,
): Promise<void> {
  await assertClassroomOwnedByTeacher(classroomId, teacherId);
  await deleteClassroom(classroomId);
}

export async function teacherMoveStudents(
  teacherId: string,
  studentIds: string[],
  targetClassroomId: string | null,
): Promise<void> {
  // Si hi ha aula destí, ha de ser una aula del professor.
  if (targetClassroomId !== null) {
    await assertClassroomOwnedByTeacher(targetClassroomId, teacherId);
  }

  // Tot l'alumnat a moure ha d'estar actualment en una aula d'aquest
  // professor (així un professor no pot "robar" alumnat d'un altre).
  for (const studentId of studentIds) {
    const student = await findUserById(studentId);
    if (!student || student.role !== "STUDENT") {
      throw new NotFoundError("Un dels alumnes seleccionats no existeix.");
    }
    if (student.classroomId === null) {
      throw new ForbiddenError("Aquest alumne no és a cap de les teves aules.");
    }
    await assertClassroomOwnedByTeacher(student.classroomId, teacherId);
  }

  await moveStudentsToClassroom(studentIds, targetClassroomId);
}

// --- Admin ---

export async function adminCreateClassroom(teacherId: string, name: string) {
  const teacher = await findUserById(teacherId);
  if (!teacher || teacher.role !== "TEACHER") {
    throw new ValidationAppError("El professor indicat no existeix.");
  }
  return createClassroom({ name, teacherId });
}

export async function adminDeleteClassroom(classroomId: string): Promise<void> {
  const classroom = await findClassroomById(classroomId);
  if (!classroom) {
    throw new NotFoundError("Aquesta aula no existeix.");
  }
  await deleteClassroom(classroomId);
}

export async function adminMoveStudents(
  studentIds: string[],
  targetClassroomId: string | null,
): Promise<void> {
  if (targetClassroomId !== null) {
    const classroom = await findClassroomById(targetClassroomId);
    if (!classroom) {
      throw new NotFoundError("L'aula destí no existeix.");
    }
  }

  for (const studentId of studentIds) {
    const student = await findUserById(studentId);
    if (!student || student.role !== "STUDENT") {
      throw new NotFoundError("Un dels alumnes seleccionats no existeix.");
    }
  }

  await moveStudentsToClassroom(studentIds, targetClassroomId);
}
