import { z } from "zod";
import { slugify } from "@/lib/utils/slugify";

/*
 * Esquemes de validació (Zod) per a la creació i gestió de comptes
 * d'usuari des dels panells d'administració/professorat.
 */

// Els comptes ADMIN no es creen des d'aquesta UI (només TEACHER/STUDENT),
// per evitar crear-ne per error des d'un formulari senzill.
export const createManagedUserSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(2, "El nom ha de tenir com a mínim 2 caràcters.")
    .max(80, "El nom és massa llarg."),
  role: z.enum(["TEACHER", "STUDENT"]),
  // Només s'aplica quan role === "STUDENT"; si no s'indica, l'alumne
  // es crea "sense aula" i se li pot assignar una després.
  classroomId: z.string().min(1).nullable().optional(),
});

export type CreateManagedUserInput = z.infer<typeof createManagedUserSchema>;

// Creació de diversos comptes alhora: un prefix ("Alumne 4A") i quants
// comptes crear; se'ls afegeix un número incremental ("Alumne 4A 1", ...).
export const createBulkUsersSchema = z.object({
  role: z.enum(["TEACHER", "STUDENT"]),
  prefix: z
    .string()
    .trim()
    .min(2, "El prefix ha de tenir com a mínim 2 caràcters.")
    .max(40, "El prefix és massa llarg.")
    .refine((value) => slugify(value, ".").length >= 2, "El prefix ha de contenir lletres o números."),
  count: z
    .number()
    .int("La quantitat ha de ser un nombre enter.")
    .min(1, "Cal crear com a mínim 1 compte.")
    .max(100, "No es poden crear més de 100 comptes alhora."),
  classroomId: z.string().min(1).nullable().optional(),
});

export type CreateBulkUsersInput = z.infer<typeof createBulkUsersSchema>;

export const setActiveSchema = z.object({
  isActive: z.boolean(),
});

export type SetActiveInput = z.infer<typeof setActiveSchema>;
