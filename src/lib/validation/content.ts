import { z } from "zod";

/*
 * Esquemes de validació (Zod) per a la gestió de mons i nivells (admin)
 * i per a la visibilitat per aula (professor).
 */

const objectivesSchema = z
  .array(z.string().trim().min(1).max(200, "Cada objectiu és massa llarg."))
  .max(10, "Com a màxim 10 objectius.");

export const worldInputSchema = z.object({
  name: z.string().trim().min(2, "El nom ha de tenir com a mínim 2 caràcters.").max(60),
  tagline: z.string().trim().min(2, "Cal una etiqueta curta.").max(80),
  shortDescription: z.string().trim().min(2, "Cal una descripció curta.").max(120),
  description: z.string().trim().min(2, "Cal una descripció.").max(1200),
  objectives: objectivesSchema,
  isAvailable: z.boolean(),
});

export type WorldInput = z.infer<typeof worldInputSchema>;

export const levelInputSchema = z.object({
  title: z.string().trim().min(2, "El títol ha de tenir com a mínim 2 caràcters.").max(80),
  description: z.string().trim().min(2, "Cal una descripció.").max(1200),
  difficulty: z.enum(["FACIL", "MITJA", "DIFICIL"]),
  isAvailable: z.boolean(),
});

export type LevelInput = z.infer<typeof levelInputSchema>;

export const moveDirectionSchema = z.object({
  direction: z.enum(["up", "down"]),
});

// Només el professor: amagar o mostrar un món/nivell a una aula seva.
export const setVisibilitySchema = z.object({
  kind: z.enum(["world", "level"]),
  targetId: z.string().min(1),
  visible: z.boolean(),
});

export type SetVisibilityInput = z.infer<typeof setVisibilitySchema>;
