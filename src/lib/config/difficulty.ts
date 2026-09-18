import type { Difficulty } from "@prisma/client";

// Etiquetes en català per a l'enum `Difficulty` (els valors de l'enum
// no poden portar accents, així que es mapegen aquí per mostrar-los).
export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  FACIL: "Fàcil",
  MITJA: "Mitjà",
  DIFICIL: "Difícil",
};
