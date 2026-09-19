import "server-only";
import type { PrismaClient } from "@prisma/client";
import { createPrismaClient } from "@/lib/db/create-prisma-client";

/*
 * Client de Prisma (Neon Postgres) com a singleton per a l'aplicació
 * Next.js, reutilitzant `createPrismaClient()` (vegeu create-prisma-client.ts
 * per als detalls de la connexió via driver adapter).
 *
 * IMPORTANT: la connexió real (i, per tant, la lectura de `DATABASE_URL`)
 * es fa de manera "mandrosa", només quan alguna consulta l'utilitza per
 * primer cop. Així, l'aplicació es pot compilar i les pàgines públiques
 * poden funcionar encara que la base de dades no s'hagi connectat
 * (p. ex. abans de configurar la integració de Neon a Vercel).
 *
 * En desenvolupament, Next.js recarrega mòduls en calent (HMR), i si
 * creéssim un client nou cada vegada acabaríem obrint desenes de
 * connexions. Per evitar-ho, el guardem a `globalThis` i el reutilitzem
 * entre recàrregues.
 */
declare global {
  // eslint-disable-next-line no-var
  var __prismaClient: PrismaClient | undefined;
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
  get(_target, property) {
    const client = getPrismaClient();
    const value = Reflect.get(client as object, property, client);
    // Els mètodes (p. ex. `$transaction`) s'han d'executar amb el client
    // real com a `this`, no amb aquest proxy.
    return typeof value === "function" ? value.bind(client) : value;
  },
});
