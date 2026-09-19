/*
 * Converteix un text lliure (p. ex. "Energia i Treball") en un "slug"
 * segur per a URLs i noms d'usuari: minúscules, sense accents, només
 * lletres/dígits i el separador indicat ("-" per defecte).
 * Retorna una cadena buida si no queda cap caràcter vàlid.
 */
export function slugify(text: string, separator: "-" | "." = "-"): string {
  const withoutAccents = text.normalize("NFD").replace(/[̀-ͯ]/g, "");
  const escapedSeparator = separator === "." ? "\\." : separator;

  return withoutAccents
    .toLowerCase()
    .trim()
    .replace(/\s+/g, separator)
    .replace(new RegExp(`[^a-z0-9${escapedSeparator}]`, "g"), "")
    .replace(new RegExp(`${escapedSeparator}{2,}`, "g"), separator)
    .replace(new RegExp(`^${escapedSeparator}|${escapedSeparator}$`, "g"), "");
}
