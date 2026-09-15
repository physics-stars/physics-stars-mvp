import "server-only";
import { neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";
import ws from "ws";
import { z } from "zod";

/*
 * Client de Prisma (Neon Postgres) com a singleton, connectat mitjançant
 * el "driver adapter" oficial de Neon (@prisma/adapter-neon).
 *
 * Des de Prisma 7 cal indicar explícitament com es connecta el client
 * (ja no n'hi ha prou amb una URL al schema). S'utilitza el driver
 * serverless de Neon (WebSockets) en lloc d'una connexió TCP tradicional
 * perquè és el mètode recomanat per a entorns serverless com Vercel:
 * evita mantenir connexions obertes entre invocacions i funciona bé amb
 * la connexió agrupada (pooler) de Neon.
 *
 * IMPORTANT: la connexió real (i, per tant, la lectura de `DATABASE_URL`)
 * es fa de manera "mandrosa", només quan alguna consulta l'utilitza per
 * primer cop. Així, l'aplicació es pot compilar i les pàgines públiques
 * poden funcionar encara que la base de dades no s'hagi connectat
 * (p. ex. abans de configurar la integració de Neon a Vercel).
 */
declare global {
  // eslint-disable-next-line no-var
  var __prismaClient: PrismaClient | undefined;
}

neonConfig.webSocketConstructor = ws;

const databaseUrlSchema = z.string().min(
  1,
  "Falta la variable d'entorn DATABASE_URL (connexió agrupada a Neon).",
);

function createPrismaClient(): PrismaClient {
  const connectionString = databaseUrlSchema.parse(process.env.DATABASE_URL);
  const adapter = new PrismaNeon({ connectionString });
  return new PrismaClient({ adapter });
}

function getPrismaClient(): PrismaClient {
  if (!globalThis.__prismaClient) {
    globalThis.__prismaClient = createPrismaClient();
  }
  return globalThis.__prismaClient;
}

// Proxy que retarda la creació real del client fins al primer ús
// (p. ex. `prisma.user.findUnique(...)`), en lloc de crear-lo en
// importar aquest mòdul.
export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, property, receiver) {
    return Reflect.get(getPrismaClient() as object, property, receiver);
  },
});
