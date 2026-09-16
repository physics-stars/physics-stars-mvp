import { randomInt } from "crypto";
import { findUserByUsername } from "@/server/repositories/user-repository";

/*
 * Generació de credencials llegibles per a comptes creats per un
 * admin/professor (alumnat i professorat no trien la seva pròpia
 * contrasenya). Es generen amb `crypto.randomInt` (aleatorietat
 * criptogràfica), no amb `Math.random`.
 */

// Paraules temàtiques (espai/física), sense accents ni caràcters
// especials perquè siguin fàcils d'escriure per alumnat de 4rt d'ESO.
const PASSWORD_WORDS = [
  "estel",
  "cometa",
  "planeta",
  "galaxia",
  "nebulosa",
  "orbita",
  "meteor",
  "quars",
  "foton",
  "nova",
  "pulsar",
  "asteroide",
];

// Genera una contrasenya en text pla (paraula + 4 dígits), p. ex.
// "cometa4821". Sempre supera els 8 caràcters mínims exigits pel
// formulari de login.
export function generatePlainPassword(): string {
  const word = PASSWORD_WORDS[randomInt(PASSWORD_WORDS.length)];
  const digits = randomInt(1000, 10000);
  return `${word}${digits}`;
}

// Converteix un nom (p. ex. "Maria García") en una base d'usuari vàlida
// ("maria.garcia"): minúscules, sense accents, espais com a punts,
// només lletres/dígits/punts.
function slugifyDisplayName(displayName: string): string {
  const withoutAccents = displayName
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");

  const slug = withoutAccents
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ".")
    .replace(/[^a-z0-9.]/g, "");

  return slug.length > 0 ? slug : "usuari";
}

// Genera un nom d'usuari únic a partir del nom mostrat, afegint un
// sufix numèric si ja existeix ("joan.puig", "joan.puig2", ...).
// Acotat a 50 intents per evitar un bucle infinit en un cas patològic.
export async function generateUniqueUsername(displayName: string): Promise<string> {
  const base = slugifyDisplayName(displayName);

  for (let attempt = 0; attempt < 50; attempt += 1) {
    const candidate = attempt === 0 ? base : `${base}${attempt + 1}`;
    const existing = await findUserByUsername(candidate);
    if (!existing) {
      return candidate;
    }
  }

  throw new Error("No s'ha pogut generar un nom d'usuari únic.");
}
