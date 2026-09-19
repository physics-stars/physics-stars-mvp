import type { Level, World } from "@prisma/client";
import { NotFoundError } from "@/server/http/app-error";
import { slugify } from "@/lib/utils/slugify";
import type { LevelInput, WorldInput } from "@/lib/validation/content";
import {
  createLevel,
  createWorld,
  deleteLevel,
  deleteWorld,
  findAllWorldsWithLevels,
  findLevelById,
  findWorldById,
  setLevelsOrder,
  setWorldsOrder,
  updateLevel,
  updateWorld,
  worldSlugExists,
  type WorldWithLevels,
} from "@/server/repositories/world-repository";

/*
 * Gestió de mons i nivells per a l'administració (CRUD, ordre i
 * disponibilitat global). El professorat NO passa per aquí: només pot
 * amagar/mostrar contingut per aula (vegeu content-visibility-service.ts).
 */

export function adminListContent(): Promise<WorldWithLevels[]> {
  return findAllWorldsWithLevels();
}

// Genera un slug únic a partir del nom ("energia-i-treball", "-2", ...).
async function generateUniqueWorldSlug(name: string): Promise<string> {
  const base = slugify(name) || "mon";
  for (let attempt = 0; attempt < 50; attempt += 1) {
    const candidate = attempt === 0 ? base : `${base}-${attempt + 1}`;
    if (!(await worldSlugExists(candidate))) return candidate;
  }
  throw new Error("No s'ha pogut generar un identificador únic per al món.");
}

// Mou un identificador una posició amunt/avall dins la llista.
function moveInList(ids: string[], id: string, direction: "up" | "down"): string[] {
  const index = ids.indexOf(id);
  const target = direction === "up" ? index - 1 : index + 1;
  if (index < 0 || target < 0 || target >= ids.length) return ids;

  const next = [...ids];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

// --- Mons ---

export async function adminCreateWorld(input: WorldInput): Promise<World> {
  const slug = await generateUniqueWorldSlug(input.name);
  return createWorld({ ...input, slug });
}

export async function adminUpdateWorld(id: string, input: WorldInput): Promise<World> {
  const world = await findWorldById(id);
  if (!world) throw new NotFoundError("Aquest món no existeix.");
  return updateWorld(id, input);
}

export async function adminDeleteWorld(id: string): Promise<void> {
  const world = await findWorldById(id);
  if (!world) throw new NotFoundError("Aquest món no existeix.");

  await deleteWorld(id);
  const remaining = (await findAllWorldsWithLevels()).map((item) => item.id);
  await setWorldsOrder(remaining);
}

export async function adminMoveWorld(id: string, direction: "up" | "down"): Promise<void> {
  const ids = (await findAllWorldsWithLevels()).map((world) => world.id);
  if (!ids.includes(id)) throw new NotFoundError("Aquest món no existeix.");
  await setWorldsOrder(moveInList(ids, id, direction));
}

// --- Nivells ---

export async function adminCreateLevel(worldId: string, input: LevelInput): Promise<Level> {
  const world = await findWorldById(worldId);
  if (!world) throw new NotFoundError("Aquest món no existeix.");
  return createLevel(worldId, input);
}

export async function adminUpdateLevel(id: string, input: LevelInput): Promise<Level> {
  const level = await findLevelById(id);
  if (!level) throw new NotFoundError("Aquest nivell no existeix.");
  return updateLevel(id, input);
}

export async function adminDeleteLevel(id: string): Promise<void> {
  const level = await findLevelById(id);
  if (!level) throw new NotFoundError("Aquest nivell no existeix.");

  await deleteLevel(id);
  const world = await findWorldById(level.worldId);
  await setLevelsOrder((world?.levels ?? []).map((item) => item.id));
}

export async function adminMoveLevel(id: string, direction: "up" | "down"): Promise<void> {
  const level = await findLevelById(id);
  if (!level) throw new NotFoundError("Aquest nivell no existeix.");

  const world = await findWorldById(level.worldId);
  const ids = (world?.levels ?? []).map((item) => item.id);
  await setLevelsOrder(moveInList(ids, id, direction));
}
