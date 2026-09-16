import { prisma } from "@/lib/db/client";
import type { Classroom, User } from "@prisma/client";
import { toManagedUserView, type ManagedUserView } from "@/server/repositories/user-repository";

/*
 * Accés a dades de la taula `Classroom` (aules). Cap altra part del codi
 * hauria de parlar directament amb Prisma per a aules: sempre a través
 * d'aquest repositori.
 */

export type ClassroomWithStudents = Classroom & { students: User[] };

export function createClassroom(data: {
  name: string;
  teacherId: string;
}): Promise<Classroom> {
  return prisma.classroom.create({ data });
}

// En esborrar l'aula, l'alumnat queda "sense aula" automàticament
// (relació `onDelete: SetNull` al schema), no cal fer-ho aquí.
export async function deleteClassroom(id: string): Promise<void> {
  await prisma.classroom.deleteMany({ where: { id } });
}

export function findClassroomById(id: string): Promise<ClassroomWithStudents | null> {
  return prisma.classroom.findUnique({
    where: { id },
    include: { students: true },
  });
}

export function findClassroomsByTeacher(teacherId: string): Promise<ClassroomWithStudents[]> {
  return prisma.classroom.findMany({
    where: { teacherId },
    include: { students: true },
    orderBy: { name: "asc" },
  });
}

export type ClassroomWithDetails = ClassroomWithStudents & { teacher: User };

// Totes les aules amb el professor i l'alumnat inclosos, per a la vista
// global d'administració.
export function findAllClassroomsWithDetails(): Promise<ClassroomWithDetails[]> {
  return prisma.classroom.findMany({
    include: { students: true, teacher: true },
    orderBy: [{ teacher: { displayName: "asc" } }, { name: "asc" }],
  });
}

// Mou (o desassigna, si `classroomId` és `null`) un conjunt d'alumnes.
export async function moveStudentsToClassroom(
  studentIds: string[],
  classroomId: string | null,
): Promise<void> {
  await prisma.user.updateMany({
    where: { id: { in: studentIds } },
    data: { classroomId },
  });
}

// --- Vistes segures per a components de client (mai passar-hi `User`
// de Prisma directament: inclou `passwordHash`) ---

export interface ClassroomView {
  id: string;
  name: string;
  students: ManagedUserView[];
}

export function toClassroomView(classroom: ClassroomWithStudents): ClassroomView {
  return {
    id: classroom.id,
    name: classroom.name,
    students: classroom.students.map(toManagedUserView),
  };
}

export interface ClassroomWithTeacherView extends ClassroomView {
  teacher: ManagedUserView;
}

export function toClassroomWithTeacherView(
  classroom: ClassroomWithDetails,
): ClassroomWithTeacherView {
  return {
    ...toClassroomView(classroom),
    teacher: toManagedUserView(classroom.teacher),
  };
}
