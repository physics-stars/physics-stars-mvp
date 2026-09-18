import { prisma } from "@/lib/db/client";
import type { Level, World } from "@prisma/client";

/*
 * Accés a dades de les taules `World` i `Level`. Cap altra part del codi
 * hauria de parlar directament amb Prisma per a mons/nivells: sempre a
 * través d'aquest repositori.
 */

export function findAllWorldsOrdered(): Promise<World[]> {
  return prisma.world.findMany({ orderBy: { order: "asc" } });
}

export type WorldWithLevels = World & { levels: Level[] };

// Un sol query amb els nivells inclosos (i ja ordenats), en lloc de fer
// una consulta separada de nivells filtrada després a mà.
export function findWorldBySlugWithLevels(slug: string): Promise<WorldWithLevels | null> {
  return prisma.world.findUnique({
    where: { slug },
    include: { levels: { orderBy: { order: "asc" } } },
  });
}
