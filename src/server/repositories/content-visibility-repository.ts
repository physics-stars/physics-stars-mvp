import { prisma } from "@/lib/db/client";

/*
 * Accés a dades del contingut amagat per aula (`ClassroomHiddenWorld` i
 * `ClassroomHiddenLevel`). Una fila = "amagat"; sense fila = visible.
 */

export interface HiddenContent {
  worldIds: string[];
  levelIds: string[];
}

export async function findHiddenContentForClassroom(classroomId: string): Promise<HiddenContent> {
  const [worlds, levels] = await Promise.all([
    prisma.classroomHiddenWorld.findMany({ where: { classroomId }, select: { worldId: true } }),
    prisma.classroomHiddenLevel.findMany({ where: { classroomId }, select: { levelId: true } }),
  ]);
  return {
    worldIds: worlds.map((row) => row.worldId),
    levelIds: levels.map((row) => row.levelId),
  };
}

// Contingut amagat de diverses aules alhora, indexat per aula.
export async function findHiddenContentForClassrooms(
  classroomIds: string[],
): Promise<Record<string, HiddenContent>> {
  const [worlds, levels] = await Promise.all([
    prisma.classroomHiddenWorld.findMany({ where: { classroomId: { in: classroomIds } } }),
    prisma.classroomHiddenLevel.findMany({ where: { classroomId: { in: classroomIds } } }),
  ]);

  const result: Record<string, HiddenContent> = {};
  for (const id of classroomIds) {
    result[id] = { worldIds: [], levelIds: [] };
  }
  for (const row of worlds) result[row.classroomId].worldIds.push(row.worldId);
  for (const row of levels) result[row.classroomId].levelIds.push(row.levelId);
  return result;
}

export async function setWorldHidden(
  classroomId: string,
  worldId: string,
  hidden: boolean,
): Promise<void> {
  if (hidden) {
    await prisma.classroomHiddenWorld.upsert({
      where: { classroomId_worldId: { classroomId, worldId } },
      update: {},
      create: { classroomId, worldId },
    });
  } else {
    await prisma.classroomHiddenWorld.deleteMany({ where: { classroomId, worldId } });
  }
}

export async function setLevelHidden(
  classroomId: string,
  levelId: string,
  hidden: boolean,
): Promise<void> {
  if (hidden) {
    await prisma.classroomHiddenLevel.upsert({
      where: { classroomId_levelId: { classroomId, levelId } },
      update: {},
      create: { classroomId, levelId },
    });
  } else {
    await prisma.classroomHiddenLevel.deleteMany({ where: { classroomId, levelId } });
  }
}
