import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";

/*
 * Crea una instància nova de `PrismaClient` connectada a Neon Postgres
 * mitjançant `pg` (node-postgres), el driver estàndard de PostgreSQL per
 * a Node.js, mitjançant una connexió TCP/TLS normal (no WebSockets).
 *
 * Es fa servir aquest driver en lloc del driver "serverless" propi de
 * Neon perquè l'aplicació sempre s'executa en el runtime de Node.js
 * (mai a l'Edge), i `pg` és més senzill i més provat en producció; la
 * connexió agrupada (pooler) de Neon és, de fet, un punt d'accés
 * PostgreSQL estàndard, així que funciona perfectament amb `pg`.
 *
 * Aquest fitxer, a diferència de `client.ts`, NO porta `import "server-only"`
 * perquè també el necessita l'script de seed (`prisma/seed.ts`), que
 * s'executa com un script de Node independent (via tsx) i no passa mai
 * pel bundler de Next.js, on `server-only` fallaria en importar-se.
 */
const databaseUrlSchema = z.string().min(
  1,
  "Falta la variable d'entorn DATABASE_URL (connexió agrupada a Neon).",
);

export function createPrismaClient(): PrismaClient {
  const connectionString = databaseUrlSchema.parse(process.env.DATABASE_URL);
  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
}
