import { clsx } from "@/lib/utils/clsx";

/*
 * Capçalera de secció reutilitzada a tota la landing (Missió,
 * Diferenciació, Roadmap, Equip, Contacte): una etiqueta petita seguida
 * d'un títol gran. Un únic patró en lloc d'una metàfora visual diferent
 * per secció, perquè la pàgina tingui una identitat coherent.
 */
interface SectionHeadingProps {
  eyebrow: string;
  title: string;
  description?: string;
  align?: "center" | "left";
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "center",
}: SectionHeadingProps) {
  return (
    <div
      className={clsx(
        "flex flex-col gap-3",
        align === "center" ? "items-center text-center" : "items-start text-left",
      )}
    >
      <span className="eyebrow">{eyebrow}</span>
      <h2 className="heading-display text-3xl font-bold text-foreground sm:text-4xl">{title}</h2>
      {description && (
        <p
          className={clsx(
            "max-w-2xl text-foreground-muted",
            align === "center" && "mx-auto",
          )}
        >
          {description}
        </p>
      )}
    </div>
  );
}
