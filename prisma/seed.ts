import "dotenv/config";
import { createPrismaClient } from "../src/lib/db/create-prisma-client";
import { hashPassword } from "../src/server/security/password";

/*
 * Script de seed: crea comptes de prova (un de cada rol) i una aula
 * d'exemple, perquè es pugui provar tot el flux (login, gestió d'aules,
 * vista global) un cop la base de dades (Neon) estigui connectada.
 * S'executa amb `npm run db:seed`. NOMÉS pensat per a desenvolupament:
 * no s'ha d'executar mai contra una base de dades de producció real
 * amb aquestes contrasenyes d'exemple.
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
  const studentPasswordHash = await hashPassword("Estrella2026!");
  const teacherPasswordHash = await hashPassword("Cometa2026!");
  const adminPasswordHash = await hashPassword("Nebulosa2026!");

  const teacher = await prisma.user.upsert({
    where: { username: "demo.professor" },
    update: {},
    create: {
      username: "demo.professor",
      passwordHash: teacherPasswordHash,
      displayName: "Professor de prova",
      role: "TEACHER",
    },
  });

  await prisma.user.upsert({
    where: { username: "demo.admin" },
    update: {},
    create: {
      username: "demo.admin",
      passwordHash: adminPasswordHash,
      displayName: "Administrador de prova",
      role: "ADMIN",
    },
  });

  const classroom = await prisma.classroom.upsert({
    where: { id: "demo-classroom-1r-eso-a" },
    update: {},
    create: {
      id: "demo-classroom-1r-eso-a",
      name: "1r ESO A",
      teacherId: teacher.id,
    },
  });

  const student = await prisma.user.upsert({
    where: { username: "demo.alumne" },
    // Si l'alumne ja existia d'una execució anterior del seed (abans
    // d'afegir aules), s'assegura que quedi assignat a l'aula de prova.
    update: { classroomId: classroom.id },
    create: {
      username: "demo.alumne",
      passwordHash: studentPasswordHash,
      displayName: "Alumne de prova",
      role: "STUDENT",
      classroomId: classroom.id,
    },
  });

  console.log("Usuaris de prova creats:", {
    professor: teacher.username,
    admin: "demo.admin",
    alumne: student.username,
    aula: classroom.name,
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
