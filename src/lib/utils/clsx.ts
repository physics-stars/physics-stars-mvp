/*
 * Petita utilitat per combinar classes de Tailwind condicionalment,
 * ignorant els valors falsy (undefined, false, cadena buida...).
 * Evita haver d'afegir una dependència externa (p. ex. "clsx") només per això.
 */
export function clsx(
  ...classes: Array<string | false | null | undefined>
): string {
  return classes.filter(Boolean).join(" ");
}
