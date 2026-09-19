import type { ReactNode } from "react";
import { clsx } from "@/lib/utils/clsx";

/*
 * Bloc principal d'una pàgina de gestió: capçalera (títol, descripció,
 * accions) separada visualment del contingut. Es fa servir per a cada
 * "secció" perquè quedi clar on comença i acaba cada cosa.
 */
interface SectionCardProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  id?: string;
  className?: string;
}

export function SectionCard({
  title,
  description,
  icon,
  actions,
  children,
  id,
  className,
}: SectionCardProps) {
  return (
    <section
      id={id}
      className={clsx(
        "overflow-hidden rounded-2xl border border-border-subtle bg-background-elevated/60 shadow-[0_2px_8px_-4px_rgba(53,40,26,0.25)]",
        className,
      )}
    >
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border-subtle bg-background-elevated px-5 py-4">
        <div className="flex items-center gap-3">
          {icon && (
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-wood/10 text-wood">
              {icon}
            </span>
          )}
          <div>
            <h2 className="heading-display text-lg font-bold text-foreground">{title}</h2>
            {description && <p className="text-sm text-foreground-muted">{description}</p>}
          </div>
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </header>
      <div className="p-5">{children}</div>
    </section>
  );
}
