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

  // --- Mons i nivells ---
  // Només Cinemàtica té contingut real (2 nivells): és l'únic món
  // desenvolupat fins ara (Fase 2 del projecte). La resta queden
  // marcats com "Properament" (isAvailable: false), sense nivells.
  const worldsData = [
    {
      id: "world-cinematica",
      slug: "cinematica",
      name: "Cinemàtica",
      tagline: "Física del Moviment",
      shortDescription: "Velocitat i trajectòries.",
      description:
        "El primer món de Physics Stars: aprèn a descriure com es mouen els objectes " +
        "resolent reptes de velocitat, trajectòria i acceleració dins d'una història " +
        "que et posarà a prova a cada pas.",
      objectives: [
        "Comprendre els conceptes bàsics de la cinemàtica.",
        "Resoldre problemes de moviment rectilini i projectils.",
        "Aplicar les fórmules de velocitat, distància i temps en situacions reals.",
      ],
      order: 1,
      isAvailable: true,
    },
    {
      id: "world-dinamica",
      slug: "dinamica",
      name: "Dinàmica",
      tagline: "Lleis de Newton",
      shortDescription: "Forces i interaccions.",
      description: "Descobreix per què es mouen els objectes: forces i les lleis de Newton.",
      objectives: [],
      order: 2,
      isAvailable: false,
    },
    {
      id: "world-energia-i-treball",
      slug: "energia-i-treball",
      name: "Energia i Treball",
      tagline: "Conservació de l'Energia",
      shortDescription: "Energia i treball.",
      description: "Aprèn com es transforma i es conserva l'energia en els sistemes físics.",
      objectives: [],
      order: 3,
      isAvailable: false,
    },
    {
      id: "world-ones-i-so",
      slug: "ones-i-so",
      name: "Ones i So",
      tagline: "Fenòmens Ondulatoris",
      shortDescription: "Ones i vibracions.",
      description: "Explora com viatja el so i com es comporten les ones.",
      objectives: [],
      order: 4,
      isAvailable: false,
    },
    {
      id: "world-electricitat",
      slug: "electricitat",
      name: "Electricitat",
      tagline: "Circuits i Càrregues",
      shortDescription: "Circuits elèctrics.",
      description: "Endinsa't en els circuits elèctrics i les seves lleis fonamentals.",
      objectives: [],
      order: 5,
      isAvailable: false,
    },
  ];

  for (const worldData of worldsData) {
    const { id, ...rest } = worldData;
    await prisma.world.upsert({ where: { id }, update: rest, create: { id, ...rest } });
  }

  const levelsData = [
    {
      id: "level-cinematica-1",
      worldId: "world-cinematica",
      title: "El Tren Fantasma",
      levelNumber: 1,
      description:
        "Et trobes en un poble aïllat on el temps sembla haver-se aturat. Corre la " +
        "llegenda d'un comboi que es mou sense conductor. Hauràs d'aplicar els teus " +
        "coneixements de moviment rectilini uniforme per interceptar-lo.",
      difficulty: "FACIL" as const,
      order: 1,
      isAvailable: true,
    },
    {
      id: "level-cinematica-2",
      worldId: "world-cinematica",
      title: "Misteri a la Cova",
      levelNumber: 2,
      description:
        "Una força desconeguda bloqueja l'entrada a la cova. Necessitaràs dominar " +
        "l'acceleració per desxifrar els secrets que s'hi amaguen.",
      difficulty: "MITJA" as const,
      order: 2,
      isAvailable: true,
    },
  ];

  for (const levelData of levelsData) {
    const { id, ...rest } = levelData;
    await prisma.level.upsert({ where: { id }, update: rest, create: { id, ...rest } });
  }

  console.log("Usuaris de prova creats:", {
    professor: teacher.username,
    admin: "demo.admin",
    alumne: student.username,
    aula: classroom.name,
  });
  console.log(
    "Mons creats:",
    worldsData.map((w) => w.slug),
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
