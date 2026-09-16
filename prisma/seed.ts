import "dotenv/config";
import { createPrismaClient } from "../src/lib/db/create-prisma-client";
import { hashPassword } from "../src/server/security/password";

/*
 * Script de seed: crea un usuari de prova perquè es pugui provar el
 * login real un cop la base de dades (Neon) estigui connectada.
 * S'executa amb `npm run db:seed`. NOMÉS pensat per a desenvolupament:
 * no s'ha d'executar mai contra una base de dades de producció real
 * amb aquesta contrasenya d'exemple.
 *
 * Aquest script corre com un procés de Node independent (via tsx), fora
 * de Next.js: per això carrega `.env` explícitament (`dotenv/config`,
 * ja que aquí ningú ho fa automàticament) i crea el seu propi
 * PrismaClient amb `createPrismaClient()` en lloc del singleton de
 * `src/lib/db/client.ts` (guardat amb `import "server-only"`, pensat
 * només per córrer dins l'aplicació Next.js).
 */
const prisma = createPrismaClient();

async function main() {
  const passwordHash = await hashPassword("Estrella2026!");

  const demoUser = await prisma.user.upsert({
    where: { username: "demo.alumne" },
    update: {},
    create: {
      username: "demo.alumne",
      passwordHash,
      displayName: "Alumne de prova",
      role: "STUDENT",
    },
  });

  console.log("Usuari de prova creat:", demoUser.username);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
