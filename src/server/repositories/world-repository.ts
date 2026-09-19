import { prisma } from "@/lib/db/client";
import type { Difficulty, Level, World } from "@prisma/client";

/*
 * Accés a dades de les taules `World` i `Level`. Cap altra part del codi
 * hauria de parlar directament amb Prisma per a mons/nivells: sempre a
 * través d'aquest repositori.
 */

export type WorldWithLevels = World & { levels: Level[] };

const LEVELS_ORDERED = { orderBy: { order: "asc" } } as const;

export function findAllWorldsOrdered(): Promise<World[]> {
  return prisma.world.findMany({ orderBy: { order: "asc" } });
}

export function findAllWorldsWithLevels(): Promise<WorldWithLevels[]> {
  return prisma.world.findMany({
    orderBy: { order: "asc" },
    include: { levels: LEVELS_ORDERED },
  });
}

// Un sol query amb els nivells inclosos (i ja ordenats), en lloc de fer
// una consulta separada de nivells filtrada després a mà.
export function findWorldBySlugWithLevels(slug: string): Promise<WorldWithLevels | null> {
  return prisma.world.findUnique({
    where: { slug },
    include: { levels: LEVELS_ORDERED },
  });
}

export function findWorldById(id: string): Promise<WorldWithLevels | null> {
  return prisma.world.findUnique({ where: { id }, include: { levels: LEVELS_ORDERED } });
}

export function findLevelById(id: string): Promise<Level | null> {
  return prisma.level.findUnique({ where: { id } });
}

export async function worldSlugExists(slug: string): Promise<boolean> {
  return (await prisma.world.count({ where: { slug } })) > 0;
}

export interface WorldData {
  name: string;
  tagline: string;
  shortDescription: string;
  description: string;
  objectives: string[];
  isAvailable: boolean;
}

export async function createWorld(data: WorldData & { slug: string }): Promise<World> {
  const last = await prisma.world.aggregate({ _max: { order: true } });
  return prisma.world.create({ data: { ...data, order: (last._max.order ?? -1) + 1 } });
}

export function updateWorld(id: string, data: Partial<WorldData>): Promise<World> {
  return prisma.world.update({ where: { id }, data });
}

export async function deleteWorld(id: string): Promise<void> {
  await prisma.world.deleteMany({ where: { id } });
}

export interface LevelData {
  title: string;
  description: string;
  difficulty: Difficulty;
  isAvailable: boolean;
}

// El nivell es crea al final del món; `levelNumber` sempre coincideix
// amb la posició (vegeu `setLevelsOrder`).
export async function createLevel(worldId: string, data: LevelData): Promise<Level> {
  const count = await prisma.level.count({ where: { worldId } });
  return prisma.level.create({
    data: { ...data, worldId, order: count, levelNumber: count + 1 },
  });
}

export function updateLevel(id: string, data: Partial<LevelData>): Promise<Level> {
  return prisma.level.update({ where: { id }, data });
}

export async function deleteLevel(id: string): Promise<void> {
  await prisma.level.deleteMany({ where: { id } });
}

// Desa l'ordre indicat: la posició a la llista passa a ser `order`.
export async function setWorldsOrder(orderedIds: string[]): Promise<void> {
  await prisma.$transaction(
    orderedIds.map((id, index) => prisma.world.update({ where: { id }, data: { order: index } })),
  );
}

// Desa l'ordre dels nivells d'un món i en renumera `levelNumber` (1..n).
export async function setLevelsOrder(orderedIds: string[]): Promise<void> {
  await prisma.$transaction(
    orderedIds.map((id, index) =>
      prisma.level.update({ where: { id }, data: { order: index, levelNumber: index + 1 } }),
    ),
  );
}
