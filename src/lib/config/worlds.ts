/*
 * Llista dels "mons" del joc (els blocs temàtics de física que l'alumnat
 * va desbloquejant, p. ex. Cinemàtica). De moment és una llista estàtica
 * de configuració, no una taula de base de dades: encara no s'ha demanat
 * cap gestió (crear/editar) d'aquest contingut, així que no cal la
 * complexitat d'un model Prisma per a això. Si en el futur cal editar-los
 * dinàmicament, es pot convertir en un model `World` sense canviar com
 * es consumeix aquesta llista des de la pàgina del menú.
 */
export interface WorldDefinition {
  slug: string;
  name: string;
  description: string;
}

export const WORLDS: WorldDefinition[] = [
  {
    slug: "cinematica",
    name: "Cinemàtica",
    description: "Descobreix com es descriu el moviment: posició, velocitat i acceleració.",
  },
  {
    slug: "dinamica",
    name: "Dinàmica",
    description: "Investiga per què es mouen els objectes: forces i les lleis de Newton.",
  },
  {
    slug: "energia-i-treball",
    name: "Energia i Treball",
    description: "Aprèn com es transforma i es conserva l'energia en els sistemes físics.",
  },
  {
    slug: "ones-i-so",
    name: "Ones i So",
    description: "Explora com viatja el so i com es comporten les ones.",
  },
  {
    slug: "electricitat",
    name: "Electricitat",
    description: "Endinsa't en els circuits elèctrics i les seves lleis fonamentals.",
  },
];
