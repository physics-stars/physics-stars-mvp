import { z } from "zod";

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

export const setActiveSchema = z.object({
  isActive: z.boolean(),
});

export type SetActiveInput = z.infer<typeof setActiveSchema>;
