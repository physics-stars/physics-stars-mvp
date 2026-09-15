import "dotenv/config";
import { defineConfig } from "prisma/config";

/*
 * Configuració de la CLI de Prisma (migracions, seed, Prisma Studio...).
 * Des de Prisma 7, aquesta és la font de la URL de connexió per a la CLI;
 * l'aplicació en temps d'execució connecta per separat mitjançant un
 * "driver adapter" (vegeu src/lib/db/client.ts), que sí fa servir la
 * connexió agrupada (pooler) de Neon.
 *
 * Per a les migracions s'utilitza la connexió DIRECTA (sense pooler),
 * ja que el pooler de Neon (mode transacció) no admet certes operacions
 * necessàries per aplicar migracions de manera fiable.
 */
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? "",
  },
});
