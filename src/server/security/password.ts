import { hash, verify, type Options } from "@node-rs/argon2";

/*
 * Hashing de contrasenyes amb Argon2id.
 *
 * Argon2id és l'algorisme recomanat per l'OWASP (Password Storage Cheat
 * Sheet, 2024+) per emmagatzemar contrasenyes de forma segura, ja que
 * combina resistència als atacs per canal lateral (side-channel) i als
 * atacs per GPU. Els paràmetres següents són el mínim recomanat per
 * l'OWASP: memòria 19 MiB, 2 iteracions, paral·lelisme 1.
 *
 * S'utilitza el paquet @node-rs/argon2 (basat en Rust, amb binaris
 * precompilats) en lloc del paquet "argon2" clàssic perquè no necessita
 * compilar-se amb node-gyp durant el desplegament a Vercel.
 */
// Nota: no importem l'enum `Algorithm` del paquet (és un `const enum`,
// incompatible amb la compilació per fitxer aïllat que fa Next.js/SWC).
// El valor 2 correspon a Argon2id, tal com documenta el mateix paquet.
const ARGON2ID: Options["algorithm"] = 2;

const ARGON2_OPTIONS: Options = {
  algorithm: ARGON2ID,
  memoryCost: 19456, // 19 MiB
  timeCost: 2,
  parallelism: 1,
};

// Genera el hash d'una contrasenya en text pla per desar-lo a la base de dades.
export async function hashPassword(plainTextPassword: string): Promise<string> {
  return hash(plainTextPassword, ARGON2_OPTIONS);
}

// Comprova si una contrasenya en text pla coincideix amb un hash existent.
// No cal tornar a passar ARGON2_OPTIONS: els paràmetres (algorisme, memòria,
// iteracions...) ja van codificats dins la pròpia cadena del hash (format PHC).
export async function verifyPassword(
  storedHash: string,
  plainTextPassword: string,
): Promise<boolean> {
  return verify(storedHash, plainTextPassword);
}

// Hash "fictici" precalculat, usat quan un usuari no existeix.
// Verificar sempre una contrasenya (encara que sigui contra un hash fals)
// evita que un atacant pugui saber si un nom d'usuari existeix o no
// simplement mesurant el temps de resposta (atac de temporització).
let cachedDummyHash: Promise<string> | null = null;

export function getDummyHash(): Promise<string> {
  if (!cachedDummyHash) {
    cachedDummyHash = hashPassword("contrasenya-fictícia-per-seguretat-temporal");
  }
  return cachedDummyHash;
}
