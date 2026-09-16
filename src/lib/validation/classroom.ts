import { z } from "zod";

/*
 * Esquemes de validació (Zod) per a la gestió d'aules: crear-ne una i
 * moure alumnat entre aules (o treure'l a "sense aula").
 */

export const createClassroomSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "El nom de l'aula ha de tenir com a mínim 2 caràcters.")
    .max(80, "El nom de l'aula és massa llarg."),
});

export type CreateClassroomInput = z.infer<typeof createClassroomSchema>;

export const moveStudentsSchema = z.object({
  studentIds: z
    .array(z.string().min(1))
    .min(1, "Selecciona com a mínim un alumne.")
    .max(200, "No es poden moure més de 200 alumnes alhora."),
  // `null` = treure l'alumnat de la seva aula actual (queda "sense aula").
  classroomId: z.string().min(1).nullable(),
});

export type MoveStudentsInput = z.infer<typeof moveStudentsSchema>;
