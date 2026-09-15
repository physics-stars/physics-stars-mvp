import { z } from "zod";

/*
 * Esquemes de validació (Zod) per a les dades d'entrada del sistema
 * d'autenticació. Validar al backend és imprescindible: mai ens podem
 * refiar només de la validació feta al formulari del frontend.
 */

export const loginSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, "El nom d'usuari ha de tenir com a mínim 3 caràcters.")
    .max(64, "El nom d'usuari és massa llarg."),
  password: z
    .string()
    .min(8, "La contrasenya ha de tenir com a mínim 8 caràcters.")
    .max(128, "La contrasenya és massa llarga."),
});

export type LoginInput = z.infer<typeof loginSchema>;
