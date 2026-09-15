import "server-only";

/*
 * `NODE_ENV` sempre existeix (Next.js el defineix), així que no cal
 * validar-lo: es pot llegir directament i de forma seguríssima des de
 * qualsevol mòdul, fins i tot durant l'anàlisi de rutes en temps de build
 * (quan encara no hi ha cap altra variable d'entorn configurada, com
 * `DATABASE_URL`).
 */
export const isProduction = process.env.NODE_ENV === "production";
