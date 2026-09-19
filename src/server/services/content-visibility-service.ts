import type { Level, World } from "@prisma/client";
import { NotFoundError } from "@/server/http/app-error";
import type { SetVisibilityInput } from "@/lib/validation/content";
import { findClassroomsByTeacher } from "@/server/repositories/classroom-repository";
import {
  findHiddenContentForClassroom,
  findHiddenContentForClassrooms,
  setLevelHidden,
  setWorldHidden,
  type HiddenContent,
} from "@/server/repositories/content-visibility-repository";
import { findUserById } from "@/server/repositories/user-repository";
import {
  findAllWorldsOrdered,
  findAllWorldsWithLevels,
  findLevelById,
  findWorldById,
  findWorldBySlugWithLevels,
  type WorldWithLevels,
} from "@/server/repositories/world-repository";
import { assertClassroomOwnedByTeacher } from "@/server/services/classroom-service";

/*
 * Visibilitat del contingut per aula. L'admin decideix què està
 * disponible globalment (`isAvailable`); el professor només pot amagar
 * o tornar a mostrar mons/nivells a l'alumnat de les SEVES aules. Aquí
 * també viu el filtre que aplica l'àrea de l'alumnat.
 */

// --- Professor ---

export interface TeacherContentOverview {
  classrooms: { id: string; name: string; studentCount: number }[];
  worlds: {
    id: string;
    name: string;
    tagline: string;
    isAvailable: boolean;
    levels: { id: string; title: string; levelNumber: number; isAvailable: boolean }[];
  }[];
  hidden: Record<string, HiddenContent>;
}

export async function getTeacherContentOverview(
  teacherId: string,
): Promise<TeacherContentOverview> {
  const [classrooms, worlds] = await Promise.all([
    findClassroomsByTeacher(teacherId),
    findAllWorldsWithLevels(),
  ]);
  const hidden = await findHiddenContentForClassrooms(classrooms.map((c) => c.id));

  return {
    classrooms: classrooms.map((c) => ({ id: c.id, name: c.name, studentCount: c.students.length })),
    worlds: worlds.map((world) => ({
      id: world.id,
      name: world.name,
      tagline: world.tagline,
      isAvailable: world.isAvailable,
      levels: world.levels.map((level) => ({
        id: level.id,
        title: level.title,
        levelNumber: level.levelNumber,
        isAvailable: level.isAvailable,
      })),
    })),
    hidden,
  };
}

export async function teacherSetVisibility(
  teacherId: string,
  classroomId: string,
  input: SetVisibilityInput,
): Promise<void> {
  await assertClassroomOwnedByTeacher(classroomId, teacherId);

  if (input.kind === "world") {
    if (!(await findWorldById(input.targetId))) throw new NotFoundError("Aquest món no existeix.");
    await setWorldHidden(classroomId, input.targetId, !input.visible);
  } else {
    if (!(await findLevelById(input.targetId))) throw new NotFoundError("Aquest nivell no existeix.");
    await setLevelHidden(classroomId, input.targetId, !input.visible);
  }
}

// --- Alumnat ---

async function getHiddenContentForStudent(userId: string): Promise<HiddenContent> {
  const user = await findUserById(userId);
  if (!user?.classroomId) return { worldIds: [], levelIds: [] };
  return findHiddenContentForClassroom(user.classroomId);
}

// Mons que l'alumne pot veure (exclou els que el seu professor ha amagat).
export async function listWorldsForStudent(userId: string): Promise<World[]> {
  const [worlds, hidden] = await Promise.all([
    findAllWorldsOrdered(),
    getHiddenContentForStudent(userId),
  ]);
  return worlds.filter((world) => !hidden.worldIds.includes(world.id));
}

// Un món amb els seus nivells visibles, o `null` si no existeix o
// l'aula de l'alumne el té amagat.
export async function getWorldForStudent(
  userId: string,
  slug: string,
): Promise<(WorldWithLevels & { levels: Level[] }) | null> {
  const [world, hidden] = await Promise.all([
    findWorldBySlugWithLevels(slug),
    getHiddenContentForStudent(userId),
  ]);
  if (!world || hidden.worldIds.includes(world.id)) return null;

  return { ...world, levels: world.levels.filter((level) => !hidden.levelIds.includes(level.id)) };
}
